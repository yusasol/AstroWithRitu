"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Post = { id: string; slug: string; title: string; excerpt: string; body: string; videoUrl: string; published: boolean; createdAt?: string };
type Customer = { id: string; name?: string; contact?: string; createdAt: string };
type Payment = { id: string; amountRupees: number; method: string; status: string; reference: string; note: string; receivedAt: string; customer: { name?: string; contact?: string }; bookingDate?: string };
type Review = { id: string; name?: string; review?: string; contact?: string; rating: number; status: string; consentToPublish?: boolean; createdAt: string };
type Tab = "posts" | "customers" | "payments" | "feedback";

export function BusinessConsole() {
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState("Loading private practice records…");
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [reference, setReference] = useState("");

  const load = useCallback(async () => {
    try {
      const [postRes, customerRes, paymentRes, reviewRes] = await Promise.all([
        fetch("/api/admin/posts", { cache: "no-store" }), fetch("/api/admin/customers", { cache: "no-store" }),
        fetch("/api/admin/payments", { cache: "no-store" }), fetch("/api/admin/feedback", { cache: "no-store" }),
      ]);
      const [p, c, pay, rev] = await Promise.all([postRes.json(), customerRes.json(), paymentRes.json(), reviewRes.json()]) as [{posts?:Post[];error?:string},{customers?:Customer[];error?:string},{payments?:Payment[];error?:string},{feedback?:Review[];error?:string}];
      if ([postRes, customerRes, paymentRes, reviewRes].some((response) => !response.ok)) throw new Error([p.error,c.error,pay.error,rev.error].find(Boolean) || "Could not load admin records.");
      setPosts(p.posts || []); setCustomers(c.customers || []); setPayments(pay.payments || []); setReviews(rev.feedback || []);
      setCustomerId((current) => current || c.customers?.[0]?.id || ""); setMessage("Private records are loaded. Verify UPI payments in the bank app before marking them paid.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load private records."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const patchPost = (id: string, patch: Partial<Post>) => setPosts((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  const addPost = () => setPosts((rows) => [...rows, { id: crypto.randomUUID(), slug: `new-article-${Date.now()}`, title: "New article", excerpt: "", body: "", videoUrl: "", published: false }]);
  const savePosts = async () => {
    setSaving(true); setMessage("Saving articles…");
    try { const response = await fetch("/api/admin/posts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(posts) }); const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error || "Could not save articles."); setMessage("Articles saved. Published posts now appear on the website."); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save articles."); } finally { setSaving(false); }
  };
  async function addPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!customerId) { setMessage("Create a consultation request before adding a payment."); return; }
    const response = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId, amountRupees: Number(amount), method, reference, status: "PENDING", note: "" }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setMessage(data.error || "Could not save payment."); return; }
    setAmount(""); setReference(""); setMessage("Payment logged as pending. Verify the transaction before marking it paid."); await load();
  }
  async function updatePayment(id: string, status: string) { const response = await fetch("/api/admin/payments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }); if (response.ok) await load(); else setMessage("Could not update payment status."); }
  async function updateReview(id: string, status: string) { const response = await fetch("/api/admin/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }); const data = await response.json() as { error?: string }; if (!response.ok) setMessage(data.error || "Could not update feedback."); else { setMessage(status === "APPROVED" ? "Feedback approved and added to public reviews." : "Feedback rejected."); await load(); } }

  const tabs: { id: Tab; label: string }[] = [{id:"posts",label:`Blog & updates (${posts.length})`},{id:"customers",label:`Customers (${customers.length})`},{id:"payments",label:`UPI & payments (${payments.length})`},{id:"feedback",label:`Feedback (${reviews.filter((item)=>item.status==="PENDING").length} pending)`}];
  return <main className="admin-app"><aside className="admin-sidebar"><a className="brand admin-brand" href="/"><span className="brand-mark">ॐ</span><span>AstroWithRitu</span></a><p className="sidebar-eyebrow">PRACTICE MANAGEMENT</p><nav>{tabs.map((item)=><button key={item.id} className={tab===item.id?"admin-nav active":"admin-nav"} onClick={()=>setTab(item.id)}>{item.label}</button>)}</nav><div className="sidebar-bottom"><span className="avatar">R</span><div><strong>Private practice</strong><small>Owner access only</small></div></div></aside><section className="admin-main"><header className="admin-topbar"><div><p className="eyebrow">ASTROWITHRITU · ADMIN</p><h1>{tabs.find((item)=>item.id===tab)?.label}</h1></div><div className="admin-actions"><a href="/admin" className="secondary-button">Site settings</a><a href="/" target="_blank" className="secondary-button">View website ↗</a></div></header><p className="admin-status" role="status">{message}</p>
    {tab==="posts"&&<section className="admin-content"><div className="panel-heading"><div><h2>Blog and updates</h2><p>Drafts stay private until published. YouTube videos can be added by URL.</p></div><button className="secondary-button" onClick={addPost}>＋ New post</button></div>{posts.map((post)=><article className="edit-card" key={post.id}><div className="edit-card-head"><label className="toggle-label"><input type="checkbox" checked={post.published} onChange={(e)=>patchPost(post.id,{published:e.target.checked})}/> Published</label><button className="danger-text" onClick={()=>setPosts((rows)=>rows.filter((row)=>row.id!==post.id))}>Remove</button></div><div className="field-grid"><label>Article title<input value={post.title} onChange={(e)=>patchPost(post.id,{title:e.target.value})}/></label><label>URL slug<input value={post.slug} onChange={(e)=>patchPost(post.id,{slug:e.target.value})}/></label><label className="wide">Short summary<textarea rows={2} value={post.excerpt} onChange={(e)=>patchPost(post.id,{excerpt:e.target.value})}/></label><label className="wide">Article text<textarea rows={7} value={post.body} onChange={(e)=>patchPost(post.id,{body:e.target.value})}/></label><label className="wide">Optional YouTube URL<input value={post.videoUrl} onChange={(e)=>patchPost(post.id,{videoUrl:e.target.value})}/></label></div></article>)}{!posts.length&&<div className="admin-panel"><h3>No articles yet</h3><p>Add a post, write a short description, then publish it.</p></div>}<button className="button" onClick={()=>void savePosts()} disabled={saving}>{saving?"Saving…":"Save blog changes"}</button></section>}
    {tab==="customers"&&<section className="admin-content"><div className="panel-heading"><div><h2>Customer register</h2><p>Contact details are encrypted in the database and decrypted only in this admin view.</p></div><button className="secondary-button" onClick={()=>void load()}>Refresh</button></div><div className="admin-panel">{customers.length?customers.map((customer)=><article className="booking-row" key={customer.id}><strong>{customer.name||"Customer"}</strong><p>{customer.contact||"No contact supplied"}</p><small>First enquiry: {new Date(customer.createdAt).toLocaleDateString("en-IN")}</small></article>):<div className="empty-state"><h3>No customers yet</h3><p>Customer records are created from consultation enquiries.</p></div>}</div></section>}
    {tab==="payments"&&<section className="admin-content"><div className="admin-panel"><h3>Log an offline payment</h3><p>For direct UPI, enter the UTR and leave Pending until you verify the bank transaction.</p><form className="payment-entry" onSubmit={addPayment}><label>Customer<select value={customerId} onChange={(e)=>setCustomerId(e.target.value)} required><option value="">Choose customer</option>{customers.map((customer)=><option value={customer.id} key={customer.id}>{customer.name||"Customer"} · {customer.contact||"no contact"}</option>)}</select></label><label>Amount (₹)<input type="number" min="1" value={amount} onChange={(e)=>setAmount(e.target.value)} required/></label><label>Method<select value={method} onChange={(e)=>setMethod(e.target.value)}><option>UPI</option><option>CASH</option><option>OTHER</option></select></label><label>UPI reference / UTR<input value={reference} onChange={(e)=>setReference(e.target.value)} maxLength={100}/></label><button className="button" type="submit">Add pending payment</button></form></div><div className="admin-panel"><h3>Payment ledger</h3>{payments.length?payments.map((payment)=><article className="booking-row payment-row" key={payment.id}><div><span className={`status-pill status-${payment.status.toLowerCase()}`}>{payment.status}</span><strong>₹{payment.amountRupees.toLocaleString("en-IN")} · {payment.method}</strong><p>{payment.customer?.name||"Customer"} · {payment.customer?.contact||""} {payment.bookingDate?`· Appointment ${payment.bookingDate}`:""}</p><small>UTR: {payment.reference||"Not entered"} · {new Date(payment.receivedAt).toLocaleString("en-IN")}</small>{payment.note&&<p>{payment.note}</p>}</div>{payment.status==="PENDING"&&<button className="secondary-button" onClick={()=>void updatePayment(payment.id,"VERIFIED")}>Mark verified</button>}{payment.status==="VERIFIED"&&<button className="text-button danger-text" onClick={()=>void updatePayment(payment.id,"REFUNDED")}>Mark refunded</button>}</article>):<p>No payments logged yet.</p>}</div></section>}
    {tab==="feedback"&&<section className="admin-content"><div className="panel-heading"><div><h2>Feedback moderation</h2><p>Only feedback with customer consent can be approved as a public review.</p></div><button className="secondary-button" onClick={()=>void load()}>Refresh</button></div><div className="admin-panel">{reviews.length?reviews.map((review)=><article className="booking-row" key={review.id}><span className={`status-pill status-${review.status.toLowerCase()}`}>{review.status}</span><strong>{review.name||"Customer"} · {"★".repeat(review.rating)}</strong><p>{review.review}</p><small>{review.consentToPublish?"Consent to publish recorded":"No publication consent"} · {new Date(review.createdAt).toLocaleDateString("en-IN")}</small>{review.status==="PENDING"&&<div className="booking-actions"><button className="button button-small" disabled={!review.consentToPublish} onClick={()=>void updateReview(review.id,"APPROVED")}>Approve for public reviews</button><button className="text-button danger-text" onClick={()=>void updateReview(review.id,"REJECTED")}>Reject</button></div>}</article>):<div className="empty-state"><h3>No feedback submitted</h3><p>New feedback appears here for approval.</p></div>}</div></section>}
    </section></main>;
}
