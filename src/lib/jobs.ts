import type { Job, JobFilters, JobType, Schedule, WorkMode } from "@/types";

export const APP_TIMEZONE = "America/Sao_Paulo";
export const DEFAULT_PUBLISHER = "Núcleo de Carreira e Empregabilidade";

/** Nome exibido de quem publicou a vaga: empresa > nome livre (admin) > padrão. */
export const jobPublisher = (j: Pick<Job, "company" | "publisherName">) =>
  j.company?.name ?? j.publisherName ?? DEFAULT_PUBLISHER;

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
export function filterJobs(list: Job[], f: JobFilters): Job[] {
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
        [j.title, j.summary, j.city, j.category, jobPublisher(j)].join(" "),
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
    timeZone: APP_TIMEZONE,
  }).format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
}

/**
 * Datas de eventos vêm do banco como timestamptz (ex.: "2026-11-05T17:00:00+00:00").
 * Sempre exibidas no fuso de Brasília, para o horário mostrado ser o que o admin digitou.
 */
export function formatEventDate(iso: string) {
  const d = new Date(iso);
  const part = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", { ...o, timeZone: APP_TIMEZONE }).format(d);
  return {
    day: part({ day: "2-digit" }),
    month: part({ month: "short" }).replace(".", ""),
    weekday: part({ weekday: "long" }),
    time: part({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
  };
}

export function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}
