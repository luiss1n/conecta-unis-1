-- Candidaturas reais, inscricoes em eventos e conversas privadas entre candidato e anunciante.

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_slug text NOT NULL REFERENCES public.jobs(slug) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  applicant_name text NOT NULL CHECK (char_length(applicant_name) BETWEEN 2 AND 100),
  applicant_email text NOT NULL CHECK (char_length(applicant_email) <= 255),
  applicant_phone text NOT NULL DEFAULT '' CHECK (char_length(applicant_phone) <= 30),
  applicant_headline text NOT NULL DEFAULT '' CHECK (char_length(applicant_headline) <= 160),
  applicant_education text NOT NULL DEFAULT '' CHECK (char_length(applicant_education) <= 160),
  applicant_institution text NOT NULL DEFAULT '' CHECK (char_length(applicant_institution) <= 160),
  applicant_city text NOT NULL DEFAULT '' CHECK (char_length(applicant_city) <= 100),
  applicant_resume_path text NOT NULL DEFAULT '',
  applicant_resume_name text NOT NULL DEFAULT '' CHECK (char_length(applicant_resume_name) <= 200),
  cover_message text NOT NULL DEFAULT '' CHECK (char_length(cover_message) <= 2000),
  consent_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','reviewing','interview','closed','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_slug, applicant_id)
);
CREATE INDEX job_applications_applicant_created_idx ON public.job_applications (applicant_id, created_at DESC);
CREATE INDEX job_applications_job_created_idx ON public.job_applications (job_slug, created_at DESC);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_applications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.job_applications TO authenticated;
CREATE POLICY job_applications_participant_read ON public.job_applications
  FOR SELECT TO authenticated
  USING (
    applicant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.slug = job_slug AND j.owner_id = auth.uid())
  );

CREATE TABLE public.application_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX application_messages_thread_created_idx ON public.application_messages (application_id, created_at);
ALTER TABLE public.application_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.application_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.application_messages TO authenticated;
CREATE POLICY application_messages_participant_read ON public.application_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.job_applications a WHERE a.id = application_id));
CREATE POLICY application_messages_participant_send ON public.application_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND char_length(trim(body)) BETWEEN 1 AND 4000
    AND EXISTS (
      SELECT 1 FROM public.job_applications a
      WHERE a.id = application_id AND a.status NOT IN ('closed','withdrawn')
    )
  );

-- The candidate explicitly consents in the UI; the function snapshots only the fields
-- shown to the publisher and never exposes the private profile row to that publisher.
CREATE OR REPLACE FUNCTION public.submit_job_application(
  _job_slug text,
  _consent boolean,
  _cover_message text DEFAULT ''
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  applicant public.profiles%ROWTYPE;
  applicant_role public.app_role;
  applicant_email text;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _consent IS DISTINCT FROM true THEN RAISE EXCEPTION 'Candidate consent is required'; END IF;
  IF char_length(trim(coalesce(_cover_message, ''))) > 2000 THEN RAISE EXCEPTION 'Message is too long'; END IF;
  SELECT role INTO applicant_role FROM public.user_roles WHERE user_id = uid;
  IF applicant_role IS NULL OR applicant_role NOT IN ('visitor', 'professor') THEN RAISE EXCEPTION 'This account cannot apply'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.jobs WHERE slug = _job_slug) THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF EXISTS (SELECT 1 FROM public.jobs WHERE slug = _job_slug AND owner_id = uid) THEN RAISE EXCEPTION 'You cannot apply to your own job'; END IF;
  SELECT * INTO applicant FROM public.profiles WHERE id = uid;
  SELECT email INTO applicant_email FROM auth.users WHERE id = uid;
  IF applicant.display_name IS NULL OR char_length(trim(applicant.display_name)) < 2 OR coalesce(applicant_email, '') = '' THEN
    RAISE EXCEPTION 'Complete your profile before applying';
  END IF;
  INSERT INTO public.job_applications (
    job_slug, applicant_id, applicant_name, applicant_email, applicant_phone,
    applicant_headline, applicant_education, applicant_institution, applicant_city,
    applicant_resume_path, applicant_resume_name, cover_message, consent_at
  ) VALUES (
    _job_slug, uid, applicant.display_name, applicant_email, applicant.phone,
    applicant.headline, applicant.education, applicant.institution, applicant.city,
    applicant.resume_path, applicant.resume_name, trim(coalesce(_cover_message, '')), now()
  ) RETURNING id INTO new_id;
  RETURN new_id;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'You have already applied to this job';
END;
$$;
REVOKE ALL ON FUNCTION public.submit_job_application(text, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_job_application(text, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_job_application_status(_application_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  application_applicant uuid;
  job_owner uuid;
  current_status text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _status IS NULL OR _status NOT IN ('received','reviewing','interview','closed','withdrawn') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT a.applicant_id, j.owner_id, a.status INTO application_applicant, job_owner, current_status
  FROM public.job_applications a JOIN public.jobs j ON j.slug = a.job_slug
  WHERE a.id = _application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF application_applicant = uid THEN
    IF _status <> 'withdrawn' THEN RAISE EXCEPTION 'Candidates may only withdraw an application'; END IF;
    IF current_status IN ('closed','withdrawn') THEN RAISE EXCEPTION 'Application is already closed'; END IF;
  ELSIF job_owner = uid THEN
    IF _status = 'withdrawn' THEN RAISE EXCEPTION 'Only the candidate may withdraw'; END IF;
  ELSE
    RAISE EXCEPTION 'Not allowed';
  END IF;
  UPDATE public.job_applications SET status = _status, updated_at = now() WHERE id = _application_id;
END;
$$;
REVOKE ALL ON FUNCTION public.update_job_application_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_job_application_status(uuid, text) TO authenticated;

-- Permit a publisher to fetch only the exact resume shared in a related application.
CREATE POLICY profile_files_read_shared_resume ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (
      EXISTS (
        SELECT 1 FROM public.job_applications a
        JOIN public.jobs j ON j.slug = a.job_slug
        WHERE a.applicant_resume_path = name
          AND j.owner_id = auth.uid()
          AND a.status <> 'withdrawn'
      )
    )
  );

-- Professors may publish opportunities under their academic profile, without a company record.
ALTER TABLE public.jobs ALTER COLUMN "companySlug" DROP NOT NULL;
CREATE POLICY jobs_professor_insert_own ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND public.has_role(auth.uid(), 'professor')
    AND "companySlug" IS NULL
    AND publisher_name IS NOT NULL
  );
CREATE POLICY jobs_professor_update_own ON public.jobs
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'professor'))
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'professor') AND "companySlug" IS NULL AND publisher_name IS NOT NULL);
CREATE POLICY jobs_professor_delete_own ON public.jobs
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'professor'));

-- Event signups are persistent and limited to applicant accounts. Organizers can see
-- only registrations for their own events; registrants retain their own list.
DROP POLICY IF EXISTS interest_insert ON public.event_interests;
CREATE POLICY interest_insert ON public.event_interests
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles r
      WHERE r.user_id = auth.uid() AND r.role IN ('visitor','professor')
    )
  );
CREATE POLICY interest_read_event_owner ON public.event_interests
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
