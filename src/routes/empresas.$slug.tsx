import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, MapPin } from "lucide-react";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { EmptyState } from "@/components/common/EmptyState";
import { JobList } from "@/components/jobs/JobCard";
import { getCompany, getJobsByCompany } from "@/services/api";

export const Route = createFileRoute("/empresas/$slug")({
  loader: async ({ params }) => {
    const company = await getCompany(params.slug);
    if (!company) throw notFound();
    return { company, jobs: await getJobsByCompany(company.slug) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Empresa não encontrada — CONECTA UNIS" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.company.name} — CONECTA UNIS`;
    return { meta: [{ title: t }, { name: "description", content: loaderData.company.summary }, { property: "og:title", content: t }, { property: "og:description", content: loaderData.company.summary }] };
  },
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="text-2xl font-bold">Empresa não encontrada</h1>
      <Link to="/empresas" className="mt-6 inline-block font-semibold text-primary hover:underline">Ver empresas</Link>
    </div>
  ),
  component: CompanyPage,
});

function CompanyPage() {
  const { company, jobs } = Route.useLoaderData();
  return (
    <div className="container-page py-8">
      <nav aria-label="Trilha" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/empresas" className="hover:text-primary">Empresas</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground" aria-current="page">{company.name}</span>
      </nav>
      <header className="mt-6 rounded-xl border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <CompanyAvatar company={company} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold sm:text-3xl">{company.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-muted-foreground">
              {company.sector} <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{company.city}</span>
            </p>
          </div>
        </div>
        <p className="mt-6 max-w-3xl leading-relaxed text-muted-foreground">{company.about}</p>
      </header>
      <section className="mt-10" aria-labelledby="company-jobs">
        <h2 id="company-jobs" className="mb-5 text-xl font-bold">Vagas desta empresa ({jobs.length})</h2>
        {jobs.length ? <JobList jobs={jobs} columns={3} /> : <EmptyState title="Sem vagas abertas" description="Esta empresa não possui oportunidades no momento." />}
      </section>
    </div>
  );
}
