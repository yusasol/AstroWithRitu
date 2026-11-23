import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { bookings, customers, payments } from "@/db/schema";
import { isSiteOwner } from "@/lib/admin-auth";
import { decryptIntake, encryptIntake } from "@/lib/security";
import { paymentSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  if (!isSiteOwner(request)) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: noStore });
  try {
    const rows = await getDb().select({ payment: payments, customer: customers.encryptedPayload, bookingDate: bookings.sessionDate })
      .from(payments).leftJoin(customers, eq(payments.customerId, customers.id)).leftJoin(bookings, eq(payments.bookingId, bookings.id)).orderBy(desc(payments.receivedAt)).limit(500).all();
    const result = await Promise.all(rows.map(async (row) => ({ ...row.payment, reference: row.payment.encryptedReference ? (await decryptIntake(row.payment.encryptedReference)).reference as string : "", customer: row.customer ? await decryptIntake(row.customer) : {}, bookingDate: row.bookingDate })));
    return NextResponse.json({ payments: result }, { headers: noStore });
  } catch { return NextResponse.json({ error: "Could not load payment records." }, { status: 503, headers: noStore }); }
}
export async function POST(request: Request) {
  if (!isSiteOwner(request)) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: noStore });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send valid payment details." }, { status: 400 }); }
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the customer, amount and payment reference." }, { status: 400 });
  try {
    const db = getDb();
    const customer = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, parsed.data.customerId)).limit(1).all();
    if (!customer.length) return NextResponse.json({ error: "Choose an existing customer." }, { status: 404 });
    const id = crypto.randomUUID();
    const reference = parsed.data.reference ? await encryptIntake({ reference: parsed.data.reference.trim() }) : "";
    await db.insert(payments).values({ id, customerId: parsed.data.customerId, bookingId: parsed.data.bookingId || null, amountRupees: parsed.data.amountRupees, method: parsed.data.method, status: "PENDING", encryptedReference: reference, note: parsed.data.note, verifiedAt: null }).run();
    return NextResponse.json({ saved: true, id }, { status: 201, headers: noStore });
  } catch { return NextResponse.json({ error: "Could not save payment record." }, { status: 500, headers: noStore }); }
}
export async function PATCH(request: Request) {
  if (!isSiteOwner(request)) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: noStore });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid payment update." }, { status: 400 }); }
  const value = body as { id?: unknown; status?: unknown };
  if (typeof value.id !== "string" || !["PENDING", "VERIFIED", "REJECTED", "REFUNDED"].includes(String(value.status))) return NextResponse.json({ error: "Invalid payment update." }, { status: 400 });
  try {
    const db = getDb();
    const current = await db.select({ bookingId: payments.bookingId }).from(payments).where(eq(payments.id, value.id)).limit(1).all();
    await db.update(payments).set({ status: value.status as "PENDING" | "VERIFIED" | "REJECTED" | "REFUNDED", verifiedAt: value.status === "VERIFIED" ? new Date().toISOString() : null }).where(eq(payments.id, value.id)).run();
    if (current[0]?.bookingId && (value.status === "VERIFIED" || value.status === "REFUNDED")) await db.update(bookings).set({ paymentStatus: value.status === "VERIFIED" ? "PAID" : "REFUNDED", updatedAt: new Date().toISOString() }).where(eq(bookings.id, current[0].bookingId)).run();
    return NextResponse.json({ saved: true }, { headers: noStore });
  }
  catch { return NextResponse.json({ error: "Could not update payment status." }, { status: 500, headers: noStore }); }
}
