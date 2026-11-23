"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Service } from "@/lib/types";

export function BookingForm({ services }: { services: Service[] }) {
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const minDate = new Date(Date.now() + 36 * 60 * 60 * 1000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  useEffect(() => {
    if (!date) { setTimes([]); setTime(""); return; }
    let cancelled = false;
    setTimes([]); setTime("");
    fetch(`/api/public/availability?date=${encodeURIComponent(date)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as { error?: string; times: string[] };
        if (!response.ok) throw new Error(body.error || "Could not load times.");
        if (!cancelled) setTimes(body.times as string[]);
      }).catch((error: unknown) => { if (!cancelled) setStatus(error instanceof Error ? error.message : "Could not load available times."); });
    return () => { cancelled = true; };
  }, [date]);

  function chooseService(id: string) { const field = document.getElementById("service-id") as HTMLSelectElement | null; if (field) field.value = id; }
  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-service]"));
    const handlers = links.map((link) => {
      const handler = () => chooseService(link.dataset.service || "");
      link.addEventListener("click", handler);
      return { link, handler };
    });
    return () => handlers.forEach(({ link, handler }) => link.removeEventListener("click", handler));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setStatus("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: String(form.get("name") || "").trim(), contact: String(form.get("contact") || "").trim(),
      serviceId: String(form.get("serviceId") || ""), sessionDate: date, sessionTime: time,
      birthDate: String(form.get("birthDate") || ""), birthTime: String(form.get("birthTime") || ""), timeUnknown: unknownTime,
      birthPlace: String(form.get("birthPlace") || "").trim(), question: String(form.get("question") || "").trim(),
      website: String(form.get("website") || ""),
      consent: form.get("consent") === "on", adultConfirmed: form.get("adultConfirmed") === "on",
    };
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string; reference?: string };
      if (!response.ok) throw new Error(result.error || "Could not send the request.");
      setStatus(`Request ${result.reference} received. The practitioner will contact you to confirm.`);
      formElement.reset(); setDate(""); setTimes([]); setTime(""); setUnknownTime(false);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not send your request."); }
    finally { setPending(false); }
  }

  return <form className="booking-form" onSubmit={submit}>
    <div className="form-grid"><label>Your name<input name="name" autoComplete="name" minLength={2} maxLength={100} required/></label><label>Email or phone<input name="contact" autoComplete="email" minLength={5} maxLength={160} required/></label>
      <label className="full-field">Consultation<select id="service-id" name="serviceId" required defaultValue=""><option value="" disabled>Choose a service</option>{services.map((service) => <option value={service.id} key={service.id}>{service.name}{service.priceRupees > 0 ? ` · ₹${Number(service.priceRupees).toLocaleString("en-IN")}` : " · Fee shared after confirmation"}</option>)}</select></label>
      <label>Preferred date<input type="date" name="sessionDate" min={minDate || today} value={date} onChange={(event) => setDate(event.target.value)} required/></label>
      <label>Preferred time (IST)<select name="sessionTime" value={time} onChange={(event) => setTime(event.target.value)} required disabled={!date}><option value="">{date ? "Choose an available time" : "Choose a date first"}</option>{times.map((slot) => <option value={slot} key={slot}>{new Date(`2000-01-01T${slot}:00`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}</option>)}</select></label>
      <div className="full-field birth-group"><span className="field-title">Birth details</span><div className="form-grid birth-fields"><label>Date of birth<input type="date" name="birthDate" max={today} required/></label><label>Time of birth<input type="time" name="birthTime" disabled={unknownTime} required={!unknownTime}/><span className="checkbox-row"><input type="checkbox" checked={unknownTime} onChange={(event) => setUnknownTime(event.target.checked)}/> Time unknown</span></label><label className="birth-place">Place of birth<input name="birthPlace" maxLength={160} placeholder="City, country" required/></label></div></div>
      <label className="full-field">What would you like to discuss? (optional)<textarea name="question" maxLength={1500} rows={3}/></label>
      <label className="consent-row"><input type="checkbox" name="adultConfirmed" required/><span>I confirm I am 18 or older.</span></label><label className="consent-row"><input type="checkbox" name="consent" required/><span>I consent to the use of these details to respond to my consultation request.</span></label>
    </div>
    <label className="feedback-trap" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <p className="form-privacy">Birth and contact details are encrypted before storage and accessible only to the site owner. Readings are reflective and are not medical, legal or financial advice.</p>
    <button className="button submit-button" type="submit" disabled={pending || !services.length}>{pending ? "Sending securely…" : "Send consultation request →"}</button>
    <p className="form-status" role="status" aria-live="polite">{status}</p>
  </form>;
}
