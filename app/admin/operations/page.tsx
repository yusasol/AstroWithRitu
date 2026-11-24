import Link from "next/link";
import { BusinessConsole } from "@/components/admin/business-console";
import { getAdminPageAccess } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const access = await getAdminPageAccess();
  if (access.allowed) return <BusinessConsole />;
  return (
    <main className="admin-gate">
      <span className="brand-mark">ॐ</span>
      <p className="eyebrow">PRIVATE PRACTICE ADMIN</p>
      <h1>Sign in to manage AstroWithRitu.</h1>
      <p>Only the configured site owner can access customer, appointment and payment records.</p>
      {access.recognized ? <p>Your current account is not on the admin allowlist.</p> : <p>Cloudflare Access sign-in is required.</p>}
      <Link className="text-link" href="/">Return to website</Link>
    </main>
  );
}
