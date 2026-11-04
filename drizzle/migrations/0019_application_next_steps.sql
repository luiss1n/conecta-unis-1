CREATE TABLE IF NOT EXISTS public.application_next_steps (
  application_id uuid PRIMARY KEY REFERENCES public.job_applications(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist jsonb NOT NULL DEFAULT '{"review_job":false,"tailor_resume":false,"prepare_examples":false,"prepare_questions":false}'::jsonb,
  reflection text NOT NULL DEFAULT '' CHECK (char_length(reflection) <= 2000),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.application_next_steps ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.application_next_steps TO authenticated;
DROP POLICY IF EXISTS application_next_steps_own ON public.application_next_steps;
CREATE POLICY application_next_steps_own ON public.application_next_steps
  FOR ALL TO authenticated
  USING (applicant_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.job_applications a
    WHERE a.id = application_id AND a.applicant_id = auth.uid()
  ))
  WITH CHECK (applicant_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.job_applications a
    WHERE a.id = application_id AND a.applicant_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION public.touch_application_next_steps()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS application_next_steps_touch ON public.application_next_steps;
CREATE TRIGGER application_next_steps_touch BEFORE UPDATE ON public.application_next_steps
FOR EACH ROW EXECUTE FUNCTION public.touch_application_next_steps();
REVOKE ALL ON FUNCTION public.touch_application_next_steps() FROM PUBLIC, anon, authenticated;
