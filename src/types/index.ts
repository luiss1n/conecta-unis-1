// Tipos de domínio do CONECTA UNIS.
// Estes tipos espelham as tabelas do Supabase (PostgreSQL) já mapeadas em src/services/api.ts.

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
  /** null quando a vaga foi publicada pelo administrador sem empresa cadastrada. */
  companySlug: string | null;
  /** Nome do publicador quando não há empresa (ex.: Núcleo de Carreira). */
  publisherName?: string | null | undefined;
  /** Caminho da imagem da vaga no bucket público job-images (para edição). */
  imagePath?: string | null | undefined;
  /** URL pública da imagem (logo/foto da empresa) já resolvida pelo serviço. */
  imageUrl?: string | undefined;
  /** Empresa resolvida pelo serviço (não vem da tabela jobs). */
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

export interface JobFilters {
  query: string;
  types: JobType[];
  modes: WorkMode[];
  schedules: Schedule[];
  categories: JobCategory[];
  cities: string[];
  sort: "recentes" | "antigas";
}
