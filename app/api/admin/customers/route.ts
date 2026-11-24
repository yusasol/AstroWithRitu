import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { isSiteOwner } from "@/lib/admin-auth";
import { decryptIntake } from "@/lib/security";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!(await isSiteOwner(request))) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  try {
    const rows = await getDb().select().from(customers).orderBy(desc(customers.updatedAt)).limit(250).all();
    const records = await Promise.all(rows.map(async (row) => ({ id: row.id, createdAt: row.createdAt, updatedAt: row.updatedAt, ...(await decryptIntake(row.encryptedPayload)) })));
    return NextResponse.json({ customers: records }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Could not load customer records." }, { status: 503 }); }
}
