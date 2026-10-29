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
import { z } from "zod";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];
export type ApplicationMessage = Database["public"]["Tables"]["application_messages"]["Row"];
export type UserNotification = Database["public"]["Tables"]["notifications"]["Row"];
export type PlatformStats = { users: number; jobs: number; companies: number; events: number };

export async function getPlatformStats(): Promise<PlatformStats> {
  const { data, error } = await supabase.rpc("get_platform_stats");
  if (error) throw error;
  return data as unknown as PlatformStats;
}

export async function getMyNotifications(): Promise<UserNotification[]> {
  const user = await requireUser();
  const { data, error } = await supabase.from("notifications").select("*").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error("Não foi possível carregar suas notificações.");
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const user = await requireUser();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("recipient_id", user.id).is("read_at", null);
  if (error) throw new Error("Não foi possível atualizar a notificação.");
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).is("read_at", null);
  if (error) throw new Error("Não foi possível atualizar as notificações.");
}

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

export async function getMyEventInterestIds(): Promise<string[]> {
  const user = await requireUser();
  const { data, error } = await supabase.from("event_interests").select("event_id").eq("user_id", user.id);
  if (error) throw new Error("Não foi possível carregar suas inscrições em eventos.");
  return (data ?? []).map((item) => item.event_id);
}

export async function registerForEvent(eventId: string): Promise<void> {
  const user = await requireUser();
  const { error } = await supabase.from("event_interests").upsert(
    { user_id: user.id, event_id: eventId },
    { onConflict: "user_id,event_id", ignoreDuplicates: true },
  );
  if (error) throw new Error("Entre como aluno ou professor para se inscrever neste evento.");
}

export async function getMyEventRegistrations() {
  const user = await requireUser();
  const { data, error } = await supabase.from("event_interests").select("event_id,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Não foi possível carregar suas inscrições em eventos.");
  const events = await Promise.all((data ?? []).map(async (item) => ({ registration: item, event: await getEvent(item.event_id) })));
  return events.flatMap((item) => item.event ? [{ registration: item.registration, event: item.event }] : []);
}

export async function getMyJobApplication(jobSlug: string): Promise<JobApplication | null> {
  const user = await requireUser();
  const { data, error } = await supabase.from("job_applications").select("*").eq("job_slug", jobSlug).eq("applicant_id", user.id).maybeSingle();
  if (error) throw new Error("Não foi possível verificar sua candidatura.");
  return data;
}

export async function submitJobApplication(jobSlug: string, coverMessage: string): Promise<string> {
  const parsed = z.string().trim().max(2000, "A mensagem pode ter até 2.000 caracteres.").safeParse(coverMessage);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Mensagem inválida.");
  const { data, error } = await supabase.rpc("submit_job_application", {
    _job_slug: jobSlug,
    _consent: true,
    _cover_message: parsed.data,
  });
  if (error) {
    if (error.message.includes("already applied")) throw new Error("Você já se candidatou a esta vaga.");
    if (error.message.includes("Complete your profile")) throw new Error("Complete seu nome e e-mail no perfil antes de se candidatar.");
    throw new Error("Não foi possível enviar sua candidatura. Confira seu perfil e tente novamente.");
  }
  return data;
}

export type ApplicationListItem = { application: JobApplication; job: Job };

async function attachApplicationJobs(rows: JobApplication[]): Promise<ApplicationListItem[]> {
  const slugs = [...new Set(rows.map((row) => row.job_slug))];
  const jobs = await Promise.all(slugs.map(async (slug) => [slug, await getJob(slug)] as const));
  const bySlug = new Map<string, Job>();
  for (const [slug, job] of jobs) if (job) bySlug.set(slug, job);
  return rows.flatMap((application) => {
    const job = bySlug.get(application.job_slug);
    return job ? [{ application, job }] : [];
  });
}

export async function getMyApplications(): Promise<ApplicationListItem[]> {
  const user = await requireUser();
  const { data, error } = await supabase.from("job_applications").select("*").eq("applicant_id", user.id).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Não foi possível carregar suas candidaturas.");
  return attachApplicationJobs(data ?? []);
}

export async function getReceivedApplications(): Promise<ApplicationListItem[]> {
  const user = await requireUser();
  const { data: jobs, error: jobsError } = await supabase.from("jobs").select("slug").eq("owner_id", user.id);
  if (jobsError) throw new Error("Não foi possível carregar suas vagas.");
  const slugs = (jobs ?? []).map((job) => job.slug);
  if (!slugs.length) return [];
  const { data, error } = await supabase.from("job_applications").select("*").in("job_slug", slugs).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Não foi possível carregar as candidaturas recebidas.");
  return attachApplicationJobs(data ?? []);
}

export async function getApplicationConversation(applicationId: string) {
  const user = await requireUser();
  const { data: application, error } = await supabase.from("job_applications").select("*").eq("id", applicationId).maybeSingle();
  if (error || !application) throw new Error("Conversa não encontrada ou sem permissão.");
  const job = await getJob(application.job_slug);
  if (!job) throw new Error("A vaga desta candidatura não está mais disponível.");
  return { application, job, isCandidate: application.applicant_id === user.id };
}

export async function getApplicationMessages(applicationId: string): Promise<ApplicationMessage[]> {
  const { data, error } = await supabase.from("application_messages").select("*").eq("application_id", applicationId).order("created_at", { ascending: true }).limit(200);
  if (error) throw new Error("Não foi possível carregar as mensagens.");
  return data ?? [];
}

export async function sendApplicationMessage(applicationId: string, body: string): Promise<void> {
  const parsed = z.string().trim().min(1, "Escreva uma mensagem.").max(4000, "A mensagem pode ter até 4.000 caracteres.").safeParse(body);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Mensagem inválida.");
  const user = await requireUser();
  const { error } = await supabase.from("application_messages").insert({ application_id: applicationId, sender_id: user.id, body: parsed.data });
  if (error) throw new Error("Não foi possível enviar a mensagem. Verifique se você participa desta conversa.");
}

export async function updateApplicationStatus(applicationId: string, status: "reviewing" | "interview" | "closed" | "withdrawn"): Promise<void> {
  const { error } = await supabase.rpc("update_job_application_status", { _application_id: applicationId, _status: status });
  if (error) throw new Error("Não foi possível atualizar o status desta candidatura.");
}

export async function getApplicationResumeUrl(application: JobApplication): Promise<string | null> {
  if (!application.applicant_resume_path) return null;
  const { data, error } = await supabase.storage.from("profile-photos").createSignedUrl(application.applicant_resume_path, 300);
  if (error) throw new Error("O currículo não está disponível para esta conversa.");
  return data.signedUrl;
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
  const [storedAvatarUrl, bannerUrl, resumeUrl] = await Promise.all([
    signed(profile.data.avatar_path), signed(profile.data.banner_path), signed(profile.data.resume_path),
  ]);
  const googleAvatarUrl = getGoogleAvatarUrl(user.user_metadata);
  const avatarUrl = storedAvatarUrl ?? googleAvatarUrl;
  return { profile: profile.data, role: role.data?.role ?? null, company: company.data, professor: professor.data, avatarUrl, bannerUrl, resumeUrl, email: user.email ?? "" };
}

function getGoogleAvatarUrl(metadata: Record<string, unknown>): string | null {
  const candidate = metadata.avatar_url ?? metadata.picture;
  if (typeof candidate !== "string") return null;
  try {
    const url = new URL(candidate);
    const isGoogleImageHost = url.protocol === "https:" &&
      (url.hostname === "googleusercontent.com" || url.hostname.endsWith(".googleusercontent.com"));
    return isGoogleImageHost ? url.toString() : null;
  } catch {
    return null;
  }
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
  const role = await getMyRole();
  let publisher: { companySlug: string | null; publisher_name: string | null };
  if (role === "company") {
    const { data: company, error: companyError } = await supabase
      .from("companies").select("slug").eq("owner_id", user.id).maybeSingle();
    if (companyError) throw companyError;
    if (!company) throw new Error("Complete o cadastro da empresa antes de publicar vagas.");
    publisher = { companySlug: company.slug, publisher_name: null };
  } else if (role === "professor") {
    const [profile, academic] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
      supabase.from("professor_details").select("institution").eq("user_id", user.id).maybeSingle(),
    ]);
    if (profile.error || academic.error) throw new Error("Não foi possível carregar os dados de publicação.");
    publisher = { companySlug: null, publisher_name: academic.data?.institution || profile.data.display_name };
  } else {
    throw new Error("Somente empresas e professores podem publicar vagas por esta área.");
  }
  const { error } = await supabase.from("jobs").insert({ owner_id: user.id, ...publisher, ...jobPayload(values) });
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
