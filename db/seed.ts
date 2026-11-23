import { eq, like } from "drizzle-orm";
import { getDb } from "./index";
import { availabilitySlots, faqs, policies, services, siteSettings, testimonials } from "./schema";

const sampleSettings = {
  id: "main",
  brandName: "AstroWithRitu",
  practitionerName: "Ritu Asthana",
  city: "",
  contactEmail: "",
  contactPhone: "",
  tagline: "Vedic astrology, thoughtfully",
  heroHeading: "A little more clarity for the path ahead.",
  heroCopy: "Explore your birth chart and the questions on your mind through a thoughtful, grounded Vedic astrology consultation.",
  aboutHeading: "A conversation guided by your chart",
  aboutCopy: "Ritu offers reflective Vedic astrology consultations that make room for your questions, context and choices. A reading can help you explore traditional chart interpretations without treating the future as fixed.",
  demoBanner: "Consultation requests will open once contact and privacy details are finalized.",
  instagramUrl: "",
  youtubeUrl: "",
  featuredVideoUrl: "",
  upiId: "",
  consultationLocation: "",
};

const sampleServices = [
  { id: "birth-chart", slug: "birth-chart-reading", name: "Birth chart reading", description: "A guided overview of chart themes and the questions that matter to you.", durationMinutes: 60, priceRupees: 0, mode: "In person", active: true, sortOrder: 1 },
  { id: "compatibility", slug: "compatibility-and-connection", name: "Compatibility & connection", description: "Explore relationship dynamics through a traditional Vedic lens.", durationMinutes: 75, priceRupees: 0, mode: "In person", active: true, sortOrder: 2 },
  { id: "career", slug: "career-direction", name: "Career direction", description: "Reflect on professional strengths, transitions and timing.", durationMinutes: 60, priceRupees: 0, mode: "In person", active: true, sortOrder: 3 },
  { id: "year-ahead", slug: "personal-year-ahead", name: "Personal year ahead", description: "A forward-looking discussion of themes for the coming year.", durationMinutes: 45, priceRupees: 0, mode: "In person", active: true, sortOrder: 4 },
];
const sampleTestimonials: typeof testimonials.$inferInsert[] = [];
const samplePolicies = [
  { id: "astrology-notice", title: "Astrology disclaimer", body: "Readings are traditional interpretations for reflection. They do not guarantee outcomes and are not medical, legal, financial or mental-health advice.", published: true, sortOrder: 1 },
  { id: "privacy-notice", title: "Privacy notice", body: "Pre-launch notice: online consultation and feedback forms are currently closed, so this site is not accepting new personal details through those forms. Before they open, this notice will be updated with the privacy contact, retention period, data rights and service-provider details. Do not send another person's or a minor's birth information.", published: true, sortOrder: 2 },
  { id: "reschedule-notice", title: "Booking and payment terms", body: "Consultation requests and payments are not currently being accepted. Booking, cancellation, rescheduling and refund terms will be published before enquiries open.", published: true, sortOrder: 3 },
];
const sampleFaqs = [
  { id: "faq-birth-details", question: "What information should I share?", answer: "Your date, time and place of birth help prepare a chart. Tell the astrologer if the time is approximate or unknown.", published: true, sortOrder: 1 },
  { id: "faq-unknown-time", question: "What if I don’t know my exact birth time?", answer: "Choose the unknown option. The astrologer can explain which parts of the reading may be limited.", published: true, sortOrder: 2 },
  { id: "faq-prediction", question: "Can astrology guarantee what will happen?", answer: "No. A reading is an interpretation within a traditional framework, not a guarantee or a replacement for qualified professional advice.", published: true, sortOrder: 3 },
  { id: "faq-payment", question: "How do I pay?", answer: "Consultation requests and payments are not currently being accepted. Once enquiries open, payment instructions will be shared only after Ritu confirms an appointment.", published: true, sortOrder: 4 },
];

export async function ensureSeedData() {
  const db = getDb();
  const existing = (await db.select({ id: siteSettings.id }).from(siteSettings).where(eq(siteSettings.id, "main")).limit(1).all())[0];
  if (existing) {
    await db.update(services).set({ mode: "In person" }).where(eq(services.mode, "Online")).run();
    await db.update(testimonials).set({ published: false }).where(like(testimonials.attribution, "Sample review%")).run();
    return;
  }
  await db.insert(siteSettings).values(sampleSettings).onConflictDoNothing();
  await db.insert(services).values(sampleServices).onConflictDoNothing();
  await db.insert(testimonials).values(sampleTestimonials).onConflictDoNothing();
  await db.insert(policies).values(samplePolicies).onConflictDoNothing();
  await db.insert(faqs).values(sampleFaqs).onConflictDoNothing();
  const times = ["11:00", "13:00", "15:00", "17:00"];
  const slots = [1, 2, 3, 4, 5, 6].flatMap((weekday) => times.map((localTime) => ({ id: `weekday-${weekday}-${localTime.replace(":", "")}`, weekday, localTime, active: true })));
  await db.insert(availabilitySlots).values(slots).onConflictDoNothing();
}
