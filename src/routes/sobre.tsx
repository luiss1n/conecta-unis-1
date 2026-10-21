import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, GraduationCap, Handshake, LayoutGrid, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre o CONECTA UNIS — Carreiras e Empregabilidade" },
      { name: "description", content: "Conheça o propósito do CONECTA UNIS, plataforma de carreiras da Faculdade Unis São Lourenço." },
      { property: "og:title", content: "Sobre o CONECTA UNIS" },
      { property: "og:description", content: "Conheça o propósito do CONECTA UNIS, plataforma de carreiras da Faculdade Unis São Lourenço." },
    ],
  }),
  component: About,
});

const pillars = [
  { icon: Users, title: "Conexão", text: "Aproxima estudantes, egressos e empresas em um único ambiente." },
  { icon: LayoutGrid, title: "Acesso centralizado", text: "Reúne vagas, eventos e cursos que antes ficavam dispersos." },
  { icon: GraduationCap, title: "Desenvolvimento profissional", text: "Incentiva a preparação contínua com workshops, oficinas e palestras." },
  { icon: Handshake, title: "Universidade e mercado", text: "Fortalece o diálogo entre a instituição e o mercado de trabalho regional." },
  { icon: Compass, title: "Núcleo de Carreira", text: "Apoia as ações do Núcleo de Carreira e Empregabilidade da Unis." },
];

function About() {
  return (
    <>
      <PageHeader eyebrow="Sobre nós" title="Um ponto de encontro entre formação e carreira" description="O CONECTA UNIS é a plataforma da Faculdade Unis São Lourenço dedicada a facilitar o acesso de estudantes e egressos a oportunidades profissionais na região." />
      <div className="container-page py-12">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border bg-card p-6 shadow-card">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="h-5 w-5" /></span>
              <h2 className="mt-4 text-lg font-bold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl bg-brand-gradient p-8 text-primary-foreground sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Pronto para dar o próximo passo?</h2>
            <p className="mt-1 opacity-90">Explore as oportunidades disponíveis na região.</p>
          </div>
          <Button asChild size="lg" variant="secondary"><Link to="/vagas">Ver vagas</Link></Button>
        </div>
      </div>
    </>
  );
}
