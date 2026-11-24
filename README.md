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

The local admin bypass is for `npm run dev` only, and only when both the Vite dev server and `LOCAL_DEV=true` are active. `npm run preview` serves the production build, so that bypass cannot apply there. Do not set `LOCAL_DEV` on the deployed Worker.

Production admin access verifies `Cf-Access-Jwt-Assertion` against the Cloudflare Access JWKS, then checks issuer, audience, expiry, and the email claim against `ADMIN_EMAIL`. `ADMIN_USER_ID` is not the admin login; production intake still requires it before it can be enabled.

## Admin

- `/admin`: website profile, services, availability and content.
- `/admin/operations`: appointment requests, blog posts, customers, payments and feedback moderation.

Production intake is gated closed unless `PUBLIC_INTAKE_ENABLED=true` is set. Before enabling, configure a real privacy contact and retention policy, valid contact information, real prices/location/terms, and Cloudflare edge rate limiting. The encryption key must remain stable; changing it without re-encryption makes existing encrypted intake and UTR values unreadable.

## Public launch

The repository and D1 defaults intentionally contain no fake testimonial, no sample fee, and no made-up contact address or UPI ID. Fill confirmed business details in the admin dashboard before enabling intake. Review `docs/security-privacy-launch-review.md` for the security/privacy findings and remaining launch gates.

## Database changes

Edit `db/schema.ts`, generate a migration with `npm run db:generate`, inspect and commit the SQL and Drizzle metadata. Do not edit a migration that has already been applied. Local and hosted D1 are separate. Apply local files with `npm run db:apply:local` and hosted files with `npm run db:apply:remote`.

## Cloudflare Worker

`wrangler.jsonc` is the Worker and D1 configuration. `npm run build` copies it into `dist/server/wrangler.json`, with `main` rewritten to the bundled `index.js` and static assets pointed at `../client`. Preview and deploy use that generated file. No custom domain or DNS record is configured here.

1. Run `npx wrangler login` in the Cloudflare account that should own the Worker.
2. The Worker name is `astro-with-ritu` and the D1 database name is `astrowithritu-db`. The D1 binding must remain `DB`.
3. `database_id` in `wrangler.jsonc` already points at the existing `astrowithritu-db` database. Do not run `npm run db:create` again.
4. Run `npm run build`, then `npm run db:apply:remote`.
5. Set production values with Wrangler secrets. Do not commit them. Use `npx wrangler secret put <NAME> --config dist/server/wrangler.json` for `INTAKE_ENCRYPTION_KEY`, `ADMIN_USER_ID`, `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, and `ADMIN_EMAIL`. Leave `LOCAL_DEV` unset. Leave `PUBLIC_INTAKE_ENABLED` unset until the launch gates in the security review are done.
6. Run `npm run deploy`.
7. Run `npm run preview` to exercise the built Worker locally. This requires the build from step 4.

`npm run dev` remains the Vite development server. `npm run db:apply:local` still applies SQL to the local D1 state and requires a prior build.

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
