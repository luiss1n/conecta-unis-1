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
export const profileKindLabels = { company: "Empresa", visitor: "Visitante", professor: "Professor" };
export type ProfileFileKind = "avatar" | "banner" | "resume";

export function validateProfileFile(file: Pick<File, "type" | "size">, kind: ProfileFileKind) {
  const accepted = kind === "resume" ? ["application/pdf"] : ["image/jpeg", "image/png", "image/webp"];
  if (!accepted.includes(file.type)) throw new Error(kind === "resume" ? "Selecione um currículo em PDF." : "Selecione uma imagem JPG, PNG ou WebP.");
  if (file.size === 0 || file.size > 2 * 1024 * 1024) throw new Error("O arquivo deve ter até 2 MB e não pode estar vazio.");
}