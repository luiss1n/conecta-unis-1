CREATE TABLE IF NOT EXISTS public.job_views (
  job_slug text NOT NULL REFERENCES public.jobs(slug) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  viewed_on date NOT NULL,
  PRIMARY KEY (job_slug, viewer_id, viewed_on)
);
CREATE INDEX IF NOT EXISTS job_views_day_idx ON public.job_views (viewed_on, job_slug);
ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_views FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_job_view(_job_slug text, _viewer_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _viewer_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.jobs
    WHERE slug = _job_slug AND NOT is_hidden
  ) THEN RETURN; END IF;
  INSERT INTO public.job_views (job_slug, viewer_id, viewed_on)
  VALUES (_job_slug, _viewer_id, (now() AT TIME ZONE 'America/Sao_Paulo')::date)
  ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.record_job_view(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_job_view(text, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_naf_job_analytics(_days integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE start_day date; result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  IF _days NOT IN (1, 7, 30) THEN RAISE EXCEPTION 'Invalid report period'; END IF;
  start_day := CASE _days
    WHEN 1 THEN (now() AT TIME ZONE 'America/Sao_Paulo')::date
    WHEN 7 THEN date_trunc('week', now() AT TIME ZONE 'America/Sao_Paulo')::date
    ELSE date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date
  END;
  SELECT jsonb_build_object(
    'jobs', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'slug', j.slug, 'title', j.title, 'views',
        (SELECT count(*) FROM public.job_views v WHERE v.job_slug = j.slug AND v.viewed_on >= start_day),
        'applications',
        (SELECT count(*) FROM public.job_applications a WHERE a.job_slug = j.slug AND (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date >= start_day)
      ) ORDER BY j."publishedAt" DESC) FROM public.jobs j
    ), '[]'::jsonb),
    'series', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', d.day::date,
        'views', (SELECT count(*) FROM public.job_views v WHERE v.viewed_on = d.day::date),
        'applications', (SELECT count(*) FROM public.job_applications a WHERE (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date = d.day::date)
      ) ORDER BY d.day)
      FROM generate_series(start_day, (now() AT TIME ZONE 'America/Sao_Paulo')::date, interval '1 day') AS d(day)
    ), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_naf_job_analytics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_naf_job_analytics(integer) TO authenticated;
