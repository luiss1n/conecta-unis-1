import { createFileRoute } from "@tanstack/react-router";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { getCompanies, getJobs } from "@/services/api";

export const Route = createFileRoute("/empresas/")({
  loader: async () => {
    const [companies, jobs] = await Promise.all([getCompanies(), getJobs()]);
    const counts = new Map<string, number>();
    for (const j of jobs) if (j.companySlug) counts.set(j.companySlug, (counts.get(j.companySlug) ?? 0) + 1);
    return { companies, counts };
  },
  head: () => ({
    meta: [
      { title: "Empresas parceiras — CONECTA UNIS" },
      { name: "description", content: "Conheça empresas da região que divulgam oportunidades para estudantes da Unis." },
      { property: "og:title", content: "Empresas parceiras — CONECTA UNIS" },
      { property: "og:description", content: "Conheça empresas da região que divulgam oportunidades para estudantes da Unis." },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { companies: list, counts } = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Empresas" title="Empresas parceiras" description="Organizações da região que divulgam vagas e se aproximam dos estudantes e egressos da Unis." />
      <div className="container-page py-10">
        {list.length === 0 ? (
          <EmptyState title="Nenhuma empresa cadastrada ainda" description="As empresas parceiras aparecerão aqui assim que concluírem o cadastro." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => <li key={c.slug}><CompanyCard company={c} count={counts.get(c.slug) ?? 0} /></li>)}
          </ul>
        )}
      </div>
    </>
  );
}
