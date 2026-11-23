# AstroWithRitu security and privacy launch review

Review date: 23 November 2026

## Current launch posture

The Site can be published as a public informational page. Public appointment and feedback submission remain disabled until Ritu's privacy contact, retention period, verified contact details, fees, payment instructions and offline location are configured. `PUBLIC_INTAKE_ENABLED` must remain unset/false until those launch gates are complete. The local development preview permits submissions only when Vite development mode and `LOCAL_DEV=true` are both active.

## Security controls implemented

- Customer name/contact, birth details, consultation question and UPI reference are encrypted with AES-GCM before D1 storage. Repeat-customer lookup uses keyed HMAC rather than a plaintext contact index.
- Admin pages and APIs require the configured owner identity; the local bypass is restricted to a development build.
- Admin pages and API responses are private/no-store. The Worker adds CSP, HSTS on HTTPS, frame denial, MIME sniffing protection, a strict referrer policy, and a restricted permissions policy.
- Public request handlers reject oversized payloads and cross-origin booking submissions and include a honeypot. They are additionally disabled in production until explicitly enabled.
- Payment records are created as PENDING. Only the authenticated owner can verify a payment after checking the receiving account; UTR is encrypted.
- Fictional sample testimonials, placeholder email/phone/location, and demo prices are removed from the hosted content by migration. No invented reviews are published.
- Google Fonts were removed; no advertising or analytics code is included. Optional YouTube playback uses the privacy-enhanced embed host.

## Required before collecting real customer data

1. Publish Ritu's valid privacy contact and business contact details.
2. Set and follow a specific retention schedule, including a process for access/correction/deletion requests.
3. Confirm consultation fees, appointment hours/location, cancellation/reschedule/refund terms, and UPI ID before entering them in the admin.
4. Configure Cloudflare edge rate limiting or an equivalent anti-abuse control for booking and feedback endpoints before setting `PUBLIC_INTAKE_ENABLED=true`.
5. Review the full privacy/consumer terms with an India-qualified professional. This implementation is a technical review, not a legal opinion or certification.
6. Set the production `INTAKE_ENCRYPTION_KEY` as a secret and keep a secure recovery copy. Rotating it without re-encrypting existing rows makes stored intake unreadable.
7. Complete DNS ownership/SSL validation for `astrowithritu.com` at the registrar and verify HTTPS before advertising the domain.

## Indian privacy-law readiness

The Digital Personal Data Protection Act, 2023 and Rules, 2025 have phased commencement. The Gazette notifications state that many core processing obligations are scheduled for 18 months after 13 November 2025. This Site follows data minimisation, purpose notice, consent, encryption and owner-only access in advance; exact applicability and launch obligations should be confirmed by counsel.

Official sources:
- DPDP Act commencement notification: https://egazette.gov.in/WriteReadData/2025/267647.pdf
- DPDP Rules notification: https://egazette.gov.in/WriteReadData/2025/267650.pdf
