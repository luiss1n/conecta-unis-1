import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — CONECTA UNIS" },
      { name: "description", content: "Saiba quais dados a CONECTA UNIS coleta, por que os utiliza e como exercer seus direitos." },
      { property: "og:title", content: "Política de privacidade — CONECTA UNIS" },
      { property: "og:description", content: "Saiba quais dados a CONECTA UNIS coleta, por que os utiliza e como exercer seus direitos." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <>
      <PageHeader eyebrow="Institucional" title="Política de privacidade" description="Esta política explica como a CONECTA UNIS trata dados pessoais nas funções de carreira, candidaturas, eventos e comunicação da plataforma." />
      <article className="container-page max-w-3xl space-y-8 py-10 text-muted-foreground">
        <p className="text-sm">Última atualização: 13 de novembro de 2026</p>
        <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">1. Quem é responsável pelo tratamento</h2>
          <p>A Faculdade Unis São Lourenço mantém a plataforma CONECTA UNIS para apoiar ações de carreira e empregabilidade da comunidade acadêmica. A instituição responsável pelas decisões sobre o tratamento dos dados (controladora), seu CNPJ e endereço institucional devem ser informados aqui antes da publicação definitiva desta política.</p>
          <p><strong className="text-foreground">Canal de privacidade:</strong> carreiras@unis.edu.br. A instituição deve confirmar se este canal recebe solicitações de titulares e publicar os dados de contato do encarregado ou do canal formal designado.</p>
        </section>
        <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">2. Dados tratados e como são obtidos</h2>
          <p>Os dados são fornecidos pela própria pessoa ao criar uma conta, completar ou atualizar o cadastro, utilizar recursos da plataforma e enviar arquivos. A plataforma também registra dados gerados durante o uso.</p>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong className="text-foreground">Conta e autenticação:</strong> endereço de e-mail, identificador da conta e dados técnicos necessários para autenticar, manter e proteger a sessão. A autenticação pode incluir provedores externos quando escolhidos pela pessoa usuária.</li>
            <li><strong className="text-foreground">Perfil de aluno:</strong> nome, nome de usuário, telefone, cidade e demais informações profissionais que a pessoa decidir informar, incluindo título, apresentação, formação ou curso, instituição de ensino, estado, país e endereço.</li>
            <li><strong className="text-foreground">Currículo e imagens:</strong> arquivo PDF de currículo, nome do arquivo, foto de perfil e imagem de capa quando enviados. O currículo pode conter dados pessoais adicionais inseridos pela própria pessoa.</li>
            <li><strong className="text-foreground">Perfil de empresa:</strong> nome público, setor, cidade, resumo, apresentação e, em área restrita, razão social, CNPJ e site.</li>
            <li><strong className="text-foreground">Perfil de professor:</strong> instituição, curso ou departamento, disciplinas e titulação.</li>
            <li><strong className="text-foreground">Candidaturas e conversas:</strong> dados de perfil selecionados para a candidatura, currículo associado, mensagem de apresentação, vaga escolhida, status e mensagens trocadas com o anunciante.</li>
            <li><strong className="text-foreground">Preferências e atividade na plataforma:</strong> áreas e cidades escolhidas para alertas, preferências de notificações, vagas salvas, inscrições em eventos e registros necessários à operação, segurança e métricas agregadas de visualização de vagas.</li>
          </ul>
          <p>Não solicitamos dados pessoais sensíveis como condição geral para usar a plataforma. Evite incluí-los no perfil, currículo, mensagens ou candidatura, salvo quando forem estritamente necessários e houver orientação específica.</p>
        </section>
        <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">3. Finalidades do tratamento</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Criar e administrar contas, autenticar usuários e aplicar as permissões correspondentes a cada perfil.</li>
            <li>Exibir e manter o perfil profissional, formação e currículo, conforme os controles e a finalidade de cada recurso.</li>
            <li>Permitir candidaturas, encaminhar as informações pertinentes ao anunciante responsável e manter o histórico, status e conversa vinculados à candidatura.</li>
            <li>Registrar inscrições e permitir que a pessoa consulte ou cancele sua participação em eventos.</li>
            <li>Executar alertas de vagas conforme áreas e cidades escolhidas e enviar notificações configuradas pela pessoa.</li>
            <li>Operar, manter, proteger e corrigir a plataforma, prevenir uso indevido e produzir métricas de funcionamento e visualização.</li>
            <li>Atender solicitações, cumprir obrigações legais e proteger direitos da instituição, dos usuários e de terceiros.</li>
          </ul>
          <p>O uso de dados deve estar vinculado a uma finalidade e a uma hipótese legal aplicável nos termos da LGPD. Quando um recurso depender de consentimento, a escolha será solicitada de forma específica e poderá ser revogada, sem afetar tratamentos realizados anteriormente de forma válida.</p>
        </section>
        <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">4. Visibilidade e compartilhamento</h2>
          <p>Dados do perfil e arquivos não são todos públicos por padrão. O perfil apresenta informações profissionais conforme a configuração e a tela utilizada; dados de contato indicados como privados são apresentados à própria pessoa. A candidatura é uma ação iniciada pelo usuário: os dados e arquivos apresentados no fluxo são encaminhados à conta responsável pela vaga para análise e comunicação sobre aquela oportunidade.</p>
          <p>As mensagens da candidatura ficam vinculadas à conversa entre candidato e anunciante responsável. Inscrições em eventos ficam vinculadas à conta da pessoa. Anunciantes recebem os dados necessários às candidaturas de suas próprias vagas, não acesso geral aos perfis ou às candidaturas de outros anunciantes.</p>
          <p>Podemos compartilhar dados com fornecedores que apoiam autenticação, hospedagem, armazenamento, banco de dados, envio de notificações e operação técnica, limitados ao serviço contratado e sujeitos a instruções de tratamento e medidas de segurança. A instituição deve identificar e validar os fornecedores, suas localidades e eventuais transferências internacionais antes da publicação final. Dados também poderão ser compartilhados quando exigido por lei ou por ordem de autoridade competente.</p>
          <p>Não vendemos dados pessoais. A plataforma não deve ser usada para decisões automatizadas com efeitos legais ou similares sobre candidatos; recomendações de vagas, quando disponibilizadas, servem para facilitar a busca e não garantem seleção ou contratação.</p>
        </section>
        <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">5. Armazenamento, segurança e retenção</h2>
          <p>Os dados são mantidos em sistemas de autenticação, banco de dados e armazenamento de arquivos utilizados pela plataforma. Currículos e imagens são armazenados em área de arquivos; o acesso ao currículo em uma candidatura é concedido ao anunciante responsável por aquela candidatura, conforme as permissões do sistema.</p>
          <p>São adotados controles técnicos e administrativos para reduzir riscos de acesso não autorizado, perda, alteração ou divulgação indevida. Nenhum serviço conectado à internet pode garantir segurança absoluta. Em caso de incidente que possa acarretar risco ou dano relevante, serão adotadas as providências e comunicações aplicáveis previstas na legislação.</p>
          <p>Os dados devem ser mantidos pelo tempo necessário às finalidades informadas, à gestão da conta, à condução das candidaturas e ao cumprimento de obrigações legais. A plataforma não apresenta atualmente um prazo único de retenção para cada categoria. A instituição deve definir e publicar prazos, critérios de descarte e tratamento de cópias de segurança; após o término, os dados serão eliminados ou anonimizados quando possível, ressalvadas hipóteses legais de conservação.</p>
        </section>
        <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">6. Direitos da pessoa titular</h2>
          <p>Nos termos da LGPD, a pessoa pode solicitar confirmação da existência de tratamento, acesso, correção de dados incompletos ou desatualizados, anonimização, bloqueio ou eliminação quando cabíveis, portabilidade nos termos da regulamentação, informação sobre compartilhamentos, informação sobre a possibilidade de negar consentimento e suas consequências, revogação do consentimento e revisão de decisões automatizadas, quando aplicável.</p>
          <p>Para exercer esses direitos ou esclarecer dúvidas, escreva para <a className="text-primary underline underline-offset-4" href="mailto:carreiras@unis.edu.br">carreiras@unis.edu.br</a>, identificando a conta e descrevendo o pedido. Poderemos solicitar informações proporcionais para confirmar a identidade e proteger os dados contra divulgação a terceiros. Alguns dados poderão ser mantidos quando houver fundamento legal para conservação.</p>
        </section>
        <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">7. Cookies e tecnologias locais</h2>
          <p>A plataforma utiliza armazenamento local do navegador para manter a sessão de autenticação e um identificador aleatório usado para limitar contagens repetidas de visualização de vagas. Não foi identificada, no código revisado, uma ferramenta de publicidade comportamental ou de análise de terceiros. Essa descrição deve ser atualizada se novas ferramentas, cookies ou pixels forem adicionados.</p>
        </section>
        <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">8. Atualizações desta política</h2>
          <p>Esta política pode ser atualizada para refletir mudanças na plataforma ou na legislação. A versão vigente e sua data de atualização serão mantidas nesta página. Mudanças relevantes serão comunicadas por meio adequado, quando aplicável.</p>
        </section>
        <aside className="rounded-lg border border-primary/30 bg-primary-soft/40 p-4 text-sm"><strong className="text-foreground">Revisão institucional pendente:</strong> antes de considerar este texto como política final, a Faculdade Unis deve confirmar a pessoa jurídica controladora e seus dados de contato, o canal do encarregado, fornecedores e transferências internacionais, prazos de retenção por categoria, bases legais aplicáveis a cada finalidade e procedimentos para atender solicitações. Este texto descreve funcionalidades verificadas no código e não substitui validação jurídica institucional.</aside>
      </article>
    </>
  );
}
