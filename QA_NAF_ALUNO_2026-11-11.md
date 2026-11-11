# Testes manuais — NAF e aluno (11/11/2026)

## Pontos a corrigir observados na conta NAF

1. No formulário de novo evento aparece “Não foi possível sincronizar o rascunho”. Causa identificada: o formulário tentava salvar um rascunho NAF/admin, mas a API de rascunhos permite apenas empresa e professor. Corrigido no código local; falta publicar e confirmar no navegador.
2. Ao buscar ou filtrar vagas e eventos sem resultados, o painel mostra “Nenhuma vaga publicada” ou “Nenhum evento publicado” e sugere criar a primeira publicação, embora existam publicações fora do filtro. Corrigido no código local com estado de busca vazia e botão para limpar filtros; falta publicar e confirmar no navegador.

## Cobertura NAF confirmada no navegador

- Vaga de teste: criar, editar, buscar, filtrar, ocultar, restaurar e encerrar. Terminou encerrada e oculta.
- Evento de teste: criar, editar, buscar, filtrar, ocultar e restaurar. Terminou oculto.
- Atendimento: abrir conversa para empresa de teste, enviar mensagem e consultar histórico.
- Relatórios: alternar entre hoje, semana e mês e carregar indicadores.
- Perfil: abrir modal, rolar conteúdo sem rolar a página de fundo e salvar sem alterar dados.
- Preferências de alertas: salvar configurações existentes.
- Denúncias: abrir a aba; havia apenas denúncia já analisada.

## Cobertura NAF pendente por falta de dados de teste seguros

- Remover uma notificação de teste e rolar uma lista longa de notificações; havia somente uma notificação real.
- Marcar uma denúncia pendente como analisada ou arquivada. A denúncia de teste do aluno agora aparece no NAF como pendente; o usuário preferiu deixar a ação de moderação pendente.
- Confirmar o recebimento da mensagem de atendimento no perfil da empresa.
- Exclusão definitiva de publicações não foi executada.

## Conta de aluno

### Fluxos confirmados no navegador

- Cadastro existente salvo; tipo de conta de aluno preservado. Campo opcional de MEI/empresa aceita seleção; a seleção de teste foi revertida antes de salvar.
- Perfil salvo sem alterar dados. Modal rolou internamente, com a página de fundo parada. “Editar sobre” abriu o mesmo formulário.
- Vagas: busca, filtros, estado vazio, limpeza de filtros e abertura dos detalhes.
- Vaga salva: adicionar, encontrar em “Vagas salvas” e remover. Terminou removida.
- Candidatura à vaga de teste “Teste” do NAF, com autorização específica: recebida, listada em “Minhas candidaturas”, conversa privada aberta e mensagem enviada. Depois foi cancelada; a conversa ficou disponível para consulta.
- Checklist de preparação: marcar, salvar e desmarcar. Terminou no estado original.
- Eventos: filtro de categoria, detalhes e inscrição na Feira Empresarial. A inscrição apareceu em “Eventos inscritos” e no calendário.
- Calendário: próximo mês e volta ao mês atual.
- Notificações: lista com nove itens rolou internamente sem mover a página; as duas notificações geradas pelos testes NAF foram removidas com autorização, restando as outras sete.
- Atendimento NAF: aluno abriu conversa “Outro assunto” e enviou mensagem de teste; o histórico mostrou a mensagem.
- Denúncia: aluno enviou registro explícito de teste para a vaga “Teste”, com autorização, sem acusação real. A plataforma confirmou o envio.
- Catálogo e página pública de empresa abriram corretamente.

### Pontos a corrigir ou validar

1. Alertas do aluno: lista de cidades não carrega; o botão “Salvar preferências” permanece desabilitado mesmo após escolher área de interesse. A migração `0012_student_job_alerts_and_region.sql` cria a tabela `regional_cities`, mas não há carga de cidades nas migrações do projeto. Verificar se a tabela de produção está vazia e adicionar dados geográficos validados antes de testar os alertas.
2. Inscrição em evento: a interface em produção confirmou a inscrição, mas não oferecia cancelamento. Foi implementada uma opção de cancelamento no código local; falta publicar e testar no navegador após deploy.
3. A inscrição da conta de aluno na Feira Empresarial permanece ativa na produção até a correção ser publicada e o cancelamento ser executado.
4. Troca e remoção de currículo não foram testadas, para preservar o arquivo existente. O usuário escolheu deixar esse teste pendente.
5. Troca de foto e capa não foi testada sem arquivos de teste.
6. A denúncia enviada pelo aluno aparece como pendente na conta NAF. Falta marcar como analisada ou arquivar quando autorizado.
7. A mensagem do aluno aparece no histórico do NAF. As notificações correspondentes ainda precisam ser verificadas.
8. Notificações reais restantes não foram marcadas como lidas ou removidas.
9. No NAF, a conversa do aluno aparecia como “Conta” e parte de um UUID. Correção local criada para mostrar o nome via função SQL restrita a NAF/admin (`0026_naf_requester_names.sql`). Falta aplicar a migração e validar em produção.
10. A largura de 390 px do painel NAF não apresentou rolagem horizontal; o menu móvel abriu normalmente. O teste não substitui validação em Android e iOS reais.

## Verificações locais

- `bun run build`: passou após as correções locais.
- `git diff --check`: passou.
- O lint, a checagem de tipos e a suíte de testes ainda falham por problemas preexistentes no repositório; nenhuma falha nova foi identificada nos arquivos alterados.
