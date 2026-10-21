// Tipos de domínio do CONECTA UNIS.
// Estes tipos espelham os modelos que a futura API REST (NestJS + Prisma/PostgreSQL) deve expor.

export type JobType = "estagio" | "emprego";
export type WorkMode = "presencial" | "hibrido" | "remoto";
export type Schedule = "integral" | "meio-periodo";
export type JobCategory =
  | "Administração"
  | "Contabilidade"
  | "Tecnologia"
  | "Saúde"
  | "Direito"
  | "Comércio"
  | "Atendimento";

export interface Job {
  slug: string;
  title: string;
  companySlug: string;
  type: JobType;
  mode: WorkMode;
  schedule: Schedule;
  category: JobCategory;
  city: string;
  summary: string;
  description: string;
  activities: string[];
  requirements: string[];
  benefits: string[];
  salary?: string;
  publishedAt: string; // ISO date
}

export interface Company {
  slug: string;
  name: string;
  sector: string;
  city: string;
  summary: string;
  about: string;
  initials: string;
  tone: "blue" | "purple" | "green" | "amber";
}

export type EventCategory = "Workshop" | "Feira" | "Palestra" | "Oficina";

export interface CareerEvent {
  id: string;
  title: string;
  date: string; // ISO date-time
  endTime: string; // HH:mm
  location: string;
  mode: "Presencial" | "Online";
  category: EventCategory;
  summary: string;
  description: string;
}

export interface CandidateProfile {
  name: string;
  course: string;
  period: string;
  skills: string[];
}

export interface JobFilters {
  query: string;
  types: JobType[];
  modes: WorkMode[];
  schedules: Schedule[];
  categories: JobCategory[];
  cities: string[];
  sort: "recentes" | "antigas";
}
