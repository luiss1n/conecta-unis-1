-- Atribui aluno/professor apenas a partir de e-mail institucional confirmado.
-- Diretor/admin não é concedido por domínio; precisa ser promovido por operador confiável.
CREATE OR REPLACE FUNCTION public.assign_institutional_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  account_email text := lower(coalesce(NEW.email, ''));
BEGIN
  -- Retire imediatamente permissões de professor se o e-mail institucional for removido.
  IF account_email !~ '^[^@]+@professor\.unis\.edu\.br$' THEN
    UPDATE public.user_roles SET role = 'visitor'
    WHERE user_id = NEW.id AND role = 'professor';
  END IF;

  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF account_email ~ '^[^@]+@alunos\.unis\.edu\.br$' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'visitor')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
    WHERE public.user_roles.role <> 'admin';
  ELSIF account_email ~ '^[^@]+@professor\.unis\.edu\.br$' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'professor')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
    WHERE public.user_roles.role <> 'admin';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_institutional_role() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS assign_institutional_role_on_signup ON auth.users;
CREATE TRIGGER assign_institutional_role_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_institutional_role();

DROP TRIGGER IF EXISTS assign_institutional_role_on_confirmation ON auth.users;
CREATE TRIGGER assign_institutional_role_on_confirmation
  AFTER UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_institutional_role();

-- Existing verified institutional accounts receive their role; unverified professor
-- accounts lose publishing privileges until they use the confirmed institutional domain.
UPDATE public.user_roles r
SET role = 'visitor'
FROM auth.users u
WHERE r.user_id = u.id
  AND r.role = 'professor'
  AND lower(coalesce(u.email, '')) !~ '^[^@]+@professor\.unis\.edu\.br$';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'visitor'::public.app_role FROM auth.users
WHERE email_confirmed_at IS NOT NULL
  AND lower(coalesce(email, '')) ~ '^[^@]+@alunos\.unis\.edu\.br$'
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
WHERE public.user_roles.role <> 'admin';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'professor'::public.app_role FROM auth.users
WHERE email_confirmed_at IS NOT NULL
  AND lower(coalesce(email, '')) ~ '^[^@]+@professor\.unis\.edu\.br$'
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
WHERE public.user_roles.role <> 'admin';

-- Prevent self-service promotion to professor/admin through save_registration or SQL.
CREATE OR REPLACE FUNCTION public.guard_self_service_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  account_email text;
  email_confirmed timestamptz;
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id <> auth.uid() THEN
    RETURN NEW;
  END IF;

  IF NEW.role = 'admin' THEN
    RAISE EXCEPTION 'Administrator roles must be granted by a trusted operator';
  END IF;

  IF NEW.role = 'professor' THEN
    SELECT lower(email), email_confirmed_at INTO account_email, email_confirmed
    FROM auth.users WHERE id = NEW.user_id;
    IF email_confirmed IS NULL OR account_email !~ '^[^@]+@professor\.unis\.edu\.br$' THEN
      RAISE EXCEPTION 'A confirmed professor.unis.edu.br account is required';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_self_service_role_assignment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_self_service_role_assignment ON public.user_roles;
CREATE TRIGGER guard_self_service_role_assignment
  BEFORE INSERT OR UPDATE OF role ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_self_service_role_assignment();
