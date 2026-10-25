# CONECTA UNIS

CONECTA UNIS é a plataforma de vagas, empresas e eventos de carreira da Faculdade Unis São Lourenço. A stack atual do projeto é:

- TanStack Start (React 19 + Vite)
- Supabase (auth + Postgres com RLS)
- Tailwind 4
- shadcn/ui
- Vitest
- Bun

Este repositório já está migrado para leitura de vagas, empresas e eventos diretamente do Supabase; os dados estáticos antigos foram removidos e a área administrativa passou a operar por policies e rotas do banco.

## Requisitos

- Bun 1.x
- Node.js 20+ para ferramentas locais, se necessário
- Uma conta no Supabase com projeto configurado

## Setup do ambiente

Crie um arquivo `.env` a partir do template abaixo e preencha com os valores do seu projeto Supabase:

```dotenv
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=seu_publishable_key
SUPABASE_PROJECT_ID=seu_project_id
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.SEU_PROJETO.supabase.co:5432/postgres
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=seu_publishable_key
VITE_SUPABASE_PROJECT_ID=seu_project_id
```

Importante:
- Nunca commite `.env`, chaves ou segredos.
- `SUPABASE_*` e `VITE_SUPABASE_*` são usadas pela aplicação.
- `DATABASE_URL` é usada pelo Drizzle para migrações e scripts de banco.

## Instalação

```bash
bun install
```

## Rodando em desenvolvimento

```bash
bun run dev
```

## Build e produção

O build do TanStack Start gera o servidor Nitro em `.output/server/index.mjs`.

```bash
bun run build
bun run start
```

No Railway, o comando de inicialização deve ser:

```bash
bun run start
```

Ou, diretamente:

```bash
bun .output/server/index.mjs
```

## Banco de dados e migrações

As migrações SQL ficam em `drizzle/migrations/` e devem ser aplicadas em ordem cronológica. Para um banco novo ou resetado:

1. Crie o projeto e configure as variáveis de ambiente.
2. Execute os arquivos em ordem:
   - `drizzle/migrations/0000_real_accounts_and_career_catalog.sql`
   - `drizzle/migrations/0001_visitor_account_type.sql`
   - `drizzle/migrations/0002_complete_private_profiles.sql`
   - `drizzle/migrations/0003_admin_role.sql`
   - `drizzle/migrations/0004_admin_management.sql`
3. Se preferir via Drizzle com `DATABASE_URL` configurado, use o comando do cliente do Drizzle para aplicar as migrações do projeto no ambiente adequado.

No Supabase, a forma mais segura é rodar cada arquivo no SQL Editor do projeto, na ordem acima, e confirmar que as policies e bucket do admin foram criadas.

## Tornar um usuário administrador

Existe um script pronto em `supabase/promote-admin.sql`.

Abra o SQL Editor do Supabase e execute:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

Para remover o acesso depois:

```sql
DELETE FROM public.user_roles
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com'
);
```

## Estrutura importante

- `src/services/api.ts` — camada de acesso ao Supabase
- `src/routes/_authenticated/admin.tsx` — painel administrativo
- `src/components/forms/` — formulários de vagas e eventos
- `src/integrations/supabase/` — cliente e tipos do Supabase
- `drizzle/migrations/` — migrações SQL do banco
- `supabase/promote-admin.sql` — promoção de conta admin

## Observações

- A stack antiga de Next.js/NestJS/Prisma foi removida do projeto e não deve ser reintroduzida.
- Não são aceitos arquivos `.env` no repositório.
- Os arquivos estáticos de dados (`src/data/jobs.ts`, `src/data/companies.ts`, `src/data/events.ts`) não devem retornar ao projeto.
- A dependência `@lovable.dev` também não deve ser reinstalada.

## Comandos úteis

```bash
bun install
bun run dev
bunx tsc --noEmit
bun run lint
bun run test
bun run build
bun run start
```
