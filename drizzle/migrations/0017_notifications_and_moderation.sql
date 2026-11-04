CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform_posts boolean NOT NULL DEFAULT true,
  application_updates boolean NOT NULL DEFAULT true,
  messages boolean NOT NULL DEFAULT true,
  event_registrations boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
DROP POLICY IF EXISTS jobs_public ON public.jobs;
CREATE POLICY jobs_public ON public.jobs FOR SELECT TO anon, authenticated USING (NOT is_hidden);
DROP POLICY IF EXISTS jobs_admin_hidden ON public.jobs;
CREATE POLICY jobs_admin_hidden ON public.jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS events_public ON public.events;
CREATE POLICY events_public ON public.events FOR SELECT TO anon, authenticated USING (NOT is_hidden);
DROP POLICY IF EXISTS events_admin_hidden ON public.events;
CREATE POLICY events_admin_hidden ON public.events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS jobs_visibility_idx ON public.jobs(is_hidden, status);
CREATE INDEX IF NOT EXISTS events_visibility_idx ON public.events(is_hidden, date);

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'users', (SELECT count(*)::int FROM public.profiles),
    'jobs', (SELECT count(*)::int FROM public.jobs j WHERE NOT j.is_hidden AND j.status = 'open' AND (j.closes_at IS NULL OR j.closes_at > now())),
    'companies', (SELECT count(*)::int FROM public.companies),
    'events', (SELECT count(*)::int FROM public.events e WHERE NOT e.is_hidden AND e.date >= now())
  );
$$;
REVOKE ALL ON FUNCTION public.get_platform_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_preferences FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
CREATE POLICY notification_preferences_own ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.publication_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_kind text NOT NULL CHECK (target_kind IN ('job', 'event')),
  target_ref text NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS publication_reports_status_created_idx ON public.publication_reports(status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS publication_reports_one_pending_per_user_idx
  ON public.publication_reports(reporter_id, target_kind, target_ref) WHERE status = 'pending';
ALTER TABLE public.publication_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.publication_reports FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.publication_reports TO authenticated;
GRANT UPDATE (status, reviewed_at, reviewer_id) ON public.publication_reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
CREATE POLICY publication_reports_admin_read ON public.publication_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY publication_reports_admin_update ON public.publication_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.submit_publication_report(_kind text, _target_ref text, _reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); report_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _kind NOT IN ('job', 'event') OR char_length(trim(_reason)) NOT BETWEEN 10 AND 1000 THEN RAISE EXCEPTION 'Invalid report'; END IF;
  IF (_kind = 'job' AND NOT EXISTS (SELECT 1 FROM public.jobs WHERE slug = _target_ref))
     OR (_kind = 'event' AND NOT EXISTS (SELECT 1 FROM public.events WHERE id::text = _target_ref)) THEN RAISE EXCEPTION 'Publication not found'; END IF;
  INSERT INTO public.publication_reports(reporter_id, target_kind, target_ref, reason)
  VALUES (uid, _kind, _target_ref, trim(_reason)) RETURNING id INTO report_id;
  RETURN report_id;
END; $$;
REVOKE ALL ON FUNCTION public.submit_publication_report(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_publication_report(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_platform_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_title text; post_body text; post_path text;
BEGIN
  IF TG_TABLE_NAME = 'jobs' THEN post_title := 'Nova vaga publicada'; post_body := NEW.title; post_path := '/vagas/' || NEW.slug;
  ELSE post_title := 'Novo evento publicado'; post_body := NEW.title; post_path := '/eventos/' || NEW.id::text; END IF;
  INSERT INTO public.notifications(recipient_id, actor_id, title, body, target_path)
  SELECT p.id, NEW.owner_id, post_title, post_body, post_path FROM public.profiles p
  LEFT JOIN public.notification_preferences pref ON pref.user_id = p.id
  WHERE p.id <> NEW.owner_id AND coalesce(pref.platform_posts, true);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_new_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid;
BEGIN
  SELECT owner_id INTO owner FROM public.jobs WHERE slug = NEW.job_slug;
  IF owner IS NOT NULL AND owner <> NEW.applicant_id AND coalesce((SELECT application_updates FROM public.notification_preferences WHERE user_id = owner), true) THEN
    INSERT INTO public.notifications(recipient_id, actor_id, title, body, target_path)
    VALUES(owner, NEW.applicant_id, 'Nova candidatura recebida', NEW.applicant_name || ' se candidatou a uma vaga.', '/candidaturas');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_application_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid; applicant uuid; recipient uuid;
BEGIN
  SELECT j.owner_id, a.applicant_id INTO owner, applicant FROM public.job_applications a JOIN public.jobs j ON j.slug = a.job_slug WHERE a.id = NEW.application_id;
  recipient := CASE WHEN NEW.sender_id = applicant THEN owner WHEN NEW.sender_id = owner THEN applicant ELSE NULL END;
  IF recipient IS NOT NULL AND coalesce((SELECT messages FROM public.notification_preferences WHERE user_id = recipient), true) THEN
    INSERT INTO public.notifications(recipient_id, actor_id, title, body, target_path)
    VALUES(recipient, NEW.sender_id, 'Nova mensagem', left(NEW.body, 160), '/conversas/' || NEW.application_id::text);
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE job_title text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  SELECT title INTO job_title FROM public.jobs WHERE slug = NEW.job_slug;
  IF NEW.applicant_id <> auth.uid() AND coalesce((SELECT application_updates FROM public.notification_preferences WHERE user_id = NEW.applicant_id), true) THEN
    INSERT INTO public.notifications(recipient_id, actor_id, title, body, target_path)
    VALUES(NEW.applicant_id, auth.uid(), 'Atualização da candidatura', 'O status da sua candidatura para "' || job_title || '" foi atualizado.', '/candidaturas');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_event_registration()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE event_owner uuid; event_title text;
BEGIN
  SELECT owner_id, title INTO event_owner, event_title FROM public.events WHERE id = NEW.event_id;
  IF event_owner IS NOT NULL AND event_owner <> NEW.user_id AND coalesce((SELECT event_registrations FROM public.notification_preferences WHERE user_id = event_owner), true) THEN
    INSERT INTO public.notifications(recipient_id, actor_id, title, body, target_path)
    VALUES(event_owner, NEW.user_id, 'Nova inscrição em evento', event_title, '/candidaturas');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS event_interests_notify_owner ON public.event_interests;
CREATE TRIGGER event_interests_notify_owner AFTER INSERT ON public.event_interests FOR EACH ROW EXECUTE FUNCTION public.notify_event_registration();

-- Estas funções são chamadas apenas por triggers, nunca diretamente por clientes.
REVOKE ALL ON FUNCTION public.notify_platform_post() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_application() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_application_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_application_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_event_registration() FROM PUBLIC, anon, authenticated;
