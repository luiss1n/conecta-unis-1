-- Keep NAF case access aligned with the /naf route: students (visitor),
-- companies, and institutionally verified professors may open their own cases.
-- NAF/admin staff may still open cases on behalf of supported requester roles.
DROP POLICY IF EXISTS naf_cases_insert ON public.naf_cases;
CREATE POLICY naf_cases_insert ON public.naf_cases
FOR INSERT TO authenticated
WITH CHECK (
  (
    requester_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'visitor')
      OR public.has_role(auth.uid(), 'company')
      OR public.has_role(auth.uid(), 'professor')
    )
  )
  OR (
    public.has_role(auth.uid(), 'admin')
    AND (
      public.has_role(requester_id, 'visitor')
      OR public.has_role(requester_id, 'company')
      OR public.has_role(requester_id, 'professor')
    )
  )
);
