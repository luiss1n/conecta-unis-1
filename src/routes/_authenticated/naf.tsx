import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { NafSupport } from "@/components/admin/NafSupport";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/naf")({
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/auth" });
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id).maybeSingle();
    if (error || !data?.role) throw redirect({ to: "/cadastro" });
    if (!["visitor", "company", "professor"].includes(data.role)) throw redirect({ to: "/admin" });
  },
  head: () => ({ meta: [{ title: "Atendimento NAF — CONECTA UNIS" }] }),
  component: () => <><PageHeader eyebrow="Atendimento" title="Atendimento NAF" description="Abra e acompanhe seus atendimentos com o Núcleo de Carreira e Empregabilidade." /><div className="container-page max-w-3xl py-8"><NafSupport /></div></>,
});
