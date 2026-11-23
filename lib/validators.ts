import { z } from "zod";

const safeText = (max: number) => z.string().trim().min(1).max(max);
export const bookingRequestSchema = z.object({
  name: safeText(100),
  contact: safeText(160),
  serviceId: safeText(80),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().or(z.literal("")),
  timeUnknown: z.boolean(),
  birthPlace: safeText(160),
  question: z.string().max(1500).default(""),
  consent: z.literal(true),
  adultConfirmed: z.literal(true),
  website: z.string().max(200).default(""),
}).refine((value) => value.timeUnknown || Boolean(value.birthTime), { path: ["birthTime"], message: "Provide the birth time or mark it unknown." });

export const settingsSchema = z.object({
  brandName: safeText(100), practitionerName: safeText(100), city: z.string().trim().max(120),
  contactEmail: z.union([z.literal(""), z.string().email().max(160)]), contactPhone: z.string().max(50), tagline: safeText(180),
  heroHeading: safeText(220), heroCopy: safeText(1200), aboutHeading: safeText(180), aboutCopy: safeText(1800), demoBanner: z.string().max(200),
  instagramUrl: z.union([z.literal(""), z.string().url().max(300).refine((url) => url.startsWith("https://"))]).default(""), youtubeUrl: z.union([z.literal(""), z.string().url().max(300).refine((url) => url.startsWith("https://"))]).default(""), featuredVideoUrl: z.union([z.literal(""), z.string().url().max(300).refine((url) => url.startsWith("https://"))]).default(""), upiId: z.string().max(160).regex(/^$|^[\w.-]+@[\w.-]+$/).default(""), consultationLocation: z.string().max(300).default(""),
});
export const serviceSchema = z.object({
  id: safeText(80), slug: z.string().regex(/^[a-z0-9-]{2,100}$/), name: safeText(120), description: safeText(1000),
  durationMinutes: z.number().int().min(15).max(360), priceRupees: z.number().min(0).max(1000000), mode: safeText(40),
  active: z.boolean(), sortOrder: z.number().int().min(0).max(100),
  externalPaymentUrl: z.union([z.literal(""), z.string().url().refine((url) => url.startsWith("https://"))]).optional(),
});
const textListSchema = <T extends z.ZodTypeAny>(item: T, max: number) => z.array(item).max(max);
export const contentSchema = z.object({
  settings: settingsSchema,
  services: textListSchema(serviceSchema, 30),
  testimonials: textListSchema(z.object({ id: safeText(80), quote: safeText(1000), attribution: safeText(120), published: z.boolean(), sortOrder: z.number().int().min(0).max(100) }), 30),
  faqs: textListSchema(z.object({ id: safeText(80), question: safeText(250), answer: safeText(1500), published: z.boolean(), sortOrder: z.number().int().min(0).max(100) }), 30),
  policies: textListSchema(z.object({ id: safeText(80), title: safeText(150), body: safeText(2000), published: z.boolean(), sortOrder: z.number().int().min(0).max(100) }), 20),
  availability: textListSchema(z.object({ id: safeText(80), weekday: z.number().int().min(0).max(6), localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), active: z.boolean() }), 100),
});
export const bookingStatusSchema = z.object({ id: z.string().uuid(), status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]) });
export const postSchema = z.object({ id: safeText(80), slug: z.string().regex(/^[a-z0-9-]{2,100}$/), title: safeText(180), excerpt: z.string().max(500), body: safeText(12000), videoUrl: z.string().max(300), published: z.boolean(), createdAt: z.string().max(50).optional() });
export const postsSchema = z.array(postSchema).max(100);
export const feedbackSchema = z.object({ name: safeText(100), contact: z.string().max(160).default(""), review: safeText(1200), rating: z.number().int().min(1).max(5), consentToPublish: z.literal(true), website: z.string().max(200).default("") });
export const paymentSchema = z.object({ customerId: safeText(80), bookingId: z.string().max(80).optional().default(""), amountRupees: z.number().int().min(1).max(1000000), method: z.enum(["UPI", "CASH", "OTHER"]), reference: z.string().max(100).default(""), note: z.string().max(500).default(""), status: z.literal("PENDING").default("PENDING") });
