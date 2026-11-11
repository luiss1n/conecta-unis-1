-- Expose only the names of people who have opened NAF cases to NAF staff.
-- Keep the private profiles table restricted to each account owner.
CREATE OR REPLACE FUNCTION public.get_naf_requester_names()
RETURNS TABLE (requester_id uuid, display_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso restrito ao NAF e administradores' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT DISTINCT c.requester_id, p.display_name
    FROM public.naf_cases c
    JOIN public.profiles p ON p.id = c.requester_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_naf_requester_names() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_naf_requester_names() TO authenticated;
