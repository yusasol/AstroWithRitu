import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const siteSettings = sqliteTable("site_settings", {
  id: text("id").primaryKey().notNull(),
  brandName: text("brand_name").notNull(),
  practitionerName: text("practitioner_name").notNull(),
  city: text("city").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  tagline: text("tagline").notNull(),
  heroHeading: text("hero_heading").notNull(),
  heroCopy: text("hero_copy").notNull(),
  aboutHeading: text("about_heading").notNull(),
  aboutCopy: text("about_copy").notNull(),
  demoBanner: text("demo_banner").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  youtubeUrl: text("youtube_url").notNull().default(""),
  featuredVideoUrl: text("featured_video_url").notNull().default(""),
  upiId: text("upi_id").notNull().default(""),
  consultationLocation: text("consultation_location").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const services = sqliteTable("services", {
  id: text("id").primaryKey().notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  priceRupees: real("price_rupees").notNull(),
  mode: text("mode").notNull().default("Online"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  externalPaymentUrl: text("external_payment_url"),
});

export const availabilitySlots = sqliteTable("availability_slots", {
  id: text("id").primaryKey().notNull(),
  weekday: integer("weekday").notNull(),
  localTime: text("local_time").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
}, (table) => [uniqueIndex("availability_weekday_time_unique").on(table.weekday, table.localTime)]);

export const testimonials = sqliteTable("testimonials", {
  id: text("id").primaryKey().notNull(),
  quote: text("quote").notNull(),
  attribution: text("attribution").notNull(),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const faqs = sqliteTable("faqs", {
  id: text("id").primaryKey().notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const policies = sqliteTable("policies", {
  id: text("id").primaryKey().notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const blogPosts = sqliteTable("blog_posts", {
  id: text("id").primaryKey().notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull(),
  videoUrl: text("video_url").notNull().default(""),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("blog_posts_published_created_idx").on(table.published, table.createdAt)]);

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey().notNull(),
  contactHash: text("contact_hash").notNull().unique(),
  encryptedPayload: text("encrypted_payload").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey().notNull(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  bookingId: text("booking_id").references(() => bookings.id),
  amountRupees: integer("amount_rupees").notNull(),
  method: text("method", { enum: ["UPI", "CASH", "OTHER"] }).notNull().default("UPI"),
  status: text("status", { enum: ["PENDING", "VERIFIED", "REJECTED", "REFUNDED"] }).notNull().default("PENDING"),
  encryptedReference: text("encrypted_reference").notNull().default(""),
  note: text("note").notNull().default(""),
  receivedAt: text("received_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  verifiedAt: text("verified_at"),
}, (table) => [index("payments_customer_received_idx").on(table.customerId, table.receivedAt), index("payments_status_idx").on(table.status)]);

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey().notNull(),
  encryptedPayload: text("encrypted_payload").notNull(),
  status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED"] }).notNull().default("PENDING"),
  rating: integer("rating").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  reviewedAt: text("reviewed_at"),
});

export const bookings = sqliteTable("booking_requests", {
  id: text("id").primaryKey().notNull(),
  serviceId: text("service_id").notNull(),
  sessionDate: text("session_date").notNull(),
  sessionTime: text("session_time").notNull(),
  encryptedPayload: text("encrypted_payload").notNull(),
  customerId: text("customer_id").references(() => customers.id),
  status: text("status", { enum: ["REQUESTED", "CONFIRMED", "CANCELLED", "COMPLETED"] }).notNull().default("REQUESTED"),
  paymentStatus: text("payment_status", { enum: ["NOT_REQUIRED", "PENDING", "PAID", "REFUNDED"] }).notNull().default("NOT_REQUIRED"),
  paymentProvider: text("payment_provider"),
  paymentReference: text("payment_reference"),
  meetingProvider: text("meeting_provider"),
  meetingUrl: text("meeting_url"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("booking_requests_date_status_idx").on(table.sessionDate, table.status),
  uniqueIndex("booking_requests_active_slot_unique").on(table.sessionDate, table.sessionTime).where(sql`${table.status} IN ('REQUESTED', 'CONFIRMED')`),
]);

