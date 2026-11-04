-- Permite encerrar vagas manualmente e definir um prazo de candidatura.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS closes_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.jobs'::regclass
      AND conname = 'jobs_status_valid'
  ) THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_status_valid CHECK (status IN ('open', 'closed'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS jobs_public_availability_idx
  ON public.jobs (status, closes_at, "publishedAt" DESC);

-- O banco bloqueia candidaturas mesmo se alguém tentar chamar a API diretamente.
CREATE OR REPLACE FUNCTION public.require_open_job_for_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.slug = NEW.job_slug
      AND j.status = 'open'
      AND (j.closes_at IS NULL OR j.closes_at > now())
  ) THEN
    RAISE EXCEPTION 'This job is closed or expired';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.require_open_job_for_application() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS job_applications_require_open_job ON public.job_applications;
CREATE TRIGGER job_applications_require_open_job
  BEFORE INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.require_open_job_for_application();

-- Mantém a entrega de alertas por perfil/cidade e não avisa sobre vaga encerrada ou vencida.
CREATE OR REPLACE FUNCTION public.notify_matching_student_job_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> 'open' OR (NEW.closes_at IS NOT NULL AND NEW.closes_at <= now()) THEN
    RETURN NEW;
  END IF;

  WITH matched AS (
    SELECT DISTINCT pref.user_id
    FROM public.student_job_alert_preferences pref
    WHERE pref.enabled = true
      AND public.has_role(pref.user_id, 'visitor')
      AND NOT EXISTS (
        SELECT 1 FROM public.job_alert_deliveries delivered
        WHERE delivered.user_id = pref.user_id AND delivered.job_slug = NEW.slug
      )
      AND (cardinality(pref.categories) = 0 OR NEW.category = ANY(pref.categories))
      AND (
        cardinality(pref.cities) = 0
        OR NEW.city = ANY(pref.cities)
        OR EXISTS (
          SELECT 1 FROM public.regional_cities job_city
          JOIN public.regional_cities selected_city ON selected_city.city = ANY(pref.cities)
          WHERE job_city.city = NEW.city
            AND public.distance_km(job_city.latitude, job_city.longitude, selected_city.latitude, selected_city.longitude) <= 20
        )
      )
  ), inserted AS (
    INSERT INTO public.notifications(recipient_id, actor_id, title, body, target_path)
    SELECT user_id, NEW.owner_id, 'Nova vaga para o seu perfil', NEW.title, '/vagas/' || NEW.slug
    FROM matched
    RETURNING id, recipient_id
  )
  INSERT INTO public.job_alert_deliveries(user_id, job_slug, notification_id)
  SELECT recipient_id, NEW.slug, id FROM inserted;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_matching_student_job_alerts() FROM PUBLIC, anon, authenticated;
