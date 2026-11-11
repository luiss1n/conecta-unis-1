# Testes manuais — NAF e aluno (11/11/2026)

## Pontos a corrigir observados na conta NAF

1. No formulário de novo evento aparece “Não foi possível sincronizar o rascunho”. O evento foi publicado com sucesso, mas a falha do rascunho precisa ser investigada.
2. Ao buscar ou filtrar vagas e eventos sem resultados, o painel mostra “Nenhuma vaga publicada” ou “Nenhum evento publicado” e sugere criar a primeira publicação, embora existam publicações fora do filtro. Mostrar uma mensagem específica para busca sem resultado.

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
- Moderar uma denúncia pendente; não havia nenhuma.
- Confirmar o recebimento da mensagem de atendimento no perfil da empresa ou do aluno.
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

1. Alertas do aluno: lista de cidades não carrega; a página informa depender de migração. O botão “Salvar preferências” permanece desabilitado mesmo após escolher área de interesse. Verificar migração e funcionamento de alertas.
2. Inscrição em evento: a interface em produção confirmou a inscrição, mas não oferecia cancelamento. Foi implementada uma opção de cancelamento no código local; falta publicar e testar no navegador após deploy.
3. A inscrição da conta de aluno na Feira Empresarial permanece ativa na produção até a correção ser publicada e o cancelamento ser executado.
4. Troca e remoção de currículo não foram testadas, para preservar o arquivo existente. O usuário escolheu deixar esse teste pendente.
5. Troca de foto e capa não foi testada sem arquivos de teste.
6. Denúncia enviada pelo aluno precisa ser verificada e marcada como analisada na conta NAF em uma próxima troca de perfil.
7. A entrega da mensagem do aluno ao NAF e as notificações correspondentes ainda precisam ser confirmadas pelo lado NAF.
8. Notificações reais restantes não foram marcadas como lidas ou removidas.
