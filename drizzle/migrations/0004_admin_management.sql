-- Painel de administração: o admin publica e gerencia vagas/eventos sem ser empresa ou professor.
-- Requer a migração 0003 (valor 'admin' no enum app_role) já aplicada.

-- 1) Bucket privado dos arquivos de perfil (a 0002 criou só as policies; o bucket não era criado em lugar nenhum).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', false, 2097152, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 2) Vagas podem ser publicadas sem empresa cadastrada (nome do publicador em texto livre).
ALTER TABLE public.jobs ALTER COLUMN "companySlug" DROP NOT NULL;
ALTER TABLE public.jobs ADD COLUMN publisher_name text CHECK (publisher_name IS NULL OR char_length(publisher_name) BETWEEN 2 AND 150);
ALTER TABLE public.jobs ADD CONSTRAINT jobs_has_publisher CHECK ("companySlug" IS NOT NULL OR publisher_name IS NOT NULL);

-- 3) O admin pode criar, editar e excluir qualquer vaga/evento. As demais policies continuam valendo.
CREATE POLICY jobs_admin_all ON public.jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY events_admin_all ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) SEGURANÇA: ninguém pode virar admin pelo cadastro. Sem isso, kind='admin' no payload seria aceito pelo cast do enum.
CREATE OR REPLACE FUNCTION public.save_registration(payload jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); chosen public.app_role; existing public.app_role;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 chosen := (payload->>'kind')::public.app_role;
 IF chosen IS NULL THEN RAISE EXCEPTION 'Account type required'; END IF;
 IF chosen = 'admin' THEN RAISE EXCEPTION 'Account type not allowed'; END IF;
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