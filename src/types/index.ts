
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
  
  companySlug: string | null;
  
  publisherName?: string | null | undefined;
  
  company?: Company | undefined;
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
  status?: "open" | "closed";
  closesAt?: string | null;
  isHidden?: boolean;
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
  isHidden?: boolean;
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
