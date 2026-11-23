import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { feedback } from "@/db/schema";
import { encryptIntake } from "@/lib/security";
import { feedbackSchema } from "@/lib/validators";
import { isPublicIntakeEnabled } from "@/lib/intake-status";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!isPublicIntakeEnabled()) return NextResponse.json({ error: "Feedback submissions are temporarily closed." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 10_000) return NextResponse.json({ error: "Feedback is too long." }, { status: 413 });
  let body: unknown;
  try { const raw = await request.text(); if (new TextEncoder().encode(raw).byteLength > 10_000) return NextResponse.json({ error: "Feedback is too long." }, { status: 413 }); body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Send valid feedback." }, { status: 400 }); }
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the feedback form and consent." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ received: true }, { status: 201 });
  try {
    const { website: _website, ...safe } = parsed.data;
    await getDb().insert(feedback).values({ id: crypto.randomUUID(), encryptedPayload: await encryptIntake(safe), rating: safe.rating }).run();
    return NextResponse.json({ received: true }, { status: 201 });
  } catch { return NextResponse.json({ error: "Feedback could not be saved right now." }, { status: 503 }); }
}
