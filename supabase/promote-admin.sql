-- Torna uma conta existente administradora. Rode no SQL Editor do Supabase (como dono do projeto).
-- 1) A pessoa precisa já ter criado a conta (e confirmado o e-mail). 2) Troque o e-mail abaixo.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Para remover o acesso depois:
-- DELETE FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com');
