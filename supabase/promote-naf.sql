-- 1. Crie a conta normalmente pelo site e confirme o e-mail.
-- 2. Execute as migrações 0023 e 0024 no SQL Editor, nesta ordem e em execuções separadas.
-- 3. Substitua o e-mail abaixo pelo da conta que receberá o cargo NAF.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'naf'::public.app_role
FROM auth.users
WHERE lower(email) = lower('email-do-naf@exemplo.com')
  AND email_confirmed_at IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
