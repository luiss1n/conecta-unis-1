import { z } from "zod";

const passwordSymbols = new Set(Array.from("!@#$%^&*()_+-=[]{};':\"|<>?,./`~"));

export const strongPasswordSchema = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .max(72, "Use no máximo 72 caracteres.")
  .refine((value) => /\p{Lu}/u.test(value), "Inclua pelo menos uma letra maiúscula.")
  .refine((value) => /\p{N}/u.test(value), "Inclua pelo menos um número.")
  .refine((value) => Array.from(value).some((character) => passwordSymbols.has(character)), "Inclua pelo menos um símbolo, como !, @ ou #.");

export const passwordRequirements = "Mínimo de 8 caracteres, uma letra maiúscula, um número e um símbolo (como !, @ ou #).";
