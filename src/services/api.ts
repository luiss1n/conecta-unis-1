/**
 * Camada de serviços do CONECTA UNIS.
 *
 * Nesta primeira versão, todas as funções retornam DADOS DEMONSTRATIVOS locais.
 * INTEGRAÇÃO FUTURA: substituir os retornos por chamadas à API REST (NestJS + Prisma/PostgreSQL),
 * por exemplo `fetch(`${API_URL}/vagas`)`. A interface consome apenas estas funções,
 * o que facilita a troca da fonte de dados (e uma eventual migração para Next.js).
 *
 * AUTENTICAÇÃO FUTURA: o perfil do candidato (getCandidateProfile) virá da sessão do usuário.
 * CANDIDATURAS FUTURAS: POST /candidaturas — hoje NÃO há envio nem armazenamento de dados.
 */
import { companies } from "@/data/companies";
import { events } from "@/data/events";
import { jobs } from "@/data/jobs";
import { demoCandidate } from "@/data/demo";
import { supabase } from "@/integrations/supabase/client";
import { profileSchema, validateProfileFile, type ProfileValues, type ProfileFileKind } from "@/lib/profile";

export const getJobs = () => jobs;
export const getJob = (slug: string) => jobs.find((j) => j.slug === slug);
export const getCompanies = () => companies;
export const getCompany = (slug: string) => companies.find((c) => c.slug === slug);
export const getCompanyName = (slug: string) => getCompany(slug)?.name ?? "";
export const getJobsByCompany = (slug: string) => jobs.filter((j) => j.companySlug === slug);
export const getEvents = () => events;
export const getEvent = (id: string) => events.find((e) => e.id === id);
export const getCandidateProfile = () => demoCandidate;

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

export async function createJob(values: NewJobValues) {
  const user = await requireUser();
  const { data: company, error: companyError } = await supabase
    .from("companies").select("slug").eq("owner_id", user.id).maybeSingle();
  if (companyError) throw companyError;
  if (!company) throw new Error("Cadastre sua empresa antes de publicar vagas.");
  const { error } = await supabase.from("jobs").insert({
    owner_id: user.id,
    companySlug: company.slug,
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
  });
  if (error) throw new Error("Não foi possível publicar a vaga. Verifique os dados e tente novamente.");
}

export interface NewEventValues {
  title: string;
  date: string; // ISO date-time
  endTime: string; // HH:mm
  location: string;
  mode: "Presencial" | "Online";
  category: "Workshop" | "Feira" | "Palestra" | "Oficina";
  summary: string;
  description: string;
}

export async function createEvent(values: NewEventValues) {
  const user = await requireUser();
  const { error } = await supabase.from("events").insert({
    owner_id: user.id,
    title: values.title.trim(),
    date: values.date,
    endTime: values.endTime,
    location: values.location.trim(),
    mode: values.mode,
    category: values.category,
    summary: values.summary.trim(),
    description: values.description.trim(),
  });
  if (error) throw new Error("Não foi possível publicar o evento. Verifique os dados e tente novamente.");
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
