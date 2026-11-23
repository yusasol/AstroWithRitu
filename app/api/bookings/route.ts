import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { ensureSeedData } from "@/db/seed";
import { availabilitySlots, bookings, customers, services } from "@/db/schema";
import { encryptIntake, hashContact } from "@/lib/security";
import { bookingRequestSchema } from "@/lib/validators";
import { isPublicIntakeEnabled } from "@/lib/intake-status";

export const dynamic = "force-dynamic";
function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function validCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function POST(request: Request) {
  if (!isPublicIntakeEnabled()) return NextResponse.json({ error: "Consultation requests are temporarily closed." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const origin = request.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).origin !== new URL(request.url).origin) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 }); }
    catch { return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
  }
  if (Number(request.headers.get("content-length") || 0) > 12_000) return NextResponse.json({ error: "The request is too large." }, { status: 413 });
  let input: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 12_000) return NextResponse.json({ error: "The request is too large." }, { status: 413 });
    input = JSON.parse(raw);
  } catch { return NextResponse.json({ error: "Send a valid booking request." }, { status: 400 }); }
  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Check the form fields and consent statement." }, { status: 400 });
  const value = parsed.data;
  if (value.website) return NextResponse.json({ reference: `AR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: "REQUESTED" }, { status: 201 });
  if (!validCalendarDate(value.sessionDate) || !validCalendarDate(value.birthDate) || value.sessionDate <= todayInIndia() || value.birthDate > todayInIndia()) {
    return NextResponse.json({ error: "Check the requested date and birth date." }, { status: 400 });
  }
  if (!env.INTAKE_ENCRYPTION_KEY) return NextResponse.json({ error: "Secure booking intake is not configured. Please contact the practitioner." }, { status: 503 });
  try {
    await ensureSeedData();
    const db = getDb();
    const service = await db.select({ id: services.id }).from(services)
      .where(and(eq(services.id, value.serviceId), eq(services.active, true))).limit(1).all();
    if (!service.length) return NextResponse.json({ error: "Choose an active consultation." }, { status: 400 });
    const weekday = new Date(`${value.sessionDate}T12:00:00Z`).getUTCDay();
    const validSlot = await db.select({ id: availabilitySlots.id }).from(availabilitySlots)
      .where(and(eq(availabilitySlots.weekday, weekday), eq(availabilitySlots.localTime, value.sessionTime), eq(availabilitySlots.active, true))).limit(1).all();
    if (!validSlot.length) return NextResponse.json({ error: "That time is not available. Choose another slot." }, { status: 409 });
    const encryptedPayload = await encryptIntake({
      name: value.name, contact: value.contact, birthDate: value.birthDate,
      birthTime: value.timeUnknown ? null : value.birthTime, birthTimeUnknown: value.timeUnknown,
      birthPlace: value.birthPlace, question: value.question, consentAt: new Date().toISOString(),
    });
    const contactHash = await hashContact(value.contact);
    const customerCipher = await encryptIntake({ name: value.name, contact: value.contact, lastQuestion: value.question });
    await db.insert(customers).values({ id: crypto.randomUUID(), contactHash, encryptedPayload: customerCipher }).onConflictDoNothing().run();
    const customer = await db.select({ id: customers.id }).from(customers).where(eq(customers.contactHash, contactHash)).limit(1).all();
    if (!customer[0]) throw new Error("Could not safely associate this enquiry with a customer record.");
    const id = crypto.randomUUID();
    await db.insert(bookings).values({ id, customerId: customer[0].id, serviceId: value.serviceId, sessionDate: value.sessionDate, sessionTime: value.sessionTime, encryptedPayload, status: "REQUESTED", paymentStatus: "PENDING" }).run();
    return NextResponse.json({ reference: `AR-${id.slice(0, 8).toUpperCase()}`, status: "REQUESTED" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE") || message.includes("unique")) return NextResponse.json({ error: "That slot was just requested. Please select another time." }, { status: 409 });
    return NextResponse.json({ error: "Your request could not be saved. Please try again later." }, { status: 500 });
  }
}
