import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "phr_admin";

/** The admin password. In production it must come from ADMIN_PASSWORD; the "changeme" default is for local dev only. */
function password(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : "changeme";
}

function token(value: string) {
  return createHash("sha256").update(`phr:${value}`).digest("hex");
}

export function checkPassword(input: string) {
  const pw = password();
  if (!pw) return false;
  return timingSafeEqual(Buffer.from(token(input)), Buffer.from(token(pw)));
}

export function sessionToken() {
  const pw = password();
  return pw ? token(pw) : null;
}

export function isAdmin() {
  const expected = sessionToken();
  return !!expected && cookies().get(ADMIN_COOKIE)?.value === expected;
}
