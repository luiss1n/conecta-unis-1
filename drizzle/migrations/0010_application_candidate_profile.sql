-- Permite que participantes da candidatura consultem apenas o perfil profissional do candidato.
CREATE OR REPLACE FUNCTION public.get_application_candidate_profile(_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  candidate jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'username', p.username,
    'email', a.applicant_email,
    'headline', p.headline,
    'education', COALESCE(NULLIF(p.education, ''), a.applicant_education),
    'institution', COALESCE(NULLIF(p.institution, ''), a.applicant_institution),
    'city', COALESCE(NULLIF(p.city, ''), a.applicant_city),
    'bio', p.bio,
    'avatar_path', p.avatar_path,
    'google_avatar_url', COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
  )
  INTO candidate
  FROM public.job_applications a
  JOIN public.profiles p ON p.id = a.applicant_id
  JOIN auth.users u ON u.id = p.id
  WHERE a.id = _application_id
    AND (a.applicant_id = uid OR EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.slug = a.job_slug AND j.owner_id = uid
    ));

  IF candidate IS NULL THEN RAISE EXCEPTION 'Application not found or access denied'; END IF;
  RETURN candidate;
END;
$$;
REVOKE ALL ON FUNCTION public.get_application_candidate_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_application_candidate_profile(uuid) TO authenticated;

-- Imagens de avatar ficam no mesmo bucket privado; a policy só libera os objetos avatar-*
-- do candidato relacionado a uma candidatura em que o usuário atual participa.
DROP POLICY IF EXISTS candidate_avatars_read_by_application_participants ON storage.objects;
CREATE POLICY candidate_avatars_read_by_application_participants
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND split_part(name, '/', 2) LIKE 'avatar-%'
  AND EXISTS (
    SELECT 1
    FROM public.job_applications a
    JOIN public.jobs j ON j.slug = a.job_slug
    WHERE a.applicant_id::text = split_part(name, '/', 1)
      AND (a.applicant_id = auth.uid() OR j.owner_id = auth.uid())
  )
);
