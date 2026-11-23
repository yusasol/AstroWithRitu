import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { bookings, services } from "@/db/schema";
import { decryptIntake } from "@/lib/security";
import { isSiteOwner } from "@/lib/admin-auth";
import { bookingStatusSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  if (!isSiteOwner(request)) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: noStore });
  try {
    const rows = await getDb().select({ id: bookings.id, serviceId: bookings.serviceId, serviceName: services.name, date: bookings.sessionDate, time: bookings.sessionTime, encryptedPayload: bookings.encryptedPayload, status: bookings.status, paymentStatus: bookings.paymentStatus, meetingUrl: bookings.meetingUrl, createdAt: bookings.createdAt })
      .from(bookings).leftJoin(services, eq(bookings.serviceId, services.id)).orderBy(desc(bookings.createdAt)).limit(50).all();
    const output = await Promise.all(rows.map(async (row) => {
      let intake: Record<string, unknown> = {};
      try { intake = await decryptIntake(row.encryptedPayload); } catch { intake = { intakeUnavailable: true }; }
      return { ...row, encryptedPayload: undefined, ...intake };
    }));
    return NextResponse.json({ bookings: output }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Could not load consultation requests." }, { status: 503, headers: noStore });
  }
}

export async function PATCH(request: Request) {
  if (!isSiteOwner(request)) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: noStore });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Send a valid update." }, { status: 400, headers: noStore }); }
  const parsed = bookingStatusSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request update." }, { status: 400, headers: noStore });
  try {
    await getDb().update(bookings).set({ status: parsed.data.status, updatedAt: new Date().toISOString() }).where(eq(bookings.id, parsed.data.id)).run();
    return NextResponse.json({ updated: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Could not update this request." }, { status: 500, headers: noStore });
  }
}
