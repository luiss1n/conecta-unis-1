
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND (role = _role OR (_role = 'admin' AND role = 'naf')));
$$;

CREATE OR REPLACE FUNCTION public.guard_self_service_role_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE account_email text; email_confirmed timestamptz;
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id <> auth.uid() THEN RETURN NEW; END IF;
  IF NEW.role IN ('admin', 'naf') THEN
    RAISE EXCEPTION 'Privileged roles must be granted by a trusted operator';
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

CREATE OR REPLACE FUNCTION public.assign_institutional_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE account_email text := lower(coalesce(NEW.email, ''));
BEGIN
  IF account_email !~ '^[^@]+@professor\.unis\.edu\.br$' THEN
    UPDATE public.user_roles SET role = 'visitor'
    WHERE user_id = NEW.id AND role = 'professor';
  END IF;
  IF NEW.email_confirmed_at IS NULL THEN RETURN NEW; END IF;
  IF account_email ~ '^[^@]+@alunos\.unis\.edu\.br$' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES(NEW.id, 'visitor')
    ON CONFLICT(user_id) DO UPDATE SET role = EXCLUDED.role
    WHERE public.user_roles.role NOT IN ('admin','naf');
  ELSIF account_email ~ '^[^@]+@professor\.unis\.edu\.br$' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES(NEW.id, 'professor')
    ON CONFLICT(user_id) DO UPDATE SET role = EXCLUDED.role
    WHERE public.user_roles.role NOT IN ('admin','naf');
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.company_details ADD COLUMN IF NOT EXISTS business_size text NOT NULL DEFAULT 'nao_informado';
ALTER TABLE public.company_details ADD CONSTRAINT company_business_size_valid
  CHECK (business_size IN ('nao_informado','mei','microempresa','pequena','media','grande','outro'));

CREATE TABLE public.student_businesses (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_size text NOT NULL CHECK (business_size IN ('mei','microempresa','pequena','media','grande','outro')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_businesses ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.student_businesses TO authenticated;
CREATE POLICY student_businesses_own ON public.student_businesses FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

ALTER FUNCTION public.save_registration(jsonb) RENAME TO save_registration_base;
CREATE FUNCTION public.save_registration(payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE chosen_size text := payload->>'business_size';
BEGIN
  IF payload->>'kind' IN ('admin','naf') THEN RAISE EXCEPTION 'Account type not allowed'; END IF;
  IF payload->>'kind' = 'company' AND coalesce(chosen_size,'') NOT IN
    ('mei','microempresa','pequena','media','grande','outro') THEN
    RAISE EXCEPTION 'Invalid business size';
  END IF;
  IF payload->>'kind' = 'visitor' AND coalesce(chosen_size,'') NOT IN
    ('','mei','microempresa','pequena','media','grande','outro') THEN
    RAISE EXCEPTION 'Invalid business size';
  END IF;
  PERFORM public.save_registration_base(payload);
  IF payload->>'kind' = 'company' THEN
    UPDATE public.company_details SET business_size = chosen_size WHERE user_id = auth.uid();
  ELSIF payload->>'kind' = 'visitor' THEN
    IF coalesce(chosen_size,'') = '' THEN
      DELETE FROM public.student_businesses WHERE user_id = auth.uid();
    ELSE
      INSERT INTO public.student_businesses(user_id,business_size) VALUES(auth.uid(),chosen_size)
      ON CONFLICT (user_id) DO UPDATE SET business_size = EXCLUDED.business_size, updated_at = now();
    END IF;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.save_registration(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_registration(jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.save_registration_base(jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_naf_new_company()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(recipient_id,actor_id,title,body,target_path)
  SELECT user_id, NEW.owner_id, 'Nova empresa cadastrada', NEW.name,
    '/admin' FROM public.user_roles WHERE role = 'naf';
  RETURN NEW;
END;
$$;
CREATE TRIGGER companies_notify_naf AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.notify_naf_new_company();

CREATE TABLE public.naf_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic text NOT NULL CHECK (char_length(topic) BETWEEN 3 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_id,topic)
);
CREATE TABLE public.naf_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.naf_cases(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX naf_messages_case_created_idx ON public.naf_messages(case_id,created_at);
ALTER TABLE public.naf_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.naf_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.naf_cases, public.naf_messages TO authenticated;
CREATE POLICY naf_cases_read ON public.naf_cases FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY naf_cases_insert ON public.naf_cases FOR INSERT TO authenticated
  WITH CHECK ((requester_id = auth.uid() AND EXISTS
    (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('company','visitor')))
    OR (public.has_role(auth.uid(),'admin') AND EXISTS
    (SELECT 1 FROM public.user_roles WHERE user_id = requester_id AND role IN ('company','visitor'))));
CREATE POLICY naf_messages_read ON public.naf_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.naf_cases c WHERE c.id = case_id));
CREATE POLICY naf_messages_insert ON public.naf_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS
    (SELECT 1 FROM public.naf_cases c WHERE c.id = case_id));

CREATE OR REPLACE FUNCTION public.notify_naf_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE requester uuid; topic_name text;
BEGIN
  SELECT requester_id, topic INTO requester, topic_name FROM public.naf_cases WHERE id = NEW.case_id;
  IF NEW.sender_id = requester THEN
    INSERT INTO public.notifications(recipient_id,actor_id,title,body,target_path)
    SELECT user_id, NEW.sender_id, 'Nova mensagem para o NAF', topic_name, '/admin'
    FROM public.user_roles WHERE role = 'naf';
  ELSE
    INSERT INTO public.notifications(recipient_id,actor_id,title,body,target_path)
    VALUES(requester, NEW.sender_id, 'Resposta do NAF', topic_name, '/alertas');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER naf_messages_notify AFTER INSERT ON public.naf_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_naf_message();
