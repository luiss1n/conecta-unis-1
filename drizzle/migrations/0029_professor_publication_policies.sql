-- Make the professor publication contract explicit and independent from the
-- original company-only policies. Public reads still exclude moderated rows.
DROP POLICY IF EXISTS jobs_professor_insert_own ON public.jobs;
DROP POLICY IF EXISTS jobs_insert_own ON public.jobs;
CREATE POLICY jobs_insert_own ON public.jobs
FOR INSERT TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND (
    (
      public.has_role(auth.uid(), 'company')
      AND "companySlug" IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.slug = "companySlug" AND c.owner_id = auth.uid()
      )
    )
    OR (
      public.has_role(auth.uid(), 'professor')
      AND "companySlug" IS NULL
      AND publisher_name IS NOT NULL
      AND char_length(trim(publisher_name)) BETWEEN 2 AND 150
    )
  )
);

DROP POLICY IF EXISTS events_insert_own ON public.events;
CREATE POLICY events_insert_own ON public.events
FOR INSERT TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND public.has_role(auth.uid(), 'professor')
  AND NOT is_hidden
);

DROP POLICY IF EXISTS events_public ON public.events;
CREATE POLICY events_public ON public.events
FOR SELECT TO anon, authenticated
USING (NOT is_hidden);

DROP POLICY IF EXISTS events_admin_hidden ON public.events;
CREATE POLICY events_admin_hidden ON public.events
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
