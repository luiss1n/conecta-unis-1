# Roadmap do CONECTA UNIS

Este documento acompanha o estado do código. Itens marcados como implementados indicam que a funcionalidade está presente no projeto; não significam, por si só, que todos os fluxos foram validados em produção.

## Implementado no código

- [x] Autenticação, recuperação de senha e perfis de aluno, empresa, professor e administrador.
- [x] Edição de perfil, foto, banner e currículo, incluindo avatar do Google como padrão quando disponível.
- [x] Publicação e administração de vagas e eventos usando Supabase.
- [x] Busca e filtros de vagas, páginas de empresas e estados vazios para dados reais.
- [x] Candidaturas, conversas, mensagens e visualização do perfil do candidato pela conversa.
- [x] Notificações privadas para a conta logada, com leitura e atualização de estado.
- [x] Alertas de vagas por perfil, área e cidade; catálogo da SRE Caxambu e cidades próximas até 20 km.
- [x] Vagas salvas e calendário mensal de carreira com inscrições em eventos.
- [x] Rascunhos de publicação sincronizados à conta de quem publica.
- [x] Onboarding de aluno com currículo obrigatório para concluir o cadastro.
- [x] Cartão “Seu próximo passo” personalizado para alunos.
- [x] Encerramento de vagas e data limite para candidatura na interface e nos serviços.
- [x] Identidade visual azul e logotipo institucional no cabeçalho e rodapé.

## Próxima etapa: validar as jornadas principais

1. [ ] Aplicar ou confirmar no Supabase a migration `0015_job_closing_and_deadlines.sql`.
2. [ ] Percorrer a jornada do aluno: cadastro, currículo, alertas, busca, vaga salva, candidatura, mensagem e notificação.
3. [ ] Percorrer a jornada de empresa e professor: publicar, rascunho, editar, encerrar vaga e responder candidaturas.
4. [ ] Percorrer a jornada de administração: criar, editar, encerrar e excluir vagas e eventos; conferir contagens e permissões.
5. [ ] Confirmar persistência após sair e entrar novamente e conferir acesso a perfis e arquivos privados com contas diferentes.
6. [ ] Revisar o componente de perfil demonstrativo que ainda usa dados simulados (`CandidateProfileCard`) e decidir se será substituído por dados reais ou removido.

## Depois da validação: segurança e estabilidade

- [ ] Revisar manualmente RLS, permissões de Storage e funções SQL/RPC para cada papel e cada recurso.
- [ ] Verificar validação de entrada, limites de tamanho, paginação e consultas que possam crescer com o uso.
- [ ] Revisar proteção contra envios repetidos e excesso de requisições em ações como login, candidatura e mensagens.
- [ ] Conferir erros, carregamento, estados vazios e comportamento em telas pequenas nos fluxos principais.
- [ ] Registrar problemas encontrados, corrigir e validar cada fluxo afetado antes de novas funcionalidades.

## Futuras funcionalidades

- [ ] Melhorias de moderação e acompanhamento de publicações no painel administrativo, conforme necessidades encontradas na validação.
- [ ] Lembretes de eventos e alertas com preferências configuráveis pelo usuário.
- [ ] Assistente de IA para orientar novos usuários, com escopo, fontes e permissões de dados definidos antes da integração.

## Critério de conclusão

Uma etapa só será marcada como concluída quando o código estiver implementado e o fluxo correspondente tiver sido verificado. Alterações de banco devem indicar a migration necessária e se ela já foi aplicada no Supabase.
