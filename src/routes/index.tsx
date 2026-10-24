import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { StatsCards } from "@/components/common/StatsCards";
import { EventCardCompact } from "@/components/events/EventCard";
import { FilterChips } from "@/components/jobs/FilterChips";
import { JobList } from "@/components/jobs/JobCard";
import heroPhoto from "@/assets/hero-photo.jpg.asset.json";
import { SearchBar } from "@/components/jobs/SearchBar";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { emptyFilters, filterJobs, toggleIn } from "@/lib/jobs";
import { getEvents, getJobs } from "@/services/api";
import type { JobFilters } from "@/types";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [jobs, events] = await Promise.all([getJobs(), getEvents({ upcomingOnly: true })]);
    return { jobs, events };
  },
  head: () => ({
    meta: [
      { title: "CONECTA UNIS — Encontre sua oportunidade na região" },
      { name: "description", content: "Vagas de estágio e emprego para estudantes da Unis em São Lourenço, Caxambu e região." },
      { property: "og:title", content: "CONECTA UNIS — Encontre sua oportunidade na região" },
      { property: "og:description", content: "Vagas de estágio e emprego para estudantes da Unis em São Lourenço, Caxambu e região." },
    ],
  }),
  component: Home,
});

const PAGE = 6;

/** atraso da animação de entrada do herói */
const heroDelay = (ms: number) => ({ "--hero-delay": `${ms}ms` }) as CSSProperties;

function Home() {
  const [f, setF] = useState<JobFilters>(emptyFilters);
  const [limit, setLimit] = useState(PAGE);
  const { jobs: all, events } = Route.useLoaderData();
  const results = useMemo(() => filterJobs(all, f), [all, f]);
  const shown = results.slice(0, limit);

  const chips = [
    { id: "estagio", label: "Estágio", active: f.types.includes("estagio") },
    { id: "emprego", label: "Emprego", active: f.types.includes("emprego") },
    { id: "meio", label: "Meio período", active: f.schedules.includes("meio-periodo") },
    { id: "remoto", label: "Remoto", active: f.modes.includes("remoto") },
  ];
  const toggle = (id: string) => {
    setLimit(PAGE);
    setF((p) =>
      id === "estagio" || id === "emprego"
        ? { ...p, types: toggleIn(p.types, id) }
        : id === "meio"
          ? { ...p, schedules: toggleIn(p.schedules, "meio-periodo") }
          : { ...p, modes: toggleIn(p.modes, "remoto") },
    );
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-hero-border bg-hero text-hero-foreground">
        <img
          src={heroPhoto.url}
          alt=""
          aria-hidden="true"
          className="hero-in pointer-events-none absolute inset-y-0 right-0 h-full w-full object-cover object-top opacity-50 sm:w-[58%] sm:opacity-100 sm:[mask-image:linear-gradient(to_right,transparent,black_50%)]"
          style={heroDelay(200)}
        />
        <div className="container-page relative py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="hero-in text-sm font-semibold uppercase tracking-wider text-hero-accent" style={heroDelay(0)}>
              Núcleo de Carreira e Empregabilidade
            </p>
            <h1 className="hero-in mt-3 text-4xl font-extrabold leading-tight text-hero-foreground sm:text-5xl" style={heroDelay(120)}>
              Encontre sua oportunidade <span className="text-brand-gradient">na região</span>
            </h1>
            <p className="hero-in mt-4 text-lg text-hero-muted" style={heroDelay(240)}>
              Conectando estudantes da Unis a vagas de estágio e emprego em São Lourenço, Caxambu e região.
            </p>
            <div className="hero-in mt-8 space-y-4" style={heroDelay(360)}>
              <SearchBar value={f.query} onChange={(q) => { setLimit(PAGE); setF((p) => ({ ...p, query: q })); }} />
              <FilterChips chips={chips} onToggle={toggle} />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="vagas-title">
          <FadeUp className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="vagas-title" className="text-2xl font-bold">Vagas Disponíveis</h2>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {results.length} {results.length === 1 ? "vaga encontrada" : "vagas encontradas"} de {all.length} cadastradas
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Ordenar:</span>
              <select
                value={f.sort}
                onChange={(e) => setF((p) => ({ ...p, sort: e.target.value as JobFilters["sort"] }))}
                className="h-9 rounded-md border bg-surface px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
              >
                <option value="recentes">Mais recentes</option>
                <option value="antigas">Mais antigas</option>
              </select>
            </label>
          </FadeUp>
          {results.length === 0 ? (
            <EmptyState
              title="Nenhuma vaga encontrada"
              description="Tente outros termos de busca ou remova alguns filtros."
              action={<Button variant="outline" className="btn-press" onClick={() => setF(emptyFilters)}>Limpar filtros</Button>}
            />
          ) : (
            <>
              <JobList jobs={shown} />
              <FadeUp className="mt-6 flex justify-center">
                {limit < results.length ? (
                  <Button variant="outline" size="lg" className="btn-press" onClick={() => setLimit((l) => l + PAGE)}>Ver mais vagas</Button>
                ) : (
                  <Button asChild variant="outline" size="lg" className="btn-press">
                    <Link to="/vagas">Ver mais vagas <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                )}
              </FadeUp>
            </>
          )}
        </section>

        <aside aria-labelledby="eventos-title">
          <FadeUp className="mb-5 flex items-center justify-between">
            <h2 id="eventos-title" className="text-xl font-bold">Próximos eventos</h2>
            <Link to="/eventos" className="text-sm font-semibold text-primary hover:underline">Ver todos</Link>
          </FadeUp>
          {events.length === 0 ? (
            <EmptyState title="Nenhum evento agendado" description="Quando novos eventos forem publicados, eles aparecerão aqui." />
          ) : (
            <Stagger className="space-y-3">
              {events.slice(0, 4).map((e) => (
                <StaggerItem key={e.id}>
                  <EventCardCompact event={e} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </aside>
      </div>

      <div className="container-page">
        <FadeUp>
          <StatsCards />
        </FadeUp>
      </div>
    </>
  );
}
