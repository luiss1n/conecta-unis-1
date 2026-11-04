-- Bloqueia escritas diretas em publicações ocultas, além de escondê-las nas consultas públicas.

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
      AND NOT j.is_hidden
      AND j.status = 'open'
      AND (j.closes_at IS NULL OR j.closes_at > now())
  ) THEN
    RAISE EXCEPTION 'This job is closed, hidden, or expired';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.require_open_job_for_application() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS interest_insert ON public.event_interests;
CREATE POLICY interest_insert ON public.event_interests FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles r
      WHERE r.user_id = auth.uid() AND r.role IN ('visitor', 'professor')
    )
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND NOT e.is_hidden
    )
  );
