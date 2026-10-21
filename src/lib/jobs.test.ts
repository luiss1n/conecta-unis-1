import { describe, expect, it } from "vitest";
import { jobs } from "@/data/jobs";
import { emptyFilters, filterJobs } from "./jobs";

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
