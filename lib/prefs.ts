import { cookies } from "next/headers";
import type { Lang } from "./catalog";

export type Theme = "light" | "dark";

export function getLang(): Lang {
  return cookies().get("lang")?.value === "mn" ? "mn" : "en";
}

/** Explicit choice from the toggle; undefined means "follow the device setting". */
export function getTheme(): Theme | undefined {
  const v = cookies().get("theme")?.value;
  return v === "light" || v === "dark" ? v : undefined;
}
