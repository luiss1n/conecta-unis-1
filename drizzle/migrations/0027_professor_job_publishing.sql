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
    )
  )
);
