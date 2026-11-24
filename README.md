# AstroWithRitu

A custom full-stack consultation website for Ritu Asthana. Stack: React/TypeScript with Vinext, Cloudflare Workers, D1 (SQLite), and Drizzle migrations.

## Features

- Configurable profile, services, FAQs, policies, availability, blog and social links
- In-person consultation requests and customer/payment ledger
- AES-GCM encrypted customer contact, birth details and UPI references; HMAC contact matching
- Owner-only admin. Production checks a Cloudflare Access JWT and `ADMIN_EMAIL`
- YouTube playback and Instagram profile links
- Feedback stays private until the owner approves it; publication requires explicit consent
- UPI payments start as pending and require manual reconciliation against the receiving bank/UPI account

## Local setup (Mac/Linux)

Requires Node.js 22.13.0 or later.

1. Copy `.dev.vars.example` to `.dev.vars`.
2. Set `LOCAL_DEV=true`, `ADMIN_USER_ID=local-developer`, and a base64-encoded 32-byte `INTAKE_ENCRYPTION_KEY` in `.dev.vars`.
3. Run `npm run install:ci`, `npm run build`, and `npm run db:apply:local`.
4. Run `npm run dev` and open the local address printed by Vinext.

The local admin bypass is for development only, and only when both the Vite dev server and `LOCAL_DEV=true` are active. Production admin access verifies `Cf-Access-Jwt-Assertion` against the Cloudflare Access JWKS, then checks issuer, audience, expiry, and the email claim against `ADMIN_EMAIL`. Set `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, and `ADMIN_EMAIL` as Worker variables or secrets. Do not commit real values. `ADMIN_USER_ID` is not the admin login; production intake still requires it before it can be enabled.

## Admin

- `/admin`: website profile, services, availability and content.
- `/admin/operations`: appointment requests, blog posts, customers, payments and feedback moderation.

Production intake is gated closed unless `PUBLIC_INTAKE_ENABLED=true` is set. Before enabling, configure a real privacy contact and retention policy, valid contact information, real prices/location/terms, and Cloudflare edge rate limiting. The encryption key must remain stable; changing it without re-encryption makes existing encrypted intake and UTR values unreadable.

## Public launch

The repository and D1 defaults intentionally contain no fake testimonial, no sample fee, and no made-up contact address or UPI ID. Fill confirmed business details in the admin dashboard before enabling intake. Review `docs/security-privacy-launch-review.md` for the security/privacy findings and remaining launch gates.

## Database changes

Edit `db/schema.ts`, generate a migration with `npm run db:generate`, inspect and commit the SQL and Drizzle metadata. Do not edit a migration that has already been applied. Local and hosted D1 are separate; Sites publication applies hosted migrations.

## Main files

- `app/page.tsx` — homepage
- `app/privacy/page.tsx` — privacy notice
- `app/blog/` — blog pages
- `app/admin/`, `components/admin/` — owner dashboard
- `app/api/` — public and admin APIs
- `db/schema.ts`, `db/seed.ts`, `drizzle/` — data model, defaults and migrations
- `lib/security.ts` — field encryption and keyed contact lookup
- `worker/index.ts` — Worker response security headers

Vedic astrology content is informational and interpretive. Readings do not guarantee outcomes and do not replace qualified medical, legal, financial, or mental-health advice.
