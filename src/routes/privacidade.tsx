import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — CONECTA UNIS" },
      { name: "description", content: "Como o CONECTA UNIS trata os dados dos candidatos, em conformidade com a LGPD." },
      { property: "og:title", content: "Política de privacidade — CONECTA UNIS" },
      { property: "og:description", content: "Como o CONECTA UNIS trata os dados dos candidatos, em conformidade com a LGPD." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <>
      <PageHeader eyebrow="Institucional" title="Política de privacidade" description="Texto provisório da versão demonstrativa. A versão oficial será definida pela instituição." />
      <div className="container-page max-w-3xl space-y-6 py-10 text-muted-foreground">
        <section><h2 className="text-lg font-bold text-foreground">Dados tratados</h2><p className="mt-2">Para candidaturas, serão tratados apenas os dados necessários: nome, curso, período, contato e currículo.</p></section>
        <section><h2 className="text-lg font-bold text-foreground">Compartilhamento</h2><p className="mt-2">Os dados são compartilhados somente com a empresa responsável pela vaga à qual o estudante se candidatar, mediante ciência expressa.</p></section>
        <section><h2 className="text-lg font-bold text-foreground">Direitos do titular</h2><p className="mt-2">Nos termos da LGPD, o titular pode solicitar acesso, correção ou exclusão dos seus dados.</p></section>
        <section><h2 className="text-lg font-bold text-foreground">Versão demonstrativa</h2><p className="mt-2">Nesta versão nenhum dado pessoal é coletado, armazenado ou enviado.</p></section>
      </div>
    </>
  );
}
