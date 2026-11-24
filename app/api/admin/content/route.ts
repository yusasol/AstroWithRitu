import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";
import { ensureSeedData } from "@/db/seed";
import { getDb } from "@/db";
import { availabilitySlots, services } from "@/db/schema";
import { getSiteContent } from "@/lib/content";
import { isSiteOwner } from "@/lib/admin-auth";
import { contentSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  if (!(await isSiteOwner(request))) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: noStore });
  try {
    await ensureSeedData();
    const [content, allServices, availability] = await Promise.all([getSiteContent(), getDb().select().from(services).all(), getDb().select().from(availabilitySlots).all()]);
    return NextResponse.json({ ...content, services: allServices, availability }, { headers: noStore });
  }
  catch { return NextResponse.json({ error: "Could not load site content." }, { status: 503, headers: noStore }); }
}

export async function PUT(request: Request) {
  if (!(await isSiteOwner(request))) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: noStore });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 200_000) return NextResponse.json({ error: "The content update is too large." }, { status: 413, headers: noStore });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Send valid JSON content." }, { status: 400, headers: noStore }); }
  const parsed = contentSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Some fields are invalid or too long. Review the form and try again." }, { status: 400, headers: noStore });
  const d1 = env.DB;
  if (!d1) return NextResponse.json({ error: "The database is not configured." }, { status: 503, headers: noStore });
  try {
    await ensureSeedData();
    const { settings, services, testimonials, faqs, policies, availability } = parsed.data;
    const statements = [
      d1.prepare("UPDATE site_settings SET brand_name=?, practitioner_name=?, city=?, contact_email=?, contact_phone=?, tagline=?, hero_heading=?, hero_copy=?, about_heading=?, about_copy=?, demo_banner=?, instagram_url=?, youtube_url=?, featured_video_url=?, upi_id=?, consultation_location=?, updated_at=? WHERE id='main'")
        .bind(settings.brandName, settings.practitionerName, settings.city, settings.contactEmail, settings.contactPhone, settings.tagline, settings.heroHeading, settings.heroCopy, settings.aboutHeading, settings.aboutCopy, settings.demoBanner, settings.instagramUrl, settings.youtubeUrl, settings.featuredVideoUrl, settings.upiId, settings.consultationLocation, new Date().toISOString()),
      d1.prepare("DELETE FROM services"), d1.prepare("DELETE FROM testimonials"), d1.prepare("DELETE FROM faqs"), d1.prepare("DELETE FROM policies"), d1.prepare("DELETE FROM availability_slots"),
      ...services.map((s) => d1.prepare("INSERT INTO services (id, slug, name, description, duration_minutes, price_rupees, mode, active, sort_order, external_payment_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(s.id, s.slug, s.name, s.description, s.durationMinutes, s.priceRupees, s.mode, s.active ? 1 : 0, s.sortOrder, s.externalPaymentUrl || null)),
      ...testimonials.map((t) => d1.prepare("INSERT INTO testimonials (id, quote, attribution, published, sort_order) VALUES (?, ?, ?, ?, ?)").bind(t.id, t.quote, t.attribution, t.published ? 1 : 0, t.sortOrder)),
      ...faqs.map((f) => d1.prepare("INSERT INTO faqs (id, question, answer, published, sort_order) VALUES (?, ?, ?, ?, ?)").bind(f.id, f.question, f.answer, f.published ? 1 : 0, f.sortOrder)),
      ...policies.map((p) => d1.prepare("INSERT INTO policies (id, title, body, published, sort_order) VALUES (?, ?, ?, ?, ?)").bind(p.id, p.title, p.body, p.published ? 1 : 0, p.sortOrder)),
      ...availability.map((slot) => d1.prepare("INSERT INTO availability_slots (id, weekday, local_time, active) VALUES (?, ?, ?, ?)").bind(slot.id, slot.weekday, slot.localTime, slot.active ? 1 : 0)),
    ];
    await d1.batch(statements);
    return NextResponse.json({ saved: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Could not save these changes. Check for duplicate service or availability IDs." }, { status: 500, headers: noStore });
  }
}
