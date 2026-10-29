-- Dados reais da plataforma e notificações persistidas por usuário.
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  target_path text NOT NULL DEFAULT '/',
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx ON public.notifications (recipient_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;
DROP POLICY IF EXISTS notifications_read_own ON public.notifications;
CREATE POLICY notifications_read_own ON public.notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid());
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
GRANT ALL ON public.notifications TO service_role;

CREATE OR REPLACE FUNCTION public.notify_platform_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_title text; post_body text; post_path text;
BEGIN
  IF TG_TABLE_NAME = 'jobs' THEN
    post_title := 'Nova vaga publicada';
    post_body := NEW.title;
    post_path := '/vagas/' || NEW.slug;
  ELSE
    post_title := 'Novo evento publicado';
    post_body := NEW.title;
    post_path := '/eventos/' || NEW.id::text;
  END IF;
  INSERT INTO public.notifications(recipient_id, actor_id, title, body, target_path)
  SELECT p.id, NEW.owner_id, post_title, post_body, post_path
  FROM public.profiles p WHERE p.id <> NEW.owner_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS jobs_notify_after_insert ON public.jobs;
CREATE TRIGGER jobs_notify_after_insert AFTER INSERT ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.notify_platform_post();
DROP TRIGGER IF EXISTS events_notify_after_insert ON public.events;
CREATE TRIGGER events_notify_after_insert AFTER INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION public.notify_platform_post();

CREATE OR REPLACE FUNCTION public.notify_new_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid;
BEGIN
  SELECT owner_id INTO owner FROM public.jobs WHERE slug = NEW.job_slug;
  IF owner IS NOT NULL AND owner <> NEW.applicant_id THEN
    INSERT INTO public.notifications(recipient_id, actor_id, title, body, target_path)
    VALUES(owner, NEW.applicant_id, 'Nova candidatura recebida', NEW.applicant_name || ' se candidatou a uma vaga.', '/candidaturas');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS applications_notify_after_insert ON public.job_applications;
CREATE TRIGGER applications_notify_after_insert AFTER INSERT ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.notify_new_application();

CREATE OR REPLACE FUNCTION public.notify_application_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid; applicant uuid; job_slug text;
BEGIN
  SELECT j.owner_id, a.applicant_id, a.job_slug INTO owner, applicant, job_slug
  FROM public.job_applications a JOIN public.jobs j ON j.slug = a.job_slug WHERE a.id = NEW.application_id;
  IF NEW.sender_id = applicant THEN
    INSERT INTO public.notifications(recipient_id, actor_id, title, body, target_path)
    VALUES(owner, NEW.sender_id, 'Nova mensagem', left(NEW.body, 160), '/conversas/' || NEW.application_id::text);
  ELSIF NEW.sender_id = owner THEN
    INSERT INTO public.notifications(recipient_id, actor_id, title, body, target_path)
    VALUES(applicant, NEW.sender_id, 'Nova mensagem', left(NEW.body, 160), '/conversas/' || NEW.application_id::text);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS application_messages_notify_after_insert ON public.application_messages;
CREATE TRIGGER application_messages_notify_after_insert AFTER INSERT ON public.application_messages FOR EACH ROW EXECUTE FUNCTION public.notify_application_message();

CREATE OR REPLACE FUNCTION public.notify_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid; job_title text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  SELECT j.owner_id, j.title INTO owner, job_title FROM public.jobs j WHERE j.slug = NEW.job_slug;
  IF NEW.applicant_id <> auth.uid() THEN
    INSERT INTO public.notifications(recipient_id, actor_id, title, body, target_path)
    VALUES(NEW.applicant_id, auth.uid(), 'Atualização da candidatura', 'O status da sua candidatura para "' || job_title || '" foi atualizado.', '/candidaturas');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS application_status_notify_after_update ON public.job_applications;
CREATE TRIGGER application_status_notify_after_update AFTER UPDATE OF status ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.notify_application_status();

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'users', (SELECT count(*)::int FROM public.profiles),
    'jobs', (SELECT count(*)::int FROM public.jobs),
    'companies', (SELECT count(*)::int FROM public.companies),
    'events', (SELECT count(*)::int FROM public.events)
  );
$$;
REVOKE ALL ON FUNCTION public.get_platform_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;

-- Regras de username e telefone também valem quando os dados são enviados direto à API.
CREATE OR REPLACE FUNCTION public.normalize_profile_username()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.username IS NULL OR trim(NEW.username) = '' THEN
    NEW.username := '';
    RETURN NEW;
  END IF;
  NEW.username := lower(normalize(trim(NEW.username), NFC));
  IF char_length(NEW.username) NOT BETWEEN 3 AND 25
     OR NEW.username !~ '^[[:alnum:][:punct:]]+$'
     OR NEW.username !~ '[[:alnum:]]' THEN
    RAISE EXCEPTION 'Invalid username';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF char_length(NEW.display_name)>100 OR char_length(NEW.address)>250 OR char_length(NEW.state)>100 OR char_length(NEW.country)>100 OR char_length(NEW.headline)>160 OR char_length(NEW.education)>160 OR char_length(NEW.institution)>160 OR char_length(NEW.city)>100 OR char_length(NEW.bio)>2000 OR char_length(NEW.resume_name)>200 THEN RAISE EXCEPTION 'Invalid profile fields'; END IF;
  IF (TG_OP = 'INSERT' OR NEW.phone IS DISTINCT FROM OLD.phone) AND NEW.phone <> '' AND (char_length(NEW.phone)>15 OR NEW.phone !~ '^\([0-9]{2}\) [0-9]{5}-[0-9]{4}$') THEN RAISE EXCEPTION 'Invalid phone'; END IF;
  IF (NEW.avatar_path<>'' AND NEW.avatar_path NOT LIKE NEW.id::text || '/%') OR (NEW.banner_path<>'' AND NEW.banner_path NOT LIKE NEW.id::text || '/%') OR (NEW.resume_path<>'' AND NEW.resume_path NOT LIKE NEW.id::text || '/%') THEN RAISE EXCEPTION 'Invalid file owner'; END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.save_registration(payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); chosen public.app_role; existing public.app_role; chosen_username text; phone_value text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  chosen := (payload->>'kind')::public.app_role;
  IF chosen IS NULL OR chosen = 'admin' THEN RAISE EXCEPTION 'Account type not allowed'; END IF;
  SELECT role INTO existing FROM public.user_roles WHERE user_id = uid;
  IF existing IS NOT NULL AND existing <> chosen THEN RAISE EXCEPTION 'Account type cannot be changed'; END IF;
  chosen_username := lower(normalize(trim(coalesce(payload->>'username','')), NFC));
  phone_value := coalesce(payload->>'phone','');
  IF coalesce(char_length(trim(payload->>'display_name')),0) NOT BETWEEN 2 AND 100
     OR char_length(chosen_username) NOT BETWEEN 3 AND 25
     OR chosen_username !~ '^[[:alnum:][:punct:]]+$'
     OR chosen_username !~ '[[:alnum:]]'
     OR coalesce(char_length(trim(payload->>'city')),0) NOT BETWEEN 2 AND 100
     OR char_length(phone_value) > 15
     OR (phone_value <> '' AND phone_value !~ '^\([0-9]{2}\) [0-9]{5}-[0-9]{4}$')
     OR char_length(coalesce(payload->>'bio','')) > 2000 THEN RAISE EXCEPTION 'Invalid profile'; END IF;
  IF chosen = 'company' AND (coalesce(char_length(trim(payload->>'company_name')),0) NOT BETWEEN 2 AND 120 OR coalesce(char_length(trim(payload->>'legal_name')),0) NOT BETWEEN 2 AND 160 OR coalesce(payload->>'cnpj','') !~ '^[0-9]{14}$' OR coalesce(char_length(trim(payload->>'sector')),0) NOT BETWEEN 2 AND 100 OR char_length(coalesce(payload->>'website','')) > 300 OR (coalesce(payload->>'website','') <> '' AND payload->>'website' !~ '^https?://')) THEN RAISE EXCEPTION 'Invalid company'; END IF;
  IF chosen = 'professor' AND (coalesce(char_length(trim(payload->>'institution')),0) NOT BETWEEN 2 AND 160 OR coalesce(char_length(trim(payload->>'department')),0) NOT BETWEEN 2 AND 160 OR coalesce(char_length(trim(payload->>'subjects')),0) NOT BETWEEN 2 AND 500 OR coalesce(char_length(trim(payload->>'qualification')),0) NOT BETWEEN 2 AND 160) THEN RAISE EXCEPTION 'Invalid professor'; END IF;
  UPDATE public.profiles SET display_name=trim(payload->>'display_name'), username=chosen_username, city=trim(payload->>'city'), phone=phone_value, bio=coalesce(payload->>'bio','') WHERE id=uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile missing'; END IF;
  INSERT INTO public.user_roles(user_id,role) VALUES(uid,chosen) ON CONFLICT(user_id) DO NOTHING;
  IF chosen='company' THEN
    INSERT INTO public.companies(owner_id,name,sector,city,summary,about,initials) VALUES(uid,trim(payload->>'company_name'),trim(payload->>'sector'),trim(payload->>'city'),coalesce(payload->>'summary',''),coalesce(payload->>'bio',''),upper(left(payload->>'company_name',2))) ON CONFLICT(owner_id) DO UPDATE SET name=EXCLUDED.name,sector=EXCLUDED.sector,city=EXCLUDED.city,summary=EXCLUDED.summary,about=EXCLUDED.about,initials=EXCLUDED.initials;
    INSERT INTO public.company_details(user_id,legal_name,cnpj,website) VALUES(uid,trim(payload->>'legal_name'),payload->>'cnpj',coalesce(payload->>'website','')) ON CONFLICT(user_id) DO UPDATE SET legal_name=EXCLUDED.legal_name,cnpj=EXCLUDED.cnpj,website=EXCLUDED.website;
  ELSIF chosen='professor' THEN
    INSERT INTO public.professor_details(user_id,institution,department,subjects,qualification) VALUES(uid,trim(payload->>'institution'),trim(payload->>'department'),trim(payload->>'subjects'),trim(payload->>'qualification')) ON CONFLICT(user_id) DO UPDATE SET institution=EXCLUDED.institution,department=EXCLUDED.department,subjects=EXCLUDED.subjects,qualification=EXCLUDED.qualification;
  END IF;
END; $$;
REVOKE ALL ON FUNCTION public.save_registration(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_registration(jsonb) TO authenticated;
