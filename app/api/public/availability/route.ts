import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeedData } from "@/db/seed";
import { availabilitySlots, bookings } from "@/db/schema";
import { isPublicIntakeEnabled } from "@/lib/intake-status";

export const dynamic = "force-dynamic";
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  if (!isPublicIntakeEnabled()) return NextResponse.json({ times: [] }, { headers: { "Cache-Control": "no-store" } });
  const date = new URL(request.url).searchParams.get("date") ?? "";
  const parsedDate = datePattern.test(date) ? new Date(`${date}T12:00:00Z`) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return NextResponse.json({ error: "Choose a valid date.", times: [] }, { status: 400 });
  }
  try {
    await ensureSeedData();
    const day = new Date(`${date}T12:00:00Z`).getUTCDay();
    const slots = await getDb().select({ time: availabilitySlots.localTime }).from(availabilitySlots)
      .where(and(eq(availabilitySlots.weekday, day), eq(availabilitySlots.active, true))).all();
    const taken = await getDb().select({ time: bookings.sessionTime }).from(bookings)
      .where(and(eq(bookings.sessionDate, date), eq(bookings.status, "REQUESTED"))).all();
    const confirmed = await getDb().select({ time: bookings.sessionTime }).from(bookings)
      .where(and(eq(bookings.sessionDate, date), eq(bookings.status, "CONFIRMED"))).all();
    const occupied = new Set([...taken, ...confirmed].map((row) => row.time));
    return NextResponse.json({ times: slots.map((slot) => slot.time).filter((time) => !occupied.has(time)) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Availability is temporarily unavailable.", times: [] }, { status: 503 });
  }
}
