import { env } from "cloudflare:workers";

export function isSiteOwnerUserId(userId: string | null | undefined): boolean {
  const localPreview = import.meta.env.DEV && env.LOCAL_DEV === "true";
  return Boolean(localPreview || (userId && env.ADMIN_USER_ID && userId === env.ADMIN_USER_ID));
}

export function isSiteOwner(request: Request): boolean {
  return isSiteOwnerUserId(request.headers.get("oai-authenticated-user-id"));
}
