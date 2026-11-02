import { CATEGORIES, loc, type Lang } from "@/lib/catalog";
import { DICT } from "@/lib/i18n";
import type { StageId } from "@/components/house/timeline";

// Words for the 3D house experience. Headlines reuse the site's existing copy;
// the new strings are descriptive labels only (no new services, prices or claims).

const extra = {
  en: {
    exterior: "Exterior",
    structure: "Structure",
    structureTitle: "Built from the ground up.",
    structureSub: "Foundation. Frame. Walls. Roof.",
    interior: "Interior",
    interiorTitle: "Rooms made to live in.",
    finish: "Finished",
    scroll: "Scroll to explore",
    loading: "Preparing the house",
    before: "Before",
    after: "After",
    captions: {
      living: "Living room",
      kitchen: "Kitchen",
      bedroom: "Bedroom",
      bathroom: "Bathroom",
      shelving: "Built-in shelving",
      panels: "Timber wall panels",
      cabinetry: "Custom cabinetry",
      porch: "Timber porch & decking",
      steps: "Wooden steps",
    },
    stagesLabel: "Chapters",
    skip: "Skip to services",
  },
  mn: {
    exterior: "Гадна тал",
    structure: "Бүтэц",
    structureTitle: "Суурнаас нь эхлэн.",
    structureSub: "Суурь. Хүрээ. Хана. Дээвэр.",
    interior: "Дотор тал",
    interiorTitle: "Амьдрахад тухтай өрөөнүүд.",
    finish: "Бэлэн болсон",
    scroll: "Гүйлгэж үзээрэй",
    loading: "Байшинг бэлдэж байна",
    before: "Өмнө",
    after: "Дараа",
    captions: {
      living: "Зочны өрөө",
      kitchen: "Гал тогоо",
      bedroom: "Унтлагын өрөө",
      bathroom: "Угаалгын өрөө",
      shelving: "Суурилуулсан тавиур",
      panels: "Ханын модон хавтан",
      cabinetry: "Захиалгат шүүгээ",
      porch: "Модон веранда, тавцан",
      steps: "Модон шат",
    },
    stagesLabel: "Бүлгүүд",
    skip: "Үйлчилгээ рүү очих",
  },
};

export type StageCopy = { id: StageId; label: string; title: string; sub?: string };

export function houseCopy(lang: Lang) {
  const t = DICT[lang];
  const x = extra[lang];
  const cat = (id: string) => CATEGORIES.find((c) => c.id === id)!;
  const stages: StageCopy[] = [
    { id: "exterior", label: x.exterior, title: `${t.hero.h1a} ${t.hero.h1b}`, sub: t.hero.pill },
    { id: "structure", label: x.structure, title: x.structureTitle, sub: x.structureSub },
    { id: "interior", label: x.interior, title: x.interiorTitle },
    { id: "woodwork", label: loc(cat("woodwork").label, lang), title: loc(cat("woodwork").blurb, lang) },
    { id: "renovation", label: loc(cat("renovation").label, lang), title: loc(cat("renovation").blurb, lang) },
    { id: "finish", label: x.finish, title: t.about.h2, sub: t.book.sub },
  ];
  return {
    stages,
    captions: x.captions as Record<string, string>,
    scroll: x.scroll,
    loading: x.loading,
    before: x.before,
    after: x.after,
    stagesLabel: x.stagesLabel,
    skip: x.skip,
    book: t.hero.quote,
    call: t.hero.call,
  };
}

export type HouseCopy = ReturnType<typeof houseCopy>;
