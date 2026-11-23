import { env } from "cloudflare:workers";

function getKeyBytes() {
  if (!env.INTAKE_ENCRYPTION_KEY) throw new Error("Secure booking storage is not configured.");
  const bytes = Uint8Array.from(atob(env.INTAKE_ENCRYPTION_KEY), (character) => character.charCodeAt(0));
  if (bytes.byteLength !== 32) throw new Error("The intake encryption key must be 32 bytes.");
  return bytes;
}

export async function hashContact(value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", getKeyBytes(), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(normalized));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function encryptIntake(value: unknown): Promise<string> {
  const key = await crypto.subtle.importKey("raw", getKeyBytes(), "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cleartext = new TextEncoder().encode(JSON.stringify(value));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, cleartext);
  const payload = new Uint8Array(iv.length + encrypted.byteLength);
  payload.set(iv);
  payload.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...payload));
}

export async function decryptIntake(value: string): Promise<Record<string, unknown>> {
  const key = await crypto.subtle.importKey("raw", getKeyBytes(), "AES-GCM", false, ["decrypt"]);
  const payload = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  const cleartext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: payload.slice(0, 12) }, key, payload.slice(12));
  return JSON.parse(new TextDecoder().decode(cleartext)) as Record<string, unknown>;
}
