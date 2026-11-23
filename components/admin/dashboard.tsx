"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AvailabilitySlot, FAQ, Policy, Service, SiteSettings, Testimonial } from "@/lib/types";

type Booking = { id: string; serviceName: string | null; date: string; time: string; status: string; name?: string; contact?: string; birthDate?: string; birthTime?: string | null; birthTimeUnknown?: boolean; birthPlace?: string; question?: string; paymentStatus: string; createdAt: string };
type Content = { settings: SiteSettings; services: Service[]; testimonials: Testimonial[]; faqs: FAQ[]; policies: Policy[]; availability: AvailabilitySlot[] };
type Tab = "overview" | "services" | "content" | "availability" | "requests";
const uid = () => crypto.randomUUID();

export function AdminDashboard() {
  const [content, setContent] = useState<Content | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState("Loading your private workspace…");
  const [saving, setSaving] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [newTimes, setNewTimes] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const [contentResponse, bookingResponse] = await Promise.all([fetch("/api/admin/content", { cache: "no-store" }), fetch("/api/admin/bookings", { cache: "no-store" })]);
      const contentData = await contentResponse.json() as Content & { error?: string };
      const bookingData = await bookingResponse.json() as { bookings: Booking[]; error?: string };
      if (!contentResponse.ok) throw new Error(contentData.error || "Could not load content.");
      if (!bookingResponse.ok) throw new Error(bookingData.error || "Could not load booking requests.");
      const next = contentData as Content;
      setContent(next); setBookings(bookingData.bookings as Booking[]);
      setSelectedDays([...new Set(next.availability.filter((slot) => slot.active).map((slot) => slot.weekday))].sort());
      setSelectedTimes([...new Set(next.availability.filter((slot) => slot.active).map((slot) => slot.localTime))].sort());
      setStatus("Changes save directly to the website database.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not load the admin workspace."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const updateSettings = (key: keyof SiteSettings, value: string) => setContent((current) => current ? { ...current, settings: { ...current.settings, [key]: value } } : current);
  const updateService = (id: string, key: keyof Service, value: string | number | boolean) => setContent((current) => current ? { ...current, services: current.services.map((item) => item.id === id ? { ...item, [key]: value } : item) } : current);
  const updateList = <T extends { id: string }>(key: "testimonials" | "faqs" | "policies", id: string, patch: Partial<T>) => setContent((current) => current ? { ...current, [key]: (current[key] as unknown as T[]).map((item) => item.id === id ? { ...item, ...patch } : item) } : current);
  const addService = () => setContent((current) => current ? { ...current, services: [...current.services, { id: uid(), slug: `new-service-${Date.now()}`, name: "New consultation", description: "Describe the session.", durationMinutes: 60, priceRupees: 0, mode: "Online", active: false, sortOrder: current.services.length + 1 }] } : current);
  const removeFromList = (key: "services" | "testimonials" | "faqs" | "policies", id: string) => setContent((current) => current ? { ...current, [key]: current[key].filter((item) => item.id !== id) } as Content : current);
  const addItem = (key: "testimonials" | "faqs" | "policies") => setContent((current) => {
    if (!current) return current;
    if (key === "testimonials") return { ...current, testimonials: [...current.testimonials, { id: uid(), quote: "", attribution: "", published: false, sortOrder: current.testimonials.length + 1 }] };
    if (key === "faqs") return { ...current, faqs: [...current.faqs, { id: uid(), question: "", answer: "", published: false, sortOrder: current.faqs.length + 1 }] };
    return { ...current, policies: [...current.policies, { id: uid(), title: "", body: "", published: false, sortOrder: current.policies.length + 1 }] };
  });
  const setAvailability = (days: number[], times: string[]) => setContent((current) => {
    if (!current) return current;
    return { ...current, availability: days.flatMap((weekday) => times.map((localTime) => ({ id: `weekday-${weekday}-${localTime.replace(":", "")}`, weekday, localTime, active: true }))) };
  });

  async function save() {
    if (!content) return;
    setSaving(true); setStatus("Saving changes…");
    try {
      const response = await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...content, availability: content.availability }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Save failed.");
      setStatus("Saved. Your live website now reflects these changes.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not save changes."); }
    finally { setSaving(false); }
  }
  async function changeBooking(id: string, nextStatus: "CONFIRMED" | "CANCELLED" | "COMPLETED") {
    const response = await fetch("/api/admin/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: nextStatus }) });
    if (!response.ok) { setStatus("Could not update this request."); return; }
    await load();
  }
  async function addTimes() {
    const incoming = newTimes.split(",").map((item) => item.trim()).filter((item) => /^([01]\d|2[0-3]):[0-5]\d$/.test(item));
    const times = [...new Set([...selectedTimes, ...incoming])].sort();
    setSelectedTimes(times); setNewTimes("");
    setAvailability(selectedDays, times);
  }
  function toggleDay(day: number) {
    const days = selectedDays.includes(day) ? selectedDays.filter((item) => item !== day) : [...selectedDays, day].sort();
    setSelectedDays(days); setAvailability(days, selectedTimes);
  }
  function toggleTime(time: string) {
    const times = selectedTimes.includes(time) ? selectedTimes.filter((item) => item !== time) : [...selectedTimes, time].sort();
    setSelectedTimes(times); setAvailability(selectedDays, times);
  }

  const filteredServices = useMemo(() => content?.services.filter((service) => service.name.toLowerCase().includes(serviceSearch.toLowerCase())) ?? [], [content, serviceSearch]);
  const tabs: { id: Tab; label: string }[] = [{ id: "overview", label: "Overview" }, { id: "services", label: "Services" }, { id: "content", label: "Site content" }, { id: "availability", label: "Availability" }, { id: "requests", label: `Requests${bookings.filter((booking) => booking.status === "REQUESTED").length ? ` (${bookings.filter((booking) => booking.status === "REQUESTED").length})` : ""}` }];

  if (!content) return <main className="admin-loading"><span className="brand-mark">ॐ</span><p>{status}</p></main>;
  return <main className="admin-app"><aside className="admin-sidebar"><a className="brand admin-brand" href="/"><span className="brand-mark">ॐ</span><span>AstroWithRitu</span></a><p className="sidebar-eyebrow">PRACTICE MANAGEMENT</p><nav>{tabs.map((item) => <button className={tab === item.id ? "admin-nav active" : "admin-nav"} key={item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav><div className="sidebar-bottom"><span className="avatar">R</span><div><strong>{content.settings.practitionerName}</strong><small>Site owner</small></div></div></aside>
    <section className="admin-main"><header className="admin-topbar"><div><p className="eyebrow">ASTROWITHRITU · ADMIN</p><h1>{tabs.find((item) => item.id === tab)?.label}</h1></div><div className="admin-actions"><a href="/admin/operations" className="secondary-button">Posts · clients · UPI ↗</a><a href="/" target="_blank" rel="noreferrer" className="secondary-button">View website ↗</a><button className="button" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div></header><p className="admin-status" role="status">{status}</p>
    {tab === "overview" && <section className="admin-content"><div className="admin-welcome"><div><span className="eyebrow">YOUR PRACTICE, AT A GLANCE</span><h2>Namaste, {content.settings.practitionerName}.</h2><p>Manage your website content and consultation requests here.</p></div><span className="welcome-symbol">ॐ</span></div><div className="metric-grid"><article className="metric-card"><span>ACTIVE SERVICES</span><strong>{content.services.filter((service) => service.active).length}</strong><small>Published on your website</small></article><article className="metric-card"><span>NEW REQUESTS</span><strong>{bookings.filter((booking) => booking.status === "REQUESTED").length}</strong><small>Awaiting your review</small></article><article className="metric-card"><span>UPCOMING SESSIONS</span><strong>{bookings.filter((booking) => booking.status === "CONFIRMED").length}</strong><small>Currently confirmed</small></article></div><div className="admin-panel"><div className="panel-heading"><div><h3>Recent enquiries</h3><p>Review the latest consultation requests.</p></div><button className="text-button" onClick={() => setTab("requests")}>View all →</button></div><BookingList bookings={bookings.slice(0, 4)} onChange={changeBooking}/></div></section>}
    {tab === "services" && <section className="admin-content"><div className="panel-heading"><div><h2>Consultation services</h2><p>Services marked active appear on your website and booking form.</p></div><button className="secondary-button" onClick={addService}>＋ Add service</button></div><div className="toolbar"><input placeholder="Find a service…" value={serviceSearch} onChange={(event) => setServiceSearch(event.target.value)}/><span>{filteredServices.length} services</span></div><div className="editor-list">{filteredServices.map((service) => <article className="edit-card" key={service.id}><div className="edit-card-head"><span className="drag-handle">✧</span><label className="toggle-label"><input type="checkbox" checked={service.active} onChange={(event) => updateService(service.id, "active", event.target.checked)}/> Published</label><button className="danger-text" onClick={() => removeFromList("services", service.id)}>Remove</button></div><div className="field-grid"><label>Service name<input value={service.name} onChange={(event) => updateService(service.id, "name", event.target.value)}/></label><label>URL slug<input value={service.slug} onChange={(event) => updateService(service.id, "slug", event.target.value)}/></label><label className="wide">Description<textarea rows={2} value={service.description} onChange={(event) => updateService(service.id, "description", event.target.value)}/></label><label>Price (INR)<input type="number" min="0" value={service.priceRupees} onChange={(event) => updateService(service.id, "priceRupees", Number(event.target.value))}/></label><label>Duration (minutes)<input type="number" min="15" value={service.durationMinutes} onChange={(event) => updateService(service.id, "durationMinutes", Number(event.target.value))}/></label><label>Format<input value={service.mode} onChange={(event) => updateService(service.id, "mode", event.target.value)}/></label><label>Display order<input type="number" min="0" value={service.sortOrder} onChange={(event) => updateService(service.id, "sortOrder", Number(event.target.value))}/></label></div></article>)}</div></section>}
    {tab === "content" && <section className="admin-content"><div className="panel-heading"><div><h2>Website content</h2><p>These fields update the public homepage and policy sections.</p></div></div><div className="admin-panel"><h3>Brand and contact</h3><div className="field-grid"><TextField label="Brand name" value={content.settings.brandName} onChange={(v) => updateSettings("brandName", v)}/><TextField label="Practitioner name" value={content.settings.practitionerName} onChange={(v) => updateSettings("practitionerName", v)}/><TextField label="City" value={content.settings.city} onChange={(v) => updateSettings("city", v)}/><TextField label="Contact email" value={content.settings.contactEmail} onChange={(v) => updateSettings("contactEmail", v)}/><TextField label="Contact phone / WhatsApp" value={content.settings.contactPhone} onChange={(v) => updateSettings("contactPhone", v)}/><TextField label="Tagline" value={content.settings.tagline} onChange={(v) => updateSettings("tagline", v)}/><TextField label="Instagram profile URL" value={content.settings.instagramUrl} onChange={(v) => updateSettings("instagramUrl", v)}/><TextField label="YouTube channel URL" value={content.settings.youtubeUrl} onChange={(v) => updateSettings("youtubeUrl", v)}/><TextField label="Featured YouTube video URL" value={content.settings.featuredVideoUrl} onChange={(v) => updateSettings("featuredVideoUrl", v)}/><TextField label="UPI ID (leave blank until verified)" value={content.settings.upiId} onChange={(v) => updateSettings("upiId", v)}/><TextField label="Offline consultation location" value={content.settings.consultationLocation} onChange={(v) => updateSettings("consultationLocation", v)} wide/><TextField label="Preview notice (clear only when real details are ready)" value={content.settings.demoBanner} onChange={(v) => updateSettings("demoBanner", v)} wide/></div></div><div className="admin-panel"><h3>Homepage</h3><div className="field-grid"><TextField label="Hero heading" value={content.settings.heroHeading} onChange={(v) => updateSettings("heroHeading", v)} wide/><TextAreaField label="Hero copy" value={content.settings.heroCopy} onChange={(v) => updateSettings("heroCopy", v)}/><TextField label="About heading" value={content.settings.aboutHeading} onChange={(v) => updateSettings("aboutHeading", v)}/><TextAreaField label="About text" value={content.settings.aboutCopy} onChange={(v) => updateSettings("aboutCopy", v)}/></div></div>
      <CollectionEditor title="Testimonials" items={content.testimonials} fields={[{ key: "quote", label: "Quote", multiline: true }, { key: "attribution", label: "Attribution" }]} onAdd={() => addItem("testimonials")} onUpdate={(id, patch) => updateList<CollectionItem>("testimonials", id, patch)} onRemove={(id) => removeFromList("testimonials", id)}/>
      <CollectionEditor title="FAQs" items={content.faqs} fields={[{ key: "question", label: "Question" }, { key: "answer", label: "Answer", multiline: true }]} onAdd={() => addItem("faqs")} onUpdate={(id, patch) => updateList<CollectionItem>("faqs", id, patch)} onRemove={(id) => removeFromList("faqs", id)}/>
      <CollectionEditor title="Policies and notices" items={content.policies} fields={[{ key: "title", label: "Title" }, { key: "body", label: "Policy text", multiline: true }]} onAdd={() => addItem("policies")} onUpdate={(id, patch) => updateList<CollectionItem>("policies", id, patch)} onRemove={(id) => removeFromList("policies", id)}/></section>}
    {tab === "availability" && <section className="admin-content"><div className="panel-heading"><div><h2>Weekly availability</h2><p>Times use India Standard Time (IST). Booked slots are hidden from new enquiries.</p></div></div><div className="admin-panel"><h3>Days you take consultations</h3><div className="weekday-picker">{["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((label, day) => <label className={selectedDays.includes(day) ? "day-chip selected" : "day-chip"} key={label}><input type="checkbox" checked={selectedDays.includes(day)} onChange={() => toggleDay(day)}/>{label}</label>)}</div><h3 className="subhead">Available times</h3><div className="time-chip-list">{selectedTimes.map((time) => <label className="time-chip" key={time}><input type="checkbox" checked onChange={() => toggleTime(time)}/>{time}<span>×</span></label>)}</div><div className="add-time-row"><input placeholder="Add times, e.g. 10:30, 16:00" value={newTimes} onChange={(event) => setNewTimes(event.target.value)}/><button className="secondary-button" onClick={() => void addTimes()}>Add time</button></div><p className="muted">Select at least one day and one time. Existing booking requests remain in your request list.</p></div></section>}
    {tab === "requests" && <section className="admin-content"><div className="panel-heading"><div><h2>Consultation requests</h2><p>Personal and birth details are decrypted only in this owner-only view.</p></div><button className="secondary-button" onClick={() => void load()}>↻ Refresh</button></div><div className="admin-panel"><BookingList bookings={bookings} onChange={changeBooking} full/></div></section>}
    </section></main>;
}

function TextField({ label, value, onChange, wide = false }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean }) { return <label className={wide ? "wide" : ""}>{label}<input value={value} onChange={(event) => onChange(event.target.value)}/></label>; }
function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="wide">{label}<textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)}/></label>; }
type CollectionItem = { id: string; published: boolean; sortOrder: number; quote?: string; attribution?: string; question?: string; answer?: string; title?: string; body?: string };
function CollectionEditor({ title, items, fields, onAdd, onUpdate, onRemove }: { title: string; items: CollectionItem[]; fields: { key: keyof CollectionItem; label: string; multiline?: boolean }[]; onAdd: () => void; onUpdate: (id: string, patch: Partial<CollectionItem>) => void; onRemove: (id: string) => void }) {
  function changeField(id: string, key: keyof CollectionItem, value: string | boolean) {
    onUpdate(id, { [key]: value } as Partial<CollectionItem>);
  }
  return (
    <div className="admin-panel">
      <div className="panel-heading"><div><h3>{title}</h3><p>Only published items appear on the public website.</p></div><button className="secondary-button" onClick={onAdd}>＋ Add</button></div>
      {items.map((item) => (
        <div className="collection-row" key={item.id}>
          <div className="collection-controls"><label className="toggle-label"><input type="checkbox" checked={item.published} onChange={(event) => changeField(item.id, "published", event.target.checked)}/> Published</label><button className="danger-text" onClick={() => onRemove(item.id)}>Remove</button></div>
          <div className="field-grid">{fields.map((field) => (
            <label className={field.multiline ? "wide" : ""} key={String(field.key)}>{field.label}
              {field.multiline ? <textarea rows={3} value={String(item[field.key] ?? "")} onChange={(event) => changeField(item.id, field.key, event.target.value)}/> : <input value={String(item[field.key] ?? "")} onChange={(event) => changeField(item.id, field.key, event.target.value)}/>}
            </label>
          ))}</div>
        </div>
      ))}
    </div>
  );
}
function BookingList({ bookings, onChange, full = false }: { bookings: Booking[]; onChange: (id: string, status: "CONFIRMED" | "CANCELLED" | "COMPLETED") => void; full?: boolean }) {
  if (!bookings.length) return <div className="empty-state"><span>✧</span><h3>No enquiries yet</h3><p>New consultation requests will appear here.</p></div>;
  return <div className="booking-list">{bookings.map((booking) => <article className="booking-row" key={booking.id}><div className="booking-row-top"><div><span className={`status-pill status-${booking.status.toLowerCase()}`}>{booking.status}</span><h3>{booking.serviceName || "Consultation"}</h3></div><span>{booking.date} · {booking.time} IST</span></div><div className="booking-client"><strong>{booking.name || "Client details unavailable"}</strong><a href={`mailto:${booking.contact || ""}`}>{booking.contact}</a><span>Birth: {booking.birthDate || "—"} · {booking.birthTimeUnknown ? "Time unknown" : booking.birthTime || "—"} · {booking.birthPlace || "—"}</span>{booking.question && <p>“{booking.question}”</p>}</div>{booking.status === "REQUESTED" && <div className="booking-actions"><button className="button button-small" onClick={() => onChange(booking.id, "CONFIRMED")}>Confirm request</button><button className="text-button danger-text" onClick={() => onChange(booking.id, "CANCELLED")}>Cancel</button></div>}{full && booking.status === "CONFIRMED" && <div className="booking-actions"><button className="secondary-button" onClick={() => onChange(booking.id, "COMPLETED")}>Mark complete</button><button className="text-button danger-text" onClick={() => onChange(booking.id, "CANCELLED")}>Cancel session</button></div>}</article>)}</div>;
}
