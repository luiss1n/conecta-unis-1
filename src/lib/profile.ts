import { z } from "zod";

export const profileSchema = z.object({
  display_name: z.string().trim().min(2, "Informe um nome com pelo menos 2 letras").max(100),
  headline: z.string().trim().max(160),
  address: z.string().trim().max(250),
  city: z.string().trim().min(2, "Informe a cidade").max(100),
  state: z.string().trim().max(100),
  country: z.string().trim().max(100),
  education: z.string().trim().max(160),
  institution: z.string().trim().max(160),
  phone: z.string().trim().max(30),
  bio: z.string().trim().max(2000),
});

export type ProfileValues = z.infer<typeof profileSchema>;
export const profileKinds = ["company", "visitor", "professor"] as const;
export const profileKindLabels = { company: "Empresa", visitor: "Estudante ou egresso", professor: "Professor", admin: "Administrador" };

/** Opções exibidas ao criar a conta. O tipo escolhido define o papel automaticamente (ver migração 0005). */
export const accountTypeOptions = [
  { value: "visitor", label: "Estudante ou egresso", hint: "Busco vagas, eventos e oportunidades" },
  { value: "company", label: "Empresa", hint: "Quero divulgar vagas" },
  { value: "professor", label: "Professor", hint: "Quero divulgar eventos e atividades" },
] as const;

const completenessFields = [
  ["display_name", "Nome"],
  ["headline", "Título profissional"],
  ["city", "Cidade"],
  ["education", "Formação"],
  ["institution", "Instituição"],
  ["phone", "Telefone"],
  ["bio", "Apresentação"],
  ["avatar_path", "Foto"],
  ["resume_path", "Currículo"],
] as const;

/** Quanto do perfil está preenchido (dados reais do usuário) e o que ainda falta. */
export function profileCompleteness(p: Partial<Record<(typeof completenessFields)[number][0], string | null>>) {
  const missing = completenessFields.filter(([key]) => !(p[key] ?? "").trim()).map(([, label]) => label);
  const done = completenessFields.length - missing.length;
  return { percent: Math.round((done / completenessFields.length) * 100), missing };
}
export type ProfileFileKind = "avatar" | "banner" | "resume";

/** Reconhece PNG, JPEG e WebP pelos primeiros bytes (não confia só na extensão/tipo informado pelo navegador). */
export function detectImageExt(b: Uint8Array): "png" | "jpg" | "webp" | null {
  if (b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71) return "png";
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return "jpg";
  const ascii = (from: number, to: number) => String.fromCharCode(...Array.from(b.slice(from, to)));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export function validateProfileFile(file: Pick<File, "type" | "size">, kind: ProfileFileKind) {
  const accepted = kind === "resume" ? ["application/pdf"] : ["image/jpeg", "image/png", "image/webp"];
  if (!accepted.includes(file.type)) throw new Error(kind === "resume" ? "Selecione um currículo em PDF." : "Selecione uma imagem JPG, PNG ou WebP.");
  if (file.size === 0 || file.size > 2 * 1024 * 1024) throw new Error("O arquivo deve ter até 2 MB e não pode estar vazio.");
}