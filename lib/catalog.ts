// Shared types and categories. Safe to import from client components.

export type Lang = "en" | "mn";
export type Localized = { en: string; mn: string };
export type LocalizedList = { en: string[]; mn: string[] };

export type Category = "repairs" | "woodwork" | "renovation" | "maintenance";

export type Service = {
  id: string;
  slug: string;
  category: Category;
  title: Localized;
  description: Localized;
  details: Localized;
  includes: LocalizedList;
};

export type RequestStatus = "new" | "contacted" | "scheduled" | "done" | "cancelled";
export const STATUSES: RequestStatus[] = ["new", "contacted", "scheduled", "done", "cancelled"];

export type ServiceRequest = {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  /** Booked visit, empty when the request has no date. */
  date: string;
  time: string;
  source: "form" | "chat" | "booking";
  status: RequestStatus;
  createdAt: string;
};

/** When customers can book visits. Edited from /admin → Availability. */
export type Availability = {
  workDays: number[]; // 0 = Sunday … 6 = Saturday
  slots: string[]; // "HH:MM" start times
  blockedDates: string[]; // "YYYY-MM-DD" days off
  leadDays: number; // earliest booking = today + leadDays
  horizonDays: number; // latest booking = today + horizonDays
};

export const DEFAULT_AVAILABILITY: Availability = {
  workDays: [1, 2, 3, 4, 5, 6],
  slots: ["09:00", "11:00", "14:00", "16:00"],
  blockedDates: [],
  leadDays: 2,
  horizonDays: 60,
};

export const CATEGORIES: { id: Category; label: Localized; blurb: Localized }[] = [
  {
    id: "repairs",
    label: { en: "Home Repairs", mn: "Гэрийн засвар" },
    blurb: { en: "Fix what's broken, properly.", mn: "Эвдэрсэн зүйлийг зөв засна." },
  },
  {
    id: "woodwork",
    label: { en: "Woodwork & Carpentry", mn: "Модон эдлэл, мужаан" },
    blurb: { en: "Custom timber, made to fit.", mn: "Хэмжээнд тааруулсан захиалгат мод." },
  },
  {
    id: "renovation",
    label: { en: "Renovation", mn: "Засвар шинэчлэл" },
    blurb: { en: "Upgrade rooms inside and out.", mn: "Өрөөг дотор, гадна талаас нь шинэчилнэ." },
  },
  {
    id: "maintenance",
    label: { en: "Maintenance", mn: "Арчилгаа" },
    blurb: { en: "Keep your property in shape.", mn: "Байраа сайн байдалд байлгана." },
  },
];

/** Pick the right language, falling back to English when the Mongolian text is empty. */
export function loc(value: Localized, lang: Lang) {
  return lang === "mn" && value.mn.trim() ? value.mn : value.en;
}

export function locList(value: LocalizedList, lang: Lang) {
  return lang === "mn" && value.mn.length ? value.mn : value.en;
}

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/&/g, " ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "service"
  );
}
