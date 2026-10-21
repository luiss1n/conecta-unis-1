import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { JobList } from "@/components/jobs/JobCard";
import { SearchBar } from "@/components/jobs/SearchBar";
import { emptyFilters, filterJobs, modeLabel, scheduleLabel, toggleIn, typeLabel } from "@/lib/jobs";
import { getCompanyName, getJobs } from "@/services/api";
import type { JobCategory, JobFilters, JobType, Schedule, WorkMode } from "@/types";

export const Route = createFileRoute("/vagas/")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Vagas de estágio e emprego — CONECTA UNIS" },
      { name: "description", content: "Pesquise e filtre vagas por categoria, modalidade, cidade e tipo de contratação." },
      { property: "og:title", content: "Vagas de estágio e emprego — CONECTA UNIS" },
      { property: "og:description", content: "Pesquise e filtre vagas por categoria, modalidade, cidade e tipo de contratação." },
    ],
  }),
  component: JobsPage,
});

function CheckGroup<T extends string>({ legend, options, selected, onToggle, label }: { legend: string; options: T[]; selected: T[]; onToggle: (v: T) => void; label?: (v: T) => string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="space-y-1">
        {options.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-sm hover:bg-muted">
            <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} className="h-4 w-4 accent-primary" />
            {label ? label(o) : o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function JobsPage() {
  const { q } = Route.useSearch();
  const all = getJobs();
  const [f, setF] = useState<JobFilters>({ ...emptyFilters, query: q ?? "" });
  const [showFilters, setShowFilters] = useState(false);
  const results = useMemo(() => filterJobs(all, f, getCompanyName), [all, f]);
  const categories = [...new Set(all.map((j) => j.category))].sort() as JobCategory[];
  const cities = [...new Set(all.map((j) => j.city))].sort();
  const activeCount = f.types.length + f.modes.length + f.schedules.length + f.categories.length + f.cities.length + (f.query ? 1 : 0);

  return (
    <>
      <PageHeader eyebrow="Oportunidades" title="Vagas" description="Pesquise oportunidades de estágio e emprego na região e combine filtros para encontrar a vaga ideal.">
        <SearchBar value={f.query} onChange={(query) => setF((p) => ({ ...p, query }))} />
      </PageHeader>
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside aria-label="Filtros" className={showFilters ? "block" : "hidden lg:block"}>
          <div className="space-y-6 rounded-xl border bg-card p-5 shadow-card lg:sticky lg:top-24">
            <CheckGroup<JobType> legend="Tipo de contratação" options={["estagio", "emprego"]} selected={f.types} label={(v) => typeLabel[v]} onToggle={(v) => setF((p) => ({ ...p, types: toggleIn(p.types, v) }))} />
            <CheckGroup<WorkMode> legend="Modalidade" options={["presencial", "hibrido", "remoto"]} selected={f.modes} label={(v) => modeLabel[v]} onToggle={(v) => setF((p) => ({ ...p, modes: toggleIn(p.modes, v) }))} />
            <CheckGroup<Schedule> legend="Jornada" options={["integral", "meio-periodo"]} selected={f.schedules} label={(v) => scheduleLabel[v]} onToggle={(v) => setF((p) => ({ ...p, schedules: toggleIn(p.schedules, v) }))} />
            <CheckGroup<JobCategory> legend="Categoria" options={categories} selected={f.categories} onToggle={(v) => setF((p) => ({ ...p, categories: toggleIn(p.categories, v) }))} />
            <CheckGroup<string> legend="Localização" options={cities} selected={f.cities} onToggle={(v) => setF((p) => ({ ...p, cities: toggleIn(p.cities, v) }))} />
            <Button variant="outline" className="w-full" disabled={activeCount === 0} onClick={() => setF(emptyFilters)}>Limpar filtros</Button>
          </div>
        </aside>
        <section aria-labelledby="results-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-title" className="text-lg font-bold" aria-live="polite">
              {results.length} {results.length === 1 ? "resultado" : "resultados"}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
                <SlidersHorizontal className="h-4 w-4" /> Filtros{activeCount > 0 && ` (${activeCount})`}
              </Button>
              <label className="flex items-center gap-2 text-sm">
                <span className="sr-only sm:not-sr-only text-muted-foreground">Ordenar por</span>
                <select value={f.sort} onChange={(e) => setF((p) => ({ ...p, sort: e.target.value as JobFilters["sort"] }))} className="h-9 rounded-md border bg-surface px-2 text-sm">
                  <option value="recentes">Mais recentes</option>
                  <option value="antigas">Mais antigas</option>
                </select>
              </label>
            </div>
          </div>
          {results.length === 0 ? (
            <EmptyState title="Nenhuma vaga corresponde à sua busca" description="Ajuste os termos ou limpe os filtros para ver todas as oportunidades." action={<Button onClick={() => setF(emptyFilters)}>Limpar filtros</Button>} />
          ) : (
            <JobList jobs={results} />
          )}
        </section>
      </div>
    </>
  );
}
