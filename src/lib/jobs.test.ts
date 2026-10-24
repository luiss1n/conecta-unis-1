import { describe, expect, it } from "vitest";
import { jobs } from "@/test/fixtures/jobs";
import { DEFAULT_PUBLISHER, emptyFilters, filterJobs, formatDate, formatEventDate, jobPublisher } from "./jobs";

describe("filterJobs", () => {
  it("combines type and remote filters together", () => {
    const r = filterJobs(jobs, { ...emptyFilters, types: ["estagio"], modes: ["remoto"] });
    expect(r.map((j) => j.slug)).toEqual(["estagio-suporte-ti-remoto"]);
  });
  it("searches by city ignoring accents", () => {
    const r = filterJobs(jobs, { ...emptyFilters, query: "caxambu" });
    expect(r.every((j) => j.city === "Caxambu")).toBe(true);
    expect(r.length).toBe(3);
  });
  it("sorts most recent first", () => {
    const r = filterJobs(jobs, emptyFilters);
    expect(r[0]?.slug).toBe("estagio-desenvolvimento-front-end");
  });
});

describe("jobPublisher", () => {
  it("prefere a empresa, depois o nome livre do admin, depois o padrão", () => {
    const company = { slug: "x", name: "Águas Tech", sector: "", city: "", summary: "", about: "", initials: "AT", tone: "blue" as const };
    expect(jobPublisher({ company, publisherName: "Outro" })).toBe("Águas Tech");
    expect(jobPublisher({ company: undefined, publisherName: "Prefeitura" })).toBe("Prefeitura");
    expect(jobPublisher({ company: undefined, publisherName: null })).toBe(DEFAULT_PUBLISHER);
  });
  it("a busca encontra vagas pelo nome de quem publicou", () => {
    const base = jobs[0]!;
    const job = { ...base, companySlug: null, company: undefined, publisherName: "Prefeitura de São Lourenço" };
    expect(filterJobs([job], { ...emptyFilters, query: "prefeitura" })).toHaveLength(1);
  });
});

describe("formatação de datas (fuso de Brasília)", () => {
  it("mostra o horário local de um timestamptz do banco", () => {
    // 17:00 UTC = 14:00 em Brasília (UTC-3)
    const d = formatEventDate("2026-11-05T17:00:00+00:00");
    expect(d.time).toBe("14:00");
    expect(d.day).toBe("05");
    expect(d.month).toBe("nov");
  });
  it("não vira o dia para vagas publicadas à noite", () => {
    // 01:30 UTC de 06/11 ainda é 05/11 em Brasília
    expect(formatDate("2026-11-06T01:30:00+00:00")).toContain("05");
  });
});
