CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF char_length(NEW.display_name)>100 OR char_length(NEW.address)>250 OR char_length(NEW.state)>100 OR char_length(NEW.country)>100 OR char_length(NEW.headline)>160 OR char_length(NEW.education)>160 OR char_length(NEW.institution)>160 OR char_length(NEW.city)>100 OR char_length(NEW.bio)>2000 OR char_length(NEW.resume_name)>200 OR char_length(NEW.phone)>30 THEN
    RAISE EXCEPTION 'Invalid profile fields';
  END IF;
  IF (NEW.avatar_path<>'' AND NEW.avatar_path NOT LIKE NEW.id::text || '/%') OR (NEW.banner_path<>'' AND NEW.banner_path NOT LIKE NEW.id::text || '/%') OR (NEW.resume_path<>'' AND NEW.resume_path NOT LIKE NEW.id::text || '/%') THEN
    RAISE EXCEPTION 'Invalid file owner';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_registration(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  chosen public.app_role;
  existing public.app_role;
  chosen_username text;
  phone_value text;
  company_name_value text;
  legal_name_value text;
  cnpj_value text;
  sector_value text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  chosen := (payload->>'kind')::public.app_role;
  IF chosen IS NULL OR chosen = 'admin' THEN RAISE EXCEPTION 'Account type not allowed'; END IF;
  SELECT role INTO existing FROM public.user_roles WHERE user_id = uid;
  IF existing IS NOT NULL AND existing <> chosen THEN RAISE EXCEPTION 'Account type cannot be changed'; END IF;

  chosen_username := lower(normalize(trim(coalesce(payload->>'username','')), NFC));
  phone_value := left(coalesce(payload->>'phone',''), 30);
  IF chosen_username !~ '^[[:alnum:][:punct:]]{3,25}$'
     OR chosen_username !~ '[[:alnum:]]'
     OR coalesce(char_length(trim(payload->>'display_name')),0) NOT BETWEEN 1 AND 100
     OR coalesce(char_length(trim(payload->>'city')),0) NOT BETWEEN 1 AND 100
     OR char_length(coalesce(payload->>'bio','')) > 2000 THEN
    RAISE EXCEPTION 'Invalid profile';
  END IF;

  UPDATE public.profiles
  SET display_name=left(trim(payload->>'display_name'),100), username=chosen_username,
      city=left(trim(payload->>'city'),100), phone=phone_value, bio=left(coalesce(payload->>'bio',''),2000)
  WHERE id=uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile missing'; END IF;
  INSERT INTO public.user_roles(user_id,role) VALUES(uid,chosen) ON CONFLICT(user_id) DO NOTHING;

  IF chosen='company' THEN
    company_name_value := left(coalesce(nullif(trim(payload->>'company_name'),''),'Empresa de teste'),120);
    legal_name_value := left(coalesce(nullif(trim(payload->>'legal_name'),''),company_name_value),150);
    cnpj_value := regexp_replace(coalesce(payload->>'cnpj',''),'[^0-9]','','g');
    cnpj_value := left(cnpj_value || repeat('0',14),14);
    sector_value := left(coalesce(nullif(trim(payload->>'sector'),''),'Geral'),100);

    INSERT INTO public.companies(owner_id,name,sector,city,summary,about,initials)
    VALUES(uid,company_name_value,sector_value,left(coalesce(nullif(trim(payload->>'city'),''),'Brasil'),100),coalesce(payload->>'summary',''),coalesce(payload->>'bio',''),upper(left(company_name_value,2)))
    ON CONFLICT(owner_id) DO UPDATE SET name=EXCLUDED.name,sector=EXCLUDED.sector,city=EXCLUDED.city,summary=EXCLUDED.summary,about=EXCLUDED.about,initials=EXCLUDED.initials;

    INSERT INTO public.company_details(user_id,legal_name,cnpj,website)
    VALUES(uid,legal_name_value,cnpj_value,left(coalesce(payload->>'website',''),300))
    ON CONFLICT(user_id) DO UPDATE SET legal_name=EXCLUDED.legal_name,cnpj=EXCLUDED.cnpj,website=EXCLUDED.website;
  ELSIF chosen='professor' THEN
    IF coalesce(char_length(trim(payload->>'institution')),0) NOT BETWEEN 2 AND 150
       OR coalesce(char_length(trim(payload->>'department')),0) NOT BETWEEN 2 AND 150
       OR coalesce(char_length(trim(payload->>'subjects')),0) NOT BETWEEN 2 AND 500
       OR coalesce(char_length(trim(payload->>'qualification')),0) NOT BETWEEN 2 AND 150 THEN
      RAISE EXCEPTION 'Invalid professor';
    END IF;
    INSERT INTO public.professor_details(user_id,institution,department,subjects,qualification)
    VALUES(uid,trim(payload->>'institution'),trim(payload->>'department'),trim(payload->>'subjects'),trim(payload->>'qualification'))
    ON CONFLICT(user_id) DO UPDATE SET institution=EXCLUDED.institution,department=EXCLUDED.department,subjects=EXCLUDED.subjects,qualification=EXCLUDED.qualification;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.save_registration(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_registration(jsonb) TO authenticated;
