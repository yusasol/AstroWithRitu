import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const CLOCK_SKEW_SECONDS = 60;
const MAX_TOKEN_LENGTH = 12_000;

export type AccessDecision =
  | { outcome: "allow"; email: string }
  | { outcome: "deny"; recognized: boolean };

type AccessConfig = {
  teamDomain?: string;
  audience?: string;
  adminEmail?: string;
};

const deny: AccessDecision = { outcome: "deny", recognized: false };
const forbidden: AccessDecision = { outcome: "deny", recognized: true };

const jwksResolvers = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function normalizeTeamDomain(value: string): string | null {
  const domain = value.trim().toLowerCase().replace(/\.$/, "");
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) return null;
  return domain;
}

function normalizeAudience(value: string): string | null {
  const audience = value.trim();
  if (!audience || audience.length > 256 || /[\s\u0000-\u001f\u007f]/.test(audience)) return null;
  return audience;
}

function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 320 || /[\s\u0000-\u001f\u007f]/.test(email)) return null;
  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) return null;
  const domain = email.slice(at + 1);
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return null;
  return email;
}

function constantTimeEqual(left: string, right: string): boolean {
  const encodedLeft = new TextEncoder().encode(left);
  const encodedRight = new TextEncoder().encode(right);
  let difference = encodedLeft.length ^ encodedRight.length;
  const length = Math.max(encodedLeft.length, encodedRight.length);
  for (let index = 0; index < length; index += 1) difference |= (encodedLeft[index] ?? 0) ^ (encodedRight[index] ?? 0);
  return difference === 0;
}

function remoteJwks(jwksUrl: string) {
  const cached = jwksResolvers.get(jwksUrl);
  if (cached) return cached;
  const resolver = createRemoteJWKSet(new URL(jwksUrl), {
    timeoutDuration: 5_000,
    cooldownDuration: 30_000,
    cacheMaxAge: 60 * 60 * 1000,
  });
  jwksResolvers.set(jwksUrl, resolver);
  return resolver;
}

function issuedAtAllowed(payload: JWTPayload, nowSeconds: number): boolean {
  if (payload.iat === undefined) return true;
  return typeof payload.iat === "number" && Number.isSafeInteger(payload.iat) && payload.iat <= nowSeconds + CLOCK_SKEW_SECONDS;
}

export function readAccessJwt(requestHeaders: { get(name: string): string | null }): string | null {
  const token = requestHeaders.get("cf-access-jwt-assertion")?.trim() ?? "";
  if (!token || token.length > MAX_TOKEN_LENGTH || /[\s,]/.test(token)) return null;
  return token;
}

export async function authenticateAccessJwt(token: string | null | undefined, config: AccessConfig): Promise<AccessDecision> {
  const teamDomain = normalizeTeamDomain(config.teamDomain ?? "");
  const audience = normalizeAudience(config.audience ?? "");
  const adminEmail = normalizeEmail(config.adminEmail ?? "");
  if (!teamDomain || !audience || !adminEmail || !token || token.length > MAX_TOKEN_LENGTH || /[\s,]/.test(token)) return deny;

  const issuer = `https://${teamDomain}`;
  let payload: JWTPayload;
  try {
    const verified = await jwtVerify(token, remoteJwks(`${issuer}/cdn-cgi/access/certs`), {
      algorithms: ["RS256"],
      issuer,
      audience,
      clockTolerance: CLOCK_SKEW_SECONDS,
      requiredClaims: ["exp", "nbf"],
    });
    if (verified.protectedHeader.alg !== "RS256") return deny;
    payload = verified.payload;
  } catch {
    return deny;
  }

  if (!issuedAtAllowed(payload, Math.floor(Date.now() / 1000))) return deny;
  if (typeof payload.email !== "string") return deny;
  const email = normalizeEmail(payload.email);
  if (!email) return deny;
  if (!constantTimeEqual(email, adminEmail)) return forbidden;
  return { outcome: "allow", email };
}
