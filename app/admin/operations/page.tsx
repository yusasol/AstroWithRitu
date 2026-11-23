import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { BusinessConsole } from "@/components/admin/business-console";
import { isSiteOwnerUserId } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export default async function OperationsPage() {
  const user = await getChatGPTUser();
  const allowed = isSiteOwnerUserId(user?.userId);
  if (allowed) return <BusinessConsole />;
  return <main className="admin-gate"><span className="brand-mark">ॐ</span><p className="eyebrow">PRIVATE PRACTICE ADMIN</p><h1>Sign in to manage AstroWithRitu.</h1><p>Only the configured site owner can access customer, appointment and payment records.</p>{user ? <p>Your current account is not on the admin allowlist.</p> : <a className="button" href={chatGPTSignInPath("/admin/operations")} target="_top">Sign in with ChatGPT</a>}<a className="text-link" href="/">Return to website</a></main>;
}
