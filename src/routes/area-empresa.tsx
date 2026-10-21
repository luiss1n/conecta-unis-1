import { createFileRoute } from "@tanstack/react-router";
import { Building2, CheckCircle2, FileText, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/area-empresa")({
  head: () => ({
    meta: [
      { title: "Área para empresas — CONECTA UNIS" },
      { name: "description", content: "Divulgue vagas de estágio e emprego para estudantes e egressos da Unis." },
      { property: "og:title", content: "Área para empresas — CONECTA UNIS" },
      { property: "og:description", content: "Divulgue vagas de estágio e emprego para estudantes e egressos da Unis." },
    ],
  }),
  component: CompanyArea,
});

const steps = [
  { icon: Building2, title: "Cadastre sua empresa", text: "Informe dados institucionais e de contato." },
  { icon: FileText, title: "Publique a vaga", text: "Descreva atividades, requisitos e benefícios." },
  { icon: Users, title: "Receba candidaturas", text: "Candidatos autorizam o compartilhamento dos seus dados." },
];

function CompanyArea() {
  const [sent, setSent] = useState(false);
  const [title, setTitle] = useState("");
  const [touched, setTouched] = useState(false);
  const invalid = touched && title.trim().length < 3;
  return (
    <>
      <PageHeader eyebrow="Para empresas" title="Publique vagas para talentos da Unis" description="O acesso empresarial com login será disponibilizado em breve. Abaixo, uma prévia do fluxo de publicação." />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_420px]">
        <ol className="space-y-4">
          {steps.map(({ icon: Icon, title: t, text }, i) => (
            <li key={t} className="flex gap-4 rounded-xl border bg-card p-5 shadow-card">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-purple-soft text-brand-purple"><Icon className="h-5 w-5" /></span>
              <div><p className="text-xs font-semibold text-muted-foreground">Etapa {i + 1}</p><h2 className="font-bold">{t}</h2><p className="text-sm text-muted-foreground">{text}</p></div>
            </li>
          ))}
        </ol>
        <section className="rounded-xl border bg-card p-6 shadow-card" aria-labelledby="pub-title">
          <h2 id="pub-title" className="text-lg font-bold">Prévia: nova vaga</h2>
          {/* INTEGRAÇÃO FUTURA: POST /api/vagas com autenticação da empresa. */}
          {sent ? (
            <div className="mt-4 rounded-lg bg-success-soft p-4 text-sm" aria-live="polite">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="mt-2 font-semibold">Prévia concluída</p>
              <p className="text-muted-foreground">Nenhuma vaga foi publicada — esta é apenas uma demonstração.</p>
              <Button variant="outline" className="mt-3" onClick={() => { setSent(false); setTitle(""); setTouched(false); }}>Nova prévia</Button>
            </div>
          ) : (
            <form className="mt-4 space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); setTouched(true); if (title.trim().length >= 3) { setSent(true); toast.success("Prévia gerada (demonstração)"); } }}>
              <div>
                <label htmlFor="vaga-titulo" className="text-sm font-medium">Título da vaga</label>
                <input id="vaga-titulo" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={invalid} aria-describedby={invalid ? "vaga-erro" : undefined} className="mt-1 h-11 w-full rounded-md border bg-surface px-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 aria-invalid:border-destructive" placeholder="Ex.: Estagiário de Marketing" />
                {invalid && <p id="vaga-erro" className="mt-1 text-sm text-destructive">Informe um título com pelo menos 3 caracteres.</p>}
              </div>
              <div>
                <label htmlFor="vaga-tipo" className="text-sm font-medium">Tipo</label>
                <select id="vaga-tipo" className="mt-1 h-11 w-full rounded-md border bg-surface px-3"><option>Estágio</option><option>Emprego</option></select>
              </div>
              <Button type="submit" className="w-full" size="lg">Gerar prévia</Button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
