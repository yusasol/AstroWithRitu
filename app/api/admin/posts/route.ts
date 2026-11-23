import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { blogPosts } from "@/db/schema";
import { isSiteOwner } from "@/lib/admin-auth";
import { postsSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  if (!isSiteOwner(request)) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: noStore });
  try { return NextResponse.json({ posts: await getDb().select().from(blogPosts).orderBy(desc(blogPosts.createdAt)).all() }, { headers: noStore }); }
  catch { return NextResponse.json({ error: "Could not load articles." }, { status: 503, headers: noStore }); }
}
export async function PUT(request: Request) {
  if (!isSiteOwner(request)) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: noStore });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send valid article data." }, { status: 400 }); }
  const parsed = postsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check article titles, slugs and content." }, { status: 400 });
  const d1 = env.DB;
  if (!d1) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const now = new Date().toISOString();
  const statements = [d1.prepare("DELETE FROM blog_posts")];
  for (const post of parsed.data) statements.push(d1.prepare("INSERT INTO blog_posts (id, slug, title, excerpt, body, video_url, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(post.id, post.slug, post.title, post.excerpt, post.body, post.videoUrl, post.published ? 1 : 0, post.createdAt || now, now));
  try { await d1.batch(statements); return NextResponse.json({ saved: true }, { headers: noStore }); }
  catch { return NextResponse.json({ error: "Could not save articles. Ensure each published article has a unique URL slug." }, { status: 409, headers: noStore }); }
}
