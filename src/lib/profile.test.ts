import { describe, expect, it } from "vitest";
import { profileKinds, profileSchema, validateProfileFile } from "./profile";

describe("Complete profiles", () => {
  it("supports company, visitor and professor accounts", () => {
    expect(profileKinds).toEqual(["company", "visitor", "professor"]);
  });
  it("validates and preserves requested profile details", () => {
    const values = { display_name: "Luis Torres", headline: "Estudante", address: "Rua das Flores, 10", city: "São Lourenço", state: "MG", country: "Brasil", education: "Sistemas de Informação", institution: "UNIS", phone: "", bio: "Busco estágio" };
    expect(profileSchema.parse(values)).toEqual(values);
    expect(profileSchema.safeParse({ ...values, display_name: "" }).success).toBe(false);
  });
  it("accepts PDF résumés but rejects other document types", () => {
    expect(() => validateProfileFile({ type: "application/pdf", size: 100 }, "resume")).not.toThrow();
    expect(() => validateProfileFile({ type: "text/html", size: 100 }, "resume")).toThrow();
  });
  it("rejects images larger than the private storage limit", () => {
    expect(() => validateProfileFile({ type: "image/png", size: 2 * 1024 * 1024 }, "avatar")).not.toThrow();
    expect(() => validateProfileFile({ type: "image/png", size: 2 * 1024 * 1024 + 1 }, "banner")).toThrow();
  });
});