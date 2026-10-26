-- Tipo de conta escolhido no cadastro vira o papel automaticamente.
-- O front envia options.data.account_type no signUp; aqui só valores permitidos são aceitos
-- ('admin' NUNCA vem do cadastro). Sem valor (ex.: login com Google), a pessoa escolhe em /cadastro.
CREATE OR REPLACE FUNCTION public.create_account_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE chosen text := NEW.raw_user_meta_data->>'account_type';
BEGIN
  INSERT INTO public.profiles(id, display_name) VALUES (NEW.id, left(coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', ''), 100));
  IF chosen IN ('company', 'professor', 'visitor') THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, chosen::public.app_role) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
