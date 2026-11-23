# Architecture and extension points

## Current runtime

- **UI:** React Server Components and client components, written in TypeScript.
- **App framework:** Vinext's Next-compatible App Router, built for Cloudflare Workers.
- **Backend:** Same-origin route handlers under `app/api/`; no separate API server to deploy.
- **Database:** Cloudflare D1 with SQLite schema defined in `db/schema.ts`; Drizzle handles typed queries and migrations.
- **Validation:** Zod schemas in `lib/validators.ts` are shared at the API boundary.
- **Sensitive booking intake:** AES-GCM through Web Crypto. Cipher key exists only as a runtime secret.

The site uses separate modules for database schema, seed data, content queries, validation, encryption, owner authorization, page components and API routes. The `/admin` page is server-gated and its APIs repeat the owner check; production authorization uses the trusted Site identity header.

## Data boundaries

Site settings, services, weekly availability, testimonials, FAQs and policies are separate D1 tables. Booking scheduling/status metadata is separate from the encrypted customer and birth-detail payload. This allows a content edit to leave bookings intact and supports later retention/deletion work.

Bookings already carry provider-neutral payment and meeting fields. The interfaces in `lib/integrations/contracts.ts` mark extension points for checkout, webhook verification, meeting creation and real-time messaging. No provider is wired in yet.

## Planned integrations

1. **Payments:** implement a `PaymentProvider` adapter for the chosen provider, create checkout only after the practitioner accepts a booking, verify signed webhooks, and make webhook handling idempotent. Store payment attempts separately before production use.
2. **Audio/video:** implement `MeetingProvider` after choosing a vendor; create and cancel a meeting on booking status transitions and reveal the meeting URL only to authorized participants.
3. **Chat:** use a real-time transport (for example, a Cloudflare Durable Object/WebSocket service) for live delivery; persist an appropriately encrypted transcript and enforce conversation membership on every operation.
4. **Notifications:** add an email/SMS provider behind a notification adapter and send only after database state changes commit.

Each integration needs provider credentials, data-retention choices and webhook/participant authorization before enabling it. The current project remains a consultation booking MVP and makes no claims that those integrations are active.
