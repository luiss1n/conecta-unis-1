CREATE OR REPLACE FUNCTION public.save_publication_draft(_kind text, _payload jsonb, _updated_at timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _kind NOT IN ('job', 'event') THEN RAISE EXCEPTION 'Invalid draft kind'; END IF;
  IF pg_column_size(_payload) > 65536 THEN RAISE EXCEPTION 'Draft is too large'; END IF;

  INSERT INTO public.publication_drafts(user_id, kind, payload, updated_at)
  VALUES (uid, _kind, _payload, _updated_at)
  ON CONFLICT (user_id, kind) DO UPDATE
    SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at
    WHERE public.publication_drafts.updated_at < EXCLUDED.updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.save_publication_draft(text, jsonb, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_publication_draft(text, jsonb, timestamptz) TO authenticated;
