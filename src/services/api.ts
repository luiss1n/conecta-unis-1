/**
 * Camada de serviços do CONECTA UNIS.
 *
 * Vagas, empresas e eventos são lidos do Supabase (tabelas públicas, protegidas por RLS).
 * A interface consome apenas estas funções; as regras de quem pode escrever ficam nas policies do banco
 * (ver drizzle/migrations). `getCandidateProfile` ainda devolve um perfil de demonstração.
 */
import { demoCandidate } from "@/data/demo";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { profileSchema, validateProfileFile, type ProfileValues, type ProfileFileKind } from "@/lib/profile";
import type { CareerEvent, Company, Job, JobCategory } from "@/types";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

const TONES: readonly string[] = ["blue", "purple", "green", "amber"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toCompany(r: CompanyRow): Company {
  return {
    slug: r.slug,
    name: r.name,
    sector: r.sector,
    city: r.city,
    summary: r.summary,
    about: r.about,
    initials: r.initials || r.name.slice(0, 2).toUpperCase(),
    tone: TONES.includes(r.tone) ? (r.tone as Company["tone"]) : "blue",
  };
}

function toJob(r: JobRow, company?: Company): Job {
  return {
    slug: r.slug,
    title: r.title,
    companySlug: r.companySlug,
    publisherName: r.publisher_name,
    company,
    type: r.type as Job["type"],
    mode: r.mode as Job["mode"],
    schedule: r.schedule as Job["schedule"],
    category: r.category as JobCategory,
    city: r.city,
    summary: r.summary,
    description: r.description,
    activities: r.activities,
    requirements: r.requirements,
    benefits: r.benefits,
    ...(r.salary ? { salary: r.salary } : {}),
    publishedAt: r.publishedAt,
  };
}

function toEvent(r: EventRow): CareerEvent {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    endTime: r.endTime,
    location: r.location,
    mode: r.mode as CareerEvent["mode"],
    category: r.category as CareerEvent["category"],
    summary: r.summary,
    description: r.description,
  };
}

export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await supabase.from("companies").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(toCompany);
}

export async function getCompany(slug: string): Promise<Company | undefined> {
  const { data, error } = await supabase.from("companies").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? toCompany(data) : undefined;
}

/** Todas as vagas, da mais recente para a mais antiga, já com a empresa resolvida. */
export async function getJobs(): Promise<Job[]> {
  const [jobsRes, companies] = await Promise.all([
    supabase.from("jobs").select("*").order("publishedAt", { ascending: false }),
    getCompanies(),
  ]);
  if (jobsRes.error) throw jobsRes.error;
  const bySlug = new Map(companies.map((c) => [c.slug, c]));
  return (jobsRes.data ?? []).map((r) => toJob(r, r.companySlug ? bySlug.get(r.companySlug) : undefined));
}

export async function getJob(slug: string): Promise<Job | undefined> {
  const { data, error } = await supabase.from("jobs").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return toJob(data, data.companySlug ? await getCompany(data.companySlug) : undefined);
}

export async function getJobsByCompany(slug: string): Promise<Job[]> {
  const { data, error } = await supabase.from("jobs").select("*").eq("companySlug", slug).order("publishedAt", { ascending: false });
  if (error) throw error;
  const company = await getCompany(slug);
  return (data ?? []).map((r) => toJob(r, company));
}

/** Eventos em ordem cronológica. Com `upcomingOnly`, só os que ainda não aconteceram. */
export async function getEvents(opts: { upcomingOnly?: boolean } = {}): Promise<CareerEvent[]> {
  let q = supabase.from("events").select("*").order("date", { ascending: true });
  if (opts.upcomingOnly) q = q.gte("date", new Date().toISOString());
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(toEvent);
}

export async function getEvent(id: string): Promise<CareerEvent | undefined> {
  if (!UUID.test(id)) return undefined;
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toEvent(data) : undefined;
}

export const getCandidateProfile = () => demoCandidate;

/** Papel da conta logada (null se deslogado ou sem cadastro). Usado para exibir o menu de admin. */
export async function getMyRole() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).maybeSingle();
  if (error) throw error;
  return data?.role ?? null;
}

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Entre na sua conta para continuar.");
  return data.user;
}

export async function getMyProfile() {
  const user = await requireUser();
  const [profile, role, company, professor] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    supabase.from("companies").select("*").eq("owner_id", user.id).maybeSingle(),
    supabase.from("professor_details").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  for (const result of [profile, role, company, professor]) if (result.error) throw result.error;
  if (!profile.data) throw new Error("Perfil não encontrado.");
  async function signed(path: string) {
    if (!path) return null;
    const { data, error } = await supabase.storage.from("profile-photos").createSignedUrl(path, 3600);
    if (error) throw new Error("Não foi possível carregar os arquivos do perfil.");
    return data.signedUrl;
  }
  const [avatarUrl, bannerUrl, resumeUrl] = await Promise.all([
    signed(profile.data.avatar_path), signed(profile.data.banner_path), signed(profile.data.resume_path),
  ]);
  return { profile: profile.data, role: role.data?.role ?? null, company: company.data, professor: professor.data, avatarUrl, bannerUrl, resumeUrl, email: user.email ?? "" };
}

export async function saveMyProfile(values: ProfileValues) {
  const parsed = profileSchema.parse(values);
  const user = await requireUser();
  const { error } = await supabase.from("profiles").update(parsed).eq("id", user.id).select("id").single();
  if (error) throw error;
}

export async function uploadProfileFile(file: File, kind: ProfileFileKind) {
  validateProfileFile(file, kind);
  const user = await requireUser();
  // Check actual bytes as well as the browser-provided content type.
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const pdf = new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (kind === "resume" ? !pdf : !png && !jpg && !webp) throw new Error("O conteúdo do arquivo não corresponde ao formato escolhido.");
  const ext = kind === "resume" ? "pdf" : png ? "png" : jpg ? "jpg" : "webp";
  const column = kind === "avatar" ? "avatar_path" : kind === "banner" ? "banner_path" : "resume_path";
  const { data: current, error: readError } = await supabase.from("profiles").select("avatar_path,banner_path,resume_path").eq("id", user.id).single();
  if (readError) throw readError;
  const path = `${user.id}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error("Não foi possível enviar o arquivo. Tente novamente.");
  const update = kind === "resume" ? { resume_path: path, resume_name: file.name.slice(0, 200) } : { [column]: path };
  const { error } = await supabase.from("profiles").update(update).eq("id", user.id).select("id").single();
  if (error) {
    await supabase.storage.from("profile-photos").remove([path]);
    throw error;
  }
  const oldPath = current?.[column];
  if (oldPath) await supabase.storage.from("profile-photos").remove([oldPath]);
}

export interface NewJobValues {
  title: string;
  type: "estagio" | "emprego";
  mode: "presencial" | "hibrido" | "remoto";
  schedule: "integral" | "meio-periodo";
  category: string;
  city: string;
  summary: string;
  description: string;
  activities: string[];
  requirements: string[];
  benefits: string[];
  salary?: string | undefined;
}

function jobPayload(values: NewJobValues) {
  return {
    title: values.title.trim(),
    type: values.type,
    mode: values.mode,
    schedule: values.schedule,
    category: values.category,
    city: values.city.trim(),
    summary: values.summary.trim(),
    description: values.description.trim(),
    activities: values.activities,
    requirements: values.requirements,
    benefits: values.benefits,
    salary: values.salary?.trim() || null,
  };
}

export async function createJob(values: NewJobValues) {
  const user = await requireUser();
  const { data: company, error: companyError } = await supabase
    .from("companies").select("slug").eq("owner_id", user.id).maybeSingle();
  if (companyError) throw companyError;
  if (!company) throw new Error("Cadastre sua empresa antes de publicar vagas.");
  const { error } = await supabase.from("jobs").insert({ owner_id: user.id, companySlug: company.slug, ...jobPayload(values) });
  if (error) throw new Error("Não foi possível publicar a vaga. Verifique os dados e tente novamente.");
}

export interface NewEventValues {
  title: string;
  date: string; // ISO date-time (UTC)
  endTime: string; // HH:mm
  location: string;
  mode: "Presencial" | "Online";
  category: "Workshop" | "Feira" | "Palestra" | "Oficina";
  summary: string;
  description: string;
}

function eventPayload(values: NewEventValues) {
  return {
    title: values.title.trim(),
    date: values.date,
    endTime: values.endTime,
    location: values.location.trim(),
    mode: values.mode,
    category: values.category,
    summary: values.summary.trim(),
    description: values.description.trim(),
  };
}

export async function createEvent(values: NewEventValues) {
  const user = await requireUser();
  const { error } = await supabase.from("events").insert({ owner_id: user.id, ...eventPayload(values) });
  if (error) throw new Error("Não foi possível publicar o evento. Verifique os dados e tente novamente.");
}

// ---------------------------------------------------------------------------------------------
// Administração. A autorização real está nas policies `jobs_admin_all` / `events_admin_all`
// (migração 0004); estas funções só montam as consultas e traduzem os erros.
// ---------------------------------------------------------------------------------------------

export interface AdminJobValues extends NewJobValues {
  /** Empresa cadastrada (opcional). Sem empresa, `publisherName` é obrigatório. */
  companySlug: string | null;
  publisherName: string | null;
}

/** Cria (sem `slug`) ou atualiza (com `slug`) uma vaga como administrador. */
export async function saveJobAsAdmin(values: AdminJobValues, slug?: string) {
  const user = await requireUser();
  const publisher = values.companySlug ? null : values.publisherName?.trim() || null;
  if (!values.companySlug && !publisher) throw new Error("Escolha uma empresa ou informe quem está publicando a vaga.");
  const payload = { ...jobPayload(values), companySlug: values.companySlug, publisher_name: publisher };
  if (slug) {
    const { error } = await supabase.from("jobs").update(payload).eq("slug", slug).select("slug").single();
    if (error) throw new Error("Não foi possível salvar a vaga. Verifique os dados e suas permissões.");
    return;
  }
  const { error } = await supabase.from("jobs").insert({ owner_id: user.id, ...payload });
  if (error) throw new Error("Não foi possível publicar a vaga. Verifique os dados e tente novamente.");
}

export async function deleteJob(slug: string) {
  const { data, error } = await supabase.from("jobs").delete().eq("slug", slug).select("slug");
  if (error || !data?.length) throw new Error("Não foi possível excluir a vaga.");
}

/** Cria (sem `id`) ou atualiza (com `id`) um evento como administrador. */
export async function saveEventAsAdmin(values: NewEventValues, id?: string) {
  const user = await requireUser();
  if (id) {
    const { error } = await supabase.from("events").update(eventPayload(values)).eq("id", id).select("id").single();
    if (error) throw new Error("Não foi possível salvar o evento. Verifique os dados e suas permissões.");
    return;
  }
  const { error } = await supabase.from("events").insert({ owner_id: user.id, ...eventPayload(values) });
  if (error) throw new Error("Não foi possível publicar o evento. Verifique os dados e tente novamente.");
}

export async function deleteEvent(id: string) {
  const { data, error } = await supabase.from("events").delete().eq("id", id).select("id");
  if (error || !data?.length) throw new Error("Não foi possível excluir o evento.");
}

export async function removeProfileFile(kind: ProfileFileKind) {
  const user = await requireUser();
  const column = kind === "avatar" ? "avatar_path" : kind === "banner" ? "banner_path" : "resume_path";
  const { data, error: readError } = await supabase.from("profiles").select("avatar_path,banner_path,resume_path").eq("id", user.id).single();
  if (readError) throw readError;
  const update = kind === "resume" ? { resume_path: "", resume_name: "" } : { [column]: "" };
  const { error } = await supabase.from("profiles").update(update).eq("id", user.id).select("id").single();
  if (error) throw error;
  const path = data?.[column];
  if (path) await supabase.storage.from("profile-photos").remove([path]);
}
