CREATE TABLE IF NOT EXISTS public.regional_cities (
  ibge_code text UNIQUE,
  city text PRIMARY KEY,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  is_sre_caxambu boolean NOT NULL DEFAULT false
);

ALTER TABLE public.regional_cities ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.regional_cities TO anon, authenticated;
DROP POLICY IF EXISTS regional_cities_read ON public.regional_cities;
CREATE POLICY regional_cities_read ON public.regional_cities FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.distance_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
RETURNS double precision
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
AS $$
  SELECT 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

CREATE TABLE IF NOT EXISTS public.student_job_alert_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  categories text[] NOT NULL DEFAULT '{}',
  cities text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_alert_categories_valid CHECK (categories <@ ARRAY['Administração','Contabilidade','Tecnologia','Saúde','Direito','Comércio','Atendimento']::text[])
);

ALTER TABLE public.student_job_alert_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_job_alert_preferences FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_job_alert_preferences TO authenticated;
DROP POLICY IF EXISTS student_alert_preferences_own ON public.student_job_alert_preferences;
CREATE POLICY student_alert_preferences_own ON public.student_job_alert_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'visitor'))
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'visitor'));

CREATE OR REPLACE FUNCTION public.validate_student_job_alert_preferences()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(NEW.user_id, 'visitor') THEN RAISE EXCEPTION 'Only student accounts can configure job alerts'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(NEW.cities) chosen(city) WHERE NOT EXISTS (SELECT 1 FROM public.regional_cities rc WHERE rc.city = chosen.city)) THEN
    RAISE EXCEPTION 'One or more selected cities are not available';
  END IF;
  IF cardinality(NEW.cities) = 0 THEN
    RAISE EXCEPTION 'Choose at least one city for job alerts';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_student_job_alert_preferences() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS student_job_alert_preferences_validate ON public.student_job_alert_preferences;
CREATE TRIGGER student_job_alert_preferences_validate BEFORE INSERT OR UPDATE ON public.student_job_alert_preferences
FOR EACH ROW EXECUTE FUNCTION public.validate_student_job_alert_preferences();

CREATE TABLE IF NOT EXISTS public.job_alert_deliveries (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_slug text NOT NULL REFERENCES public.jobs(slug) ON DELETE CASCADE,
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_slug)
);
ALTER TABLE public.job_alert_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_alert_deliveries FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.job_alert_deliveries TO service_role;
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_slug text NOT NULL REFERENCES public.jobs(slug) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_slug)
);
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.saved_jobs FROM PUBLIC, anon;
GRANT SELECT, INSERT, DELETE ON public.saved_jobs TO authenticated;
DROP POLICY IF EXISTS saved_jobs_own ON public.saved_jobs;
CREATE POLICY saved_jobs_own ON public.saved_jobs FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'visitor'))
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'visitor'));
CREATE TABLE IF NOT EXISTS public.publication_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('job', 'event')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(payload) <= 65536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);
CREATE INDEX IF NOT EXISTS publication_drafts_user_updated_idx ON public.publication_drafts (user_id, updated_at DESC);
ALTER TABLE public.publication_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.publication_drafts FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publication_drafts TO authenticated;
DROP POLICY IF EXISTS publication_drafts_own ON public.publication_drafts;
CREATE POLICY publication_drafts_own ON public.publication_drafts FOR ALL TO authenticated
  USING (user_id = auth.uid() AND (public.has_role(auth.uid(), 'company') OR public.has_role(auth.uid(), 'professor')))
  WITH CHECK (user_id = auth.uid() AND (public.has_role(auth.uid(), 'company') OR public.has_role(auth.uid(), 'professor')));

CREATE OR REPLACE FUNCTION public.touch_publication_draft()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS publication_drafts_touch_updated_at ON public.publication_drafts;
CREATE TRIGGER publication_drafts_touch_updated_at BEFORE UPDATE ON public.publication_drafts
FOR EACH ROW EXECUTE FUNCTION public.touch_publication_draft();

CREATE OR REPLACE FUNCTION public.notify_matching_student_job_alerts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
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

DROP TRIGGER IF EXISTS jobs_notify_matching_students ON public.jobs;
CREATE TRIGGER jobs_notify_matching_students
AFTER INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.notify_matching_student_job_alerts();
