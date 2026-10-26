import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/common/PageHeader";

const description = "Como o CONECTA UNIS trata os dados pessoais de estudantes, empresas e professores.";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — CONECTA UNIS" },
      { name: "description", content: description },
      { property: "og:title", content: "Política de privacidade — CONECTA UNIS" },
      { property: "og:description", content: description },
    ],
  }),
  component: Privacy,
});

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

function Privacy() {
  return (
    <>
      <PageHeader
        eyebrow="Institucional"
        title="Política de privacidade"
        description="Texto provisório, em validação pela instituição. Última revisão: 25 de outubro de 2026."
      />
      <div className="container-page max-w-3xl space-y-8 py-10 text-muted-foreground">
        <Block title="Quem trata os dados">
          <p>
            O CONECTA UNIS é uma plataforma de empregabilidade e desenvolvimento profissional para estudantes, egressos, empresas
            e professores da região de São Lourenço (MG). A identificação oficial do controlador dos dados e do encarregado
            (DPO) será informada pela instituição antes da operação oficial.
          </p>
        </Block>
        <Block title="Dados que coletamos">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong className="text-foreground">Conta:</strong> e-mail e senha (a senha é guardada de forma protegida pelo serviço de autenticação).</li>
            <li><strong className="text-foreground">Perfil:</strong> nome, nome de usuário, telefone, endereço, cidade, formação, instituição, apresentação e, se você quiser, foto, banner e currículo em PDF.</li>
            <li><strong className="text-foreground">Empresas:</strong> nome, CNPJ, setor, cidade, descrição e dados de contato informados no cadastro.</li>
            <li><strong className="text-foreground">Professores:</strong> instituição, departamento e dados acadêmicos informados no cadastro.</li>
            <li><strong className="text-foreground">Conteúdo publicado:</strong> vagas (inclusive a imagem enviada) e eventos.</li>
            <li><strong className="text-foreground">Uso:</strong> eventos em que você marcou interesse.</li>
          </ul>
        </Block>
        <Block title="Para que usamos">
          <p>Para criar e manter sua conta, montar seu perfil, permitir a publicação de vagas e eventos e exibir essas informações na plataforma.</p>
        </Block>
        <Block title="O que é público e o que é privado">
          <p>
            Vagas, eventos e as informações públicas das empresas (nome, setor, cidade e descrição) podem ser vistos por qualquer
            visitante. Seu perfil pessoal, telefone, endereço, currículo e o CNPJ ficam acessíveis apenas à própria conta;
            arquivos privados são abertos por links temporários. A equipe técnica responsável pela plataforma pode acessar os
            dados quando necessário para suporte e manutenção.
          </p>
          <p>
            As imagens enviadas nas vagas ficam em armazenamento público. Não envie imagens com dados pessoais ou informações
            que você não queira divulgar.
          </p>
        </Block>
        <Block title="Candidaturas">
          <p>
            O envio de candidaturas pela plataforma ainda não está disponível. Quando for liberado, seus dados só serão
            compartilhados com a empresa responsável pela vaga depois de uma ação sua, com aviso claro do que será enviado.
          </p>
        </Block>
        <Block title="Onde os dados ficam">
          <p>
            Usamos serviços de terceiros para autenticação, banco de dados, arquivos e hospedagem (Supabase e Railway). Os dados
            podem ser processados em servidores fora do Brasil.
          </p>
        </Block>
        <Block title="Por quanto tempo">
          <p>Enquanto a conta existir. Os prazos finais de retenção serão definidos pela instituição.</p>
        </Block>
        <Block title="Seus direitos">
          <p>
            Nos termos da LGPD, você pode solicitar confirmação do tratamento, acesso, correção, portabilidade, eliminação dos
            dados e informações sobre compartilhamento, além de revogar consentimentos. Você já pode editar seus dados e trocar
            ou remover seus arquivos pelo seu perfil. A exclusão completa da conta ainda não está disponível no site e deverá ser
            solicitada pelo canal oficial que será divulgado pela instituição.
          </p>
        </Block>
        <Block title="Segurança">
          <p>
            O acesso aos dados é restrito por regras no banco de dados e por perfis de usuário. Nenhuma medida é infalível:
            use uma senha forte e exclusiva e avise-nos se perceber qualquer uso indevido.
          </p>
        </Block>
      </div>
    </>
  );
}
