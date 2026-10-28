import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, FileText, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { useSession } from "@/hooks/use-session";
import { getMyRole } from "@/services/api";

export const Route = createFileRoute("/area-empresa")({
  head: () => ({
    meta: [
      { title: "Publicar oportunidades — CONECTA UNIS" },
      { name: "description", content: "Publique vagas e acompanhe as candidaturas da comunidade Unis." },
      { property: "og:title", content: "Publicar oportunidades — CONECTA UNIS" },
      { property: "og:description", content: "Publique vagas e acompanhe as candidaturas da comunidade Unis." },
    ],
  }),
  component: CompanyArea,
});

const steps = [
  { icon: Building2, title: "Acesse sua conta", text: "Empresas e professores publicam oportunidades pelo perfil verificado." },
  { icon: FileText, title: "Publique a vaga", text: "Informe atividades, requisitos, jornada e local de trabalho." },
  { icon: MessageCircle, title: "Acompanhe candidaturas", text: "Veja os dados compartilhados com consentimento e converse com cada candidato." },
];

function CompanyArea() {
  const { session, ready } = useSession();
  const role = useQuery({ queryKey: ["my-role"], queryFn: getMyRole, enabled: ready && !!session });
  const destination = !session ? "/auth" : role.data === "admin" ? "/admin" : role.data === null ? "/cadastro" : role.data === "visitor" ? "/candidaturas" : "/publicar";
  const action = !session ? "Entrar para publicar" : role.data === "admin" ? "Abrir painel do diretor" : role.data === null ? "Completar cadastro" : role.data === "visitor" ? "Ver minhas candidaturas" : "Abrir área de publicação";

  return (
    <>
      <PageHeader eyebrow="Para empresas e professores" title="Publique oportunidades para talentos da Unis" description="Anuncie vagas, receba candidaturas e converse com os candidatos em uma área privada." />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_420px]">
        <ol className="space-y-4">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="flex gap-4 rounded-xl border bg-card p-5 shadow-card">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-purple-soft text-brand-purple"><Icon className="h-5 w-5" /></span>
              <div><p className="text-xs font-semibold text-muted-foreground">Etapa {index + 1}</p><h2 className="font-bold">{title}</h2><p className="text-sm text-muted-foreground">{text}</p></div>
            </li>
          ))}
        </ol>
        <section className="rounded-xl border bg-card p-6 shadow-card" aria-labelledby="publish-title">
          <h2 id="publish-title" className="text-lg font-bold">Acesso à publicação</h2>
          <p className="mt-2 text-sm text-muted-foreground">Empresas e professores podem publicar vagas. Professores também podem anunciar eventos; diretores gerenciam as publicações pelo painel.</p>
          {ready && session && role.isLoading ? <Button size="lg" className="mt-6 w-full" disabled>Carregando…</Button> : <Button asChild size="lg" className="mt-6 w-full"><Link to={destination}>{action}<ArrowRight className="h-4 w-4" /></Link></Button>}
          {session && role.data === "company" && <Button asChild variant="outline" className="mt-3 w-full"><Link to="/candidaturas"><Users className="h-4 w-4" /> Ver candidaturas recebidas</Link></Button>}
          {session && role.data === "professor" && <Button asChild variant="outline" className="mt-3 w-full"><Link to="/candidaturas"><Users className="h-4 w-4" /> Ver candidaturas e conversas</Link></Button>}
        </section>
      </div>
    </>
  );
}
