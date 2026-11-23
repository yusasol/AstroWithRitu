import { env } from "cloudflare:workers";

export function isPublicIntakeEnabled(): boolean {
  if (import.meta.env.DEV && env.LOCAL_DEV === "true") return true;
  return env.PUBLIC_INTAKE_ENABLED === "true" && Boolean(env.INTAKE_ENCRYPTION_KEY && env.ADMIN_USER_ID);
}
