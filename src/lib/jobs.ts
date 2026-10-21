import type { Job, JobFilters, JobType, Schedule, WorkMode } from "@/types";

export const emptyFilters: JobFilters = {
  query: "",
  types: [],
  modes: [],
  schedules: [],
  categories: [],
  cities: [],
  sort: "recentes",
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Filtra vagas: categorias diferentes combinam com E; valores do mesmo grupo com OU. */
export function filterJobs(list: Job[], f: JobFilters, companyName: (slug: string) => string = () => ""): Job[] {
  const terms = normalize(f.query)
    .split(/[\s,]+/)
    .filter(Boolean);
  const result = list.filter((j) => {
    if (f.types.length && !f.types.includes(j.type)) return false;
    if (f.modes.length && !f.modes.includes(j.mode)) return false;
    if (f.schedules.length && !f.schedules.includes(j.schedule)) return false;
    if (f.categories.length && !f.categories.includes(j.category)) return false;
    if (f.cities.length && !f.cities.includes(j.city)) return false;
    if (terms.length) {
      const hay = normalize(
        [j.title, j.summary, j.city, j.category, companyName(j.companySlug)].join(" "),
      );
      // Qualquer termo encontrado conta (permite "São Lourenço, Caxambu").
      if (!terms.some((t) => hay.includes(t))) return false;
    }
    return true;
  });
  return result.sort((a, b) =>
    f.sort === "recentes"
      ? b.publishedAt.localeCompare(a.publishedAt)
      : a.publishedAt.localeCompare(b.publishedAt),
  );
}

export const typeLabel: Record<JobType, string> = { estagio: "Estágio", emprego: "Emprego" };
export const modeLabel: Record<WorkMode, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
};
export const scheduleLabel: Record<Schedule, string> = {
  integral: "Período integral",
  "meio-periodo": "Meio período",
};

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
}

export function formatEventDate(iso: string) {
  const d = new Date(`${iso}Z`);
  const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "UTC" }).format(d);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" })
    .format(d)
    .replace(".", "");
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" }).format(d);
  const time = iso.slice(11, 16);
  return { day, month, weekday, time };
}

export function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}
