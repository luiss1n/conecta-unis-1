ALTER TABLE public.profiles ADD COLUMN address text NOT NULL DEFAULT '', ADD COLUMN state text NOT NULL DEFAULT '', ADD COLUMN country text NOT NULL DEFAULT 'Brasil', ADD COLUMN headline text NOT NULL DEFAULT '', ADD COLUMN education text NOT NULL DEFAULT '', ADD COLUMN institution text NOT NULL DEFAULT '', ADD COLUMN banner_path text NOT NULL DEFAULT '', ADD COLUMN resume_path text NOT NULL DEFAULT '', ADD COLUMN resume_name text NOT NULL DEFAULT '';
CREATE OR REPLACE FUNCTION public.validate_profile_fields() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF char_length(NEW.display_name)>100 OR char_length(NEW.address)>250 OR char_length(NEW.state)>100 OR char_length(NEW.country)>100 OR char_length(NEW.headline)>160 OR char_length(NEW.education)>160 OR char_length(NEW.institution)>160 OR char_length(NEW.city)>100 OR char_length(NEW.bio)>2000 OR char_length(NEW.phone)>30 OR char_length(NEW.resume_name)>200 THEN RAISE EXCEPTION 'Invalid profile fields'; END IF;
 IF (NEW.avatar_path<>'' AND NEW.avatar_path NOT LIKE NEW.id::text || '/%') OR (NEW.banner_path<>'' AND NEW.banner_path NOT LIKE NEW.id::text || '/%') OR (NEW.resume_path<>'' AND NEW.resume_path NOT LIKE NEW.id::text || '/%') THEN RAISE EXCEPTION 'Invalid file owner'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER validate_profile_before_write BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_profile_fields();
CREATE POLICY profile_files_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='profile-photos' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY profile_files_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='profile-photos' AND (storage.foldername(name))[1]=auth.uid()::text AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','pdf'));
CREATE POLICY profile_files_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id='profile-photos' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE OR REPLACE FUNCTION public.save_registration(payload jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); chosen public.app_role; existing public.app_role;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 chosen := (payload->>'kind')::public.app_role;
 IF chosen IS NULL THEN RAISE EXCEPTION 'Account type required'; END IF;
 SELECT role INTO existing FROM public.user_roles WHERE user_id=uid;
 IF existing IS NOT NULL AND existing<>chosen THEN RAISE EXCEPTION 'Account type cannot be changed'; END IF;
 IF coalesce(char_length(trim(payload->>'display_name')),0) NOT BETWEEN 2 AND 100 OR coalesce(char_length(trim(payload->>'username')),0) NOT BETWEEN 3 AND 50 OR coalesce(payload->>'username','') !~ '^[a-zA-Z0-9_]+$' OR coalesce(char_length(trim(payload->>'city')),0) NOT BETWEEN 2 AND 100 OR char_length(coalesce(payload->>'phone',''))>30 OR char_length(coalesce(payload->>'bio',''))>2000 THEN RAISE EXCEPTION 'Invalid profile'; END IF;
 IF chosen='company' AND (coalesce(char_length(trim(payload->>'company_name')),0) NOT BETWEEN 2 AND 120 OR coalesce(char_length(trim(payload->>'legal_name')),0) NOT BETWEEN 2 AND 160 OR coalesce(payload->>'cnpj','') !~ '^[0-9]{14}$' OR coalesce(char_length(trim(payload->>'sector')),0) NOT BETWEEN 2 AND 100 OR char_length(coalesce(payload->>'website',''))>300 OR (coalesce(payload->>'website','')<>'' AND payload->>'website' !~ '^https?://')) THEN RAISE EXCEPTION 'Invalid company'; END IF;
 IF chosen='professor' AND (coalesce(char_length(trim(payload->>'institution')),0) NOT BETWEEN 2 AND 160 OR coalesce(char_length(trim(payload->>'department')),0) NOT BETWEEN 2 AND 160 OR coalesce(char_length(trim(payload->>'subjects')),0) NOT BETWEEN 2 AND 500 OR coalesce(char_length(trim(payload->>'qualification')),0) NOT BETWEEN 2 AND 160) THEN RAISE EXCEPTION 'Invalid professor'; END IF;
 UPDATE public.profiles SET display_name=trim(payload->>'display_name'),username=trim(payload->>'username'),city=trim(payload->>'city'),phone=coalesce(payload->>'phone',''),bio=coalesce(payload->>'bio','') WHERE id=uid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile missing'; END IF;
 INSERT INTO public.user_roles(user_id,role) VALUES(uid,chosen) ON CONFLICT(user_id) DO NOTHING;
 IF chosen='company' THEN
 INSERT INTO public.companies(owner_id,name,sector,city,summary,about,initials) VALUES(uid,trim(payload->>'company_name'),trim(payload->>'sector'),trim(payload->>'city'),coalesce(payload->>'summary',''),coalesce(payload->>'bio',''),upper(left(payload->>'company_name',2))) ON CONFLICT(owner_id) DO UPDATE SET name=EXCLUDED.name,sector=EXCLUDED.sector,city=EXCLUDED.city,summary=EXCLUDED.summary,about=EXCLUDED.about,initials=EXCLUDED.initials;
 INSERT INTO public.company_details(user_id,legal_name,cnpj,website) VALUES(uid,trim(payload->>'legal_name'),payload->>'cnpj',coalesce(payload->>'website','')) ON CONFLICT(user_id) DO UPDATE SET legal_name=EXCLUDED.legal_name,cnpj=EXCLUDED.cnpj,website=EXCLUDED.website;
 ELSIF chosen='professor' THEN
 INSERT INTO public.professor_details(user_id,institution,department,subjects,qualification) VALUES(uid,trim(payload->>'institution'),trim(payload->>'department'),trim(payload->>'subjects'),trim(payload->>'qualification')) ON CONFLICT(user_id) DO UPDATE SET institution=EXCLUDED.institution,department=EXCLUDED.department,subjects=EXCLUDED.subjects,qualification=EXCLUDED.qualification;
 END IF;
END; $$;