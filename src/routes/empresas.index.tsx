import { createFileRoute } from "@tanstack/react-router";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { DemoBadge } from "@/components/common/DemoBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { getCompanies } from "@/services/api";

export const Route = createFileRoute("/empresas/")({
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
  const list = getCompanies();
  return (
    <>
      <PageHeader eyebrow="Empresas" title="Empresas parceiras" description="Organizações da região que divulgam vagas e se aproximam dos estudantes e egressos da Unis.">
        <DemoBadge>Empresas fictícias para demonstração</DemoBadge>
      </PageHeader>
      <div className="container-page py-10">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => <li key={c.slug}><CompanyCard company={c} /></li>)}
        </ul>
      </div>
    </>
  );
}
