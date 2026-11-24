import { headers } from "next/headers";
import { env } from "cloudflare:workers";
import { authenticateAccessJwt, readAccessJwt, type AccessDecision } from "@/lib/cloudflare-access";

function isLocalAdminBypass(): boolean {
  return import.meta.env.DEV && env.LOCAL_DEV === "true";
}

async function decide(requestHeaders: { get(name: string): string | null }): Promise<AccessDecision> {
  if (isLocalAdminBypass()) return { outcome: "allow", email: "local-dev@localhost" };
  // The Access email header is not an identity. Only the verified JWT can grant access.
  return authenticateAccessJwt(readAccessJwt(requestHeaders), {
    teamDomain: env.CF_ACCESS_TEAM_DOMAIN,
    audience: env.CF_ACCESS_AUD,
    adminEmail: env.ADMIN_EMAIL,
  });
}

export async function isSiteOwner(request: Request): Promise<boolean> {
  return (await decide(request.headers)).outcome === "allow";
}

export async function getAdminPageAccess(): Promise<{ allowed: true } | { allowed: false; recognized: boolean }> {
  const decision = await decide(await headers());
  if (decision.outcome === "allow") return { allowed: true };
  return { allowed: false, recognized: decision.recognized };
}
