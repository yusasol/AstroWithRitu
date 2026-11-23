import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await getSiteContent();
    return NextResponse.json(content, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Site content is temporarily unavailable." }, { status: 503 });
  }
}
