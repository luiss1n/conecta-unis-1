import { describe, expect, it } from "vitest";
import { formatBrazilianCnpj, isValidBrazilianCnpj } from "./profile";

describe("Complete profiles", () => {
  it("supports company, visitor and professor accounts", () => {
    expect(profileKinds).toEqual(["company", "visitor", "professor"]);
  });
  it("validates and preserves requested profile details", () => {
    const values = {
      display_name: "Luis Torres",
      headline: "Estudante",
      address: "Rua das Flores, 10",
      city: "São Lourenço",
      state: "MG",
      country: "Brasil",
      education: "Sistemas de Informação",
      institution: "UNIS",
      phone: "",
      bio: "Busco estágio",
    };
    expect(profileSchema.parse(values)).toEqual(values);
    expect(profileSchema.safeParse({ ...values, display_name: "" }).success).toBe(false);
  });
  it("formats any 14 CNPJ digits and rejects input beyond that limit", () => {
    expect(formatBrazilianCnpj("12345678901234")).toBe("12.345.678/9012-34");
    expect(formatBrazilianCnpj("123456789012345")).toBe("12.345.678/9012-34");
    expect(isValidBrazilianCnpj("12.345.678/9012-34")).toBe(true);
    expect(isValidBrazilianCnpj("12.345.678/9012-3")).toBe(false);
  });
});
