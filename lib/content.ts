import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSeedData } from "@/db/seed";
import { availabilitySlots, blogPosts, faqs, policies, services, siteSettings, testimonials } from "@/db/schema";
import type { PublicContent } from "@/lib/types";

export async function getSiteContent(): Promise<PublicContent> {
  await ensureSeedData();
  const db = getDb();
  const [settings, serviceRows, testimonialRows, faqRows, policyRows, posts] = await Promise.all([
    db.select().from(siteSettings).where(eq(siteSettings.id, "main")).get(),
    db.select().from(services).orderBy(asc(services.sortOrder)).all(),
    db.select().from(testimonials).where(eq(testimonials.published, true)).orderBy(asc(testimonials.sortOrder)).all(),
    db.select().from(faqs).where(eq(faqs.published, true)).orderBy(asc(faqs.sortOrder)).all(),
    db.select().from(policies).where(eq(policies.published, true)).orderBy(asc(policies.sortOrder)).all(),
    db.select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.createdAt)).limit(6).all(),
  ]);
  if (!settings) throw new Error("Site settings are not initialized.");
  return { settings, services: serviceRows.filter((service) => service.active), testimonials: testimonialRows, faqs: faqRows, policies: policyRows, posts };
}

export async function getAvailabilityForDate(date: string) {
  await ensureSeedData();
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return getDb().select().from(availabilitySlots).where(eq(availabilitySlots.weekday, day)).orderBy(asc(availabilitySlots.localTime)).all();
}
