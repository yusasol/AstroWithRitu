UPDATE site_settings
SET practitioner_name = 'Ritu Asthana',
    city = CASE WHEN city = 'Lucknow, India' THEN '' ELSE city END,
    contact_email = CASE WHEN contact_email LIKE '%@astrowithritu.example' THEN '' ELSE contact_email END,
    contact_phone = CASE WHEN contact_phone = '+91 00000 00000' THEN '' ELSE contact_phone END,
    consultation_location = CASE WHEN consultation_location LIKE 'Offline consultation location%' THEN '' ELSE consultation_location END,
    demo_banner = 'Consultation requests will open once contact and privacy details are finalized.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'main';

UPDATE services SET price_rupees = 0, external_payment_url = NULL
WHERE id IN ('birth-chart', 'compatibility', 'career', 'year-ahead');

DELETE FROM testimonials
WHERE id IN ('review-1', 'review-2', 'review-3')
   OR attribution LIKE 'Sample review%';

UPDATE policies
SET title = 'Privacy notice',
    body = 'Pre-launch notice: online consultation and feedback forms are currently closed, so this site is not accepting new personal details through those forms. Before they open, this notice will be updated with the privacy contact, retention period, data rights and service-provider details. Do not send another person''s or a minor''s birth information.'
WHERE id = 'privacy-notice';

UPDATE policies
SET title = 'Booking and payment terms',
    body = 'Consultation requests and payments are not currently being accepted. Booking, cancellation, rescheduling and refund terms will be published before enquiries open.'
WHERE id = 'reschedule-notice';

UPDATE faqs
SET answer = 'Consultation requests and payments are not currently being accepted. Once enquiries open, payment instructions will be shared only after Ritu confirms an appointment.'
WHERE id = 'faq-payment';
