CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 100),
 username text NOT NULL DEFAULT '' CHECK (char_length(username) <= 50),
 phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 30),
 city text NOT NULL DEFAULT '' CHECK (char_length(city) <= 100),
 bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 2000),
 avatar_path text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_own ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE UNIQUE INDEX profiles_username_unique ON public.profiles (lower(username)) WHERE username <> '';

CREATE TYPE public.app_role AS ENUM ('company', 'professor');
CREATE TABLE public.user_roles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 role public.app_role NOT NULL
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_read_own ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE TABLE public.companies (
 slug text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 owner_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 150),
 sector text NOT NULL CHECK (char_length(sector) BETWEEN 2 AND 100),
 city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 100),
 summary text NOT NULL DEFAULT '' CHECK (char_length(summary) <= 500),
 about text NOT NULL DEFAULT '' CHECK (char_length(about) <= 5000),
 initials text NOT NULL DEFAULT '',
 tone text NOT NULL DEFAULT 'blue',
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO anon;
GRANT SELECT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_public ON public.companies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY companies_update_own ON public.companies FOR UPDATE TO authenticated USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'company')) WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'company'));
CREATE TABLE public.company_details (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 legal_name text NOT NULL CHECK (char_length(legal_name) BETWEEN 2 AND 150),
 cnpj text NOT NULL CHECK (cnpj ~ '^[0-9]{14}$'),
 website text NOT NULL DEFAULT '' CHECK (char_length(website) <= 300)
);
GRANT SELECT ON public.company_details TO authenticated;
GRANT ALL ON public.company_details TO service_role;
ALTER TABLE public.company_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_details_own ON public.company_details FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.professor_details (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 institution text NOT NULL CHECK (char_length(institution) BETWEEN 2 AND 150),
 department text NOT NULL CHECK (char_length(department) BETWEEN 2 AND 150),
 subjects text NOT NULL CHECK (char_length(subjects) BETWEEN 2 AND 500),
 qualification text NOT NULL CHECK (char_length(qualification) BETWEEN 2 AND 150)
);
GRANT SELECT ON public.professor_details TO authenticated;
GRANT ALL ON public.professor_details TO service_role;
ALTER TABLE public.professor_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY professor_details_own ON public.professor_details FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE FUNCTION public.create_account_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles(id, display_name) VALUES (NEW.id, left(coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', ''), 100)); RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.create_account_profile() FROM PUBLIC;
CREATE TRIGGER account_profile_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_account_profile();

CREATE FUNCTION public.save_registration(payload jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); chosen public.app_role; existing public.app_role;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 chosen := (payload->>'kind')::public.app_role;
 IF chosen IS NULL THEN RAISE EXCEPTION 'Account type required'; END IF;
 SELECT role INTO existing FROM public.user_roles WHERE user_id = uid;
 IF existing IS NOT NULL AND existing <> chosen THEN RAISE EXCEPTION 'Account type cannot be changed'; END IF;
 IF char_length(trim(payload->>'display_name')) NOT BETWEEN 2 AND 100 OR char_length(trim(payload->>'username')) NOT BETWEEN 3 AND 50 OR (payload->>'username') !~ '^[a-zA-Z0-9_]+$' OR char_length(trim(payload->>'city')) NOT BETWEEN 2 AND 100 OR char_length(coalesce(payload->>'phone','')) > 30 OR char_length(coalesce(payload->>'bio','')) > 2000 THEN RAISE EXCEPTION 'Invalid profile'; END IF;
 UPDATE public.profiles SET display_name=trim(payload->>'display_name'), username=trim(payload->>'username'), city=trim(payload->>'city'), phone=coalesce(payload->>'phone',''), bio=coalesce(payload->>'bio','') WHERE id=uid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile missing'; END IF;
 INSERT INTO public.user_roles(user_id,role) VALUES(uid,chosen) ON CONFLICT(user_id) DO NOTHING;
 IF chosen='company' THEN
  IF char_length(coalesce(payload->>'website','')) > 300 OR ((payload->>'website') <> '' AND (payload->>'website') !~ '^https?://') THEN RAISE EXCEPTION 'Invalid website'; END IF;
  INSERT INTO public.companies(owner_id,name,sector,city,summary,about,initials) VALUES(uid,trim(payload->>'company_name'),trim(payload->>'sector'),trim(payload->>'city'),coalesce(payload->>'summary',''),coalesce(payload->>'bio',''),upper(left(payload->>'company_name',2))) ON CONFLICT(owner_id) DO UPDATE SET name=EXCLUDED.name,sector=EXCLUDED.sector,city=EXCLUDED.city,summary=EXCLUDED.summary,about=EXCLUDED.about,initials=EXCLUDED.initials;
  INSERT INTO public.company_details(user_id,legal_name,cnpj,website) VALUES(uid,trim(payload->>'legal_name'),payload->>'cnpj',coalesce(payload->>'website','')) ON CONFLICT(user_id) DO UPDATE SET legal_name=EXCLUDED.legal_name,cnpj=EXCLUDED.cnpj,website=EXCLUDED.website;
 ELSE
  INSERT INTO public.professor_details(user_id,institution,department,subjects,qualification) VALUES(uid,trim(payload->>'institution'),trim(payload->>'department'),trim(payload->>'subjects'),trim(payload->>'qualification')) ON CONFLICT(user_id) DO UPDATE SET institution=EXCLUDED.institution,department=EXCLUDED.department,subjects=EXCLUDED.subjects,qualification=EXCLUDED.qualification;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.save_registration(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_registration(jsonb) TO authenticated;

CREATE TABLE public.jobs (
 slug text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 "companySlug" text NOT NULL REFERENCES public.companies(slug),
 title text NOT NULL CHECK(char_length(title) BETWEEN 3 AND 150),
 type text NOT NULL CHECK(type IN ('estagio','emprego')),
 mode text NOT NULL CHECK(mode IN ('presencial','hibrido','remoto')),
 schedule text NOT NULL CHECK(schedule IN ('integral','meio-periodo')),
 category text NOT NULL CHECK(category IN ('Administração','Contabilidade','Tecnologia','Saúde','Direito','Comércio','Atendimento')),
 city text NOT NULL CHECK(char_length(city) BETWEEN 2 AND 100),
 summary text NOT NULL CHECK(char_length(summary) BETWEEN 3 AND 500),
 description text NOT NULL CHECK(char_length(description) BETWEEN 3 AND 10000),
 activities text[] NOT NULL DEFAULT '{}', requirements text[] NOT NULL DEFAULT '{}', benefits text[] NOT NULL DEFAULT '{}',
 salary text CHECK(char_length(salary) <= 100),
 "publishedAt" timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY jobs_public ON public.jobs FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY jobs_insert_own ON public.jobs FOR INSERT TO authenticated WITH CHECK(owner_id=auth.uid() AND public.has_role(auth.uid(),'company') AND EXISTS(SELECT 1 FROM public.companies c WHERE c.slug="companySlug" AND c.owner_id=auth.uid()));
CREATE POLICY jobs_update_own ON public.jobs FOR UPDATE TO authenticated USING(owner_id=auth.uid() AND public.has_role(auth.uid(),'company')) WITH CHECK(owner_id=auth.uid() AND public.has_role(auth.uid(),'company') AND EXISTS(SELECT 1 FROM public.companies c WHERE c.slug="companySlug" AND c.owner_id=auth.uid()));
CREATE POLICY jobs_delete_own ON public.jobs FOR DELETE TO authenticated USING(owner_id=auth.uid() AND public.has_role(auth.uid(),'company'));
CREATE TABLE public.events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 title text NOT NULL CHECK(char_length(title) BETWEEN 3 AND 150),
 date timestamptz NOT NULL,
 "endTime" text NOT NULL CHECK("endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 location text NOT NULL CHECK(char_length(location) BETWEEN 2 AND 300),
 mode text NOT NULL CHECK(mode IN ('Presencial','Online')),
 category text NOT NULL CHECK(category IN ('Workshop','Feira','Palestra','Oficina')),
 summary text NOT NULL CHECK(char_length(summary) BETWEEN 3 AND 500),
 description text NOT NULL CHECK(char_length(description) BETWEEN 3 AND 10000)
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_public ON public.events FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY events_insert_own ON public.events FOR INSERT TO authenticated WITH CHECK(owner_id=auth.uid() AND public.has_role(auth.uid(),'professor'));
CREATE POLICY events_update_own ON public.events FOR UPDATE TO authenticated USING(owner_id=auth.uid() AND public.has_role(auth.uid(),'professor')) WITH CHECK(owner_id=auth.uid() AND public.has_role(auth.uid(),'professor'));
CREATE POLICY events_delete_own ON public.events FOR DELETE TO authenticated USING(owner_id=auth.uid() AND public.has_role(auth.uid(),'professor'));
CREATE TABLE public.event_interests (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,event_id)
);
GRANT SELECT,INSERT,DELETE ON public.event_interests TO authenticated;
GRANT ALL ON public.event_interests TO service_role;
ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY interest_own ON public.event_interests FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY interest_insert ON public.event_interests FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE POLICY interest_delete ON public.event_interests FOR DELETE TO authenticated USING(user_id=auth.uid());