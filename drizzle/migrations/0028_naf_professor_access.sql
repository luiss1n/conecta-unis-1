DROP POLICY IF EXISTS naf_cases_insert ON public.naf_cases;
CREATE POLICY naf_cases_insert ON public.naf_cases
FOR INSERT TO authenticated
WITH CHECK (
  requester_id = auth.uid()
  AND public.has_role(auth.uid(), 'professor')
);
