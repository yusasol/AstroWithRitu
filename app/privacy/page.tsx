import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Notice | AstroWithRitu",
  description: "Privacy information for AstroWithRitu visitors.",
};

export default function PrivacyPage() {
  return <main className="blog-page"><header className="site-header container"><a className="brand" href="/">✦ AstroWithRitu</a><nav><a href="/">Home</a></nav></header><article className="article-page">
    <p className="eyebrow">PRIVACY</p><h1>Privacy notice</h1><p className="article-excerpt">Last updated: 23 November 2026 · Site operator: Ritu Asthana, AstroWithRitu.</p>
    <div className="article-body">
      <p><strong>Pre-launch status:</strong> consultation and feedback forms are currently closed. This site is not accepting new personal or birth details through those forms. Please do not email or message birth information until Ritu’s contact and privacy details are published.</p>
      <h2>What the site will collect when enquiries open</h2>
      <p>A consultation request may include your name, email or phone number, preferred service/date/time, birth date/time/place, and an optional question. If a payment is recorded, the ledger may include its amount, method, status and a payment reference. Feedback is collected only after a consultation; it remains private unless you separately consent to publication and Ritu approves it.</p>
      <h2>Why information is used</h2>
      <p>These details are used to respond to a request, check appointment availability, prepare an in-person consultation, reconcile a payment, and manage feedback. They are not used for advertising or sold to third parties.</p>
      <h2>Storage and service providers</h2>
      <p>Contact, birth and payment-reference fields are encrypted before storage. The owner-only administration area can decrypt them. The site is hosted on Cloudflare Workers and D1. Instagram links open Instagram; an optional YouTube video may load YouTube when the practitioner adds a video. The site does not use advertising or analytics cookies, and its fonts are served from the site itself. The signed-in admin may use a necessary preference cookie.</p>
      <h2>Retention and your requests</h2>
      <p>Information should be kept only while needed to manage the consultation and any legally required records. Before online forms open, this notice will be updated with the retention period, a contact for access/correction/deletion requests, and the process to raise a privacy concern.</p>
      <h2>Children and sensitive information</h2>
      <p>Online requests will be limited to adults. Do not submit another person’s birth details or information about a child. Astrology readings are reflective and do not replace qualified medical, legal or financial advice.</p>
      <p><a href="/">Return to AstroWithRitu</a></p>
    </div>
  </article></main>;
}
