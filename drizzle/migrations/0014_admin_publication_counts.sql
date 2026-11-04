CREATE OR REPLACE FUNCTION public.get_admin_publication_counts()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_object_agg(counts.job_slug, counts.total)
    FROM (SELECT job_slug, count(*)::integer AS total FROM public.job_applications GROUP BY job_slug) counts
  ), '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_publication_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_publication_counts() TO authenticated;
