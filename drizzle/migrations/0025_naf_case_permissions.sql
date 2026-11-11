DROP POLICY IF EXISTS naf_cases_insert ON public.naf_cases;
CREATE POLICY naf_cases_insert ON public.naf_cases FOR INSERT TO authenticated
  WITH CHECK (
    (requester_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    AND (public.has_role(requester_id,'company') OR public.has_role(requester_id,'visitor'))
  );
