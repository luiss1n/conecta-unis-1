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
      <PageHeader eyebrow="Institucional" title="Política de privacidade" description="Resumo provisório dos dados usados nas candidaturas, conversas e inscrições em eventos." />
      <div className="container-page max-w-3xl space-y-6 py-10 text-muted-foreground">
        <section><h2 className="text-lg font-bold text-foreground">Dados usados</h2><p className="mt-2">O perfil pode conter nome, e-mail, telefone, resumo profissional, formação, instituição, cidade e currículo. Ao enviar uma candidatura, uma cópia dos dados informados no consentimento e uma mensagem de apresentação opcional ficam associadas à vaga. As mensagens trocadas na conversa e o andamento da candidatura também são armazenados.</p></section>
        <section><h2 className="text-lg font-bold text-foreground">Compartilhamento</h2><p className="mt-2">Ao marcar o consentimento e enviar uma candidatura, o estudante autoriza o compartilhamento dos dados exibidos no formulário com a conta responsável por aquela vaga. A conversa fica acessível somente ao candidato e à conta responsável pela vaga.</p></section>
        <section><h2 className="text-lg font-bold text-foreground">Inscrições em eventos</h2><p className="mt-2">A inscrição é registrada na conta do aluno ou professor para que possa ser consultada na área de candidaturas.</p></section>
        <section><h2 className="text-lg font-bold text-foreground">Revisão institucional</h2><p className="mt-2">Este texto é um resumo provisório da funcionalidade. Antes de divulgar o fluxo, a instituição deve validar a política completa, definir prazos de retenção e indicar o canal apropriado para solicitações sobre dados pessoais.</p></section>
      </div>
    </>
  );
}
