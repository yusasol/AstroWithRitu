import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { feedback, testimonials } from "@/db/schema";
import { isSiteOwner } from "@/lib/admin-auth";
import { decryptIntake } from "@/lib/security";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  if (!(await isSiteOwner(request))) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: noStore });
  try { const rows = await getDb().select().from(feedback).orderBy(desc(feedback.createdAt)).limit(200).all(); const items = await Promise.all(rows.map(async (item) => ({ id: item.id, status: item.status, rating: item.rating, createdAt: item.createdAt, ...(await decryptIntake(item.encryptedPayload)) }))); return NextResponse.json({ feedback: items }, { headers: noStore }); }
  catch { return NextResponse.json({ error: "Could not load feedback." }, { status: 503, headers: noStore }); }
}
export async function PATCH(request: Request) {
  if (!(await isSiteOwner(request))) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: noStore });
  let body: { id?: unknown; status?: unknown };
  try { body = await request.json() as { id?: unknown; status?: unknown }; } catch { return NextResponse.json({ error: "Send a valid review update." }, { status: 400 }); }
  if (typeof body.id !== "string" || !["APPROVED", "REJECTED"].includes(String(body.status))) return NextResponse.json({ error: "Invalid review status." }, { status: 400 });
  const db = getDb();
  try {
    const item = await db.select().from(feedback).where(eq(feedback.id, body.id)).limit(1).all();
    if (!item[0]) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    const content = await decryptIntake(item[0].encryptedPayload);
    if (body.status === "APPROVED" && content.consentToPublish !== true) return NextResponse.json({ error: "This customer did not consent to publication." }, { status: 400 });
    if (body.status === "APPROVED") await db.insert(testimonials).values({ id: `feedback-${item[0].id}`, quote: String(content.review || ""), attribution: String(content.name || "Client"), published: true, sortOrder: Date.now() % 100000 }).onConflictDoNothing().run();
    await db.update(feedback).set({ status: body.status as "APPROVED" | "REJECTED", reviewedAt: new Date().toISOString() }).where(eq(feedback.id, body.id)).run();
    return NextResponse.json({ saved: true }, { headers: noStore });
  } catch { return NextResponse.json({ error: "Could not update feedback." }, { status: 500 }); }
}
