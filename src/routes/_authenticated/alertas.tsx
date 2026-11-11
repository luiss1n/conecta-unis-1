import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { NafSupport } from "@/components/admin/NafSupport";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole, getRegionalCities, type RegionalCity } from "@/services/api";

const categories = ["Administração", "Contabilidade", "Tecnologia", "Saúde", "Direito", "Comércio", "Atendimento"];

export const Route = createFileRoute("/_authenticated/alertas")({
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/auth" });
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id).maybeSingle();
    if (error || !data?.role) throw redirect({ to: "/cadastro" });
  },
  head: () => ({ meta: [{ title: "Alertas de vagas — CONECTA UNIS" }, { name: "description", content: "Escolha as áreas e cidades para receber alertas de vagas." }] }),
  component: JobAlertsPage,
});

async function loadPreferences() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre na sua conta para configurar alertas.");
  const { data: roleRow, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id).maybeSingle();
  if (roleError || !roleRow?.role) throw new Error("Complete seu cadastro para configurar notificações.");
  const isStudent = roleRow.role === "visitor";
  const [prefs, notifications, cities] = await Promise.all([
    isStudent ? supabase.from("student_job_alert_preferences").select("categories,cities,enabled").eq("user_id", auth.user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabase.from("notification_preferences").select("platform_posts,application_updates,messages,event_registrations").eq("user_id", auth.user.id).maybeSingle(),
    isStudent ? getRegionalCities() : Promise.resolve([] as RegionalCity[]),
  ]);
  if (prefs.error) throw prefs.error;
  if (notifications.error) throw notifications.error;
  return { userId: auth.user.id, isStudent, preferences: prefs.data, notifications: notifications.data, cities };
}

type NotificationPreferences = { platform_posts: boolean; application_updates: boolean; messages: boolean; event_registrations: boolean };

function AlertsForm({ userId, isStudent, preferences, notifications, cities }: { userId: string; isStudent: boolean; preferences: { categories: string[]; cities: string[]; enabled: boolean } | null; notifications: NotificationPreferences | null; cities: RegionalCity[] }) {
  const queryClient = useQueryClient();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(preferences?.categories ?? []);
  const [selectedCities, setSelectedCities] = useState<string[]>(preferences?.cities ?? []);
  const [enabled, setEnabled] = useState(preferences?.enabled ?? true);
  const [notificationTypes, setNotificationTypes] = useState<NotificationPreferences>(notifications ?? { platform_posts: true, application_updates: true, messages: true, event_registrations: true });
  const [saving, setSaving] = useState(false);

  function toggle(value: string, values: string[], setter: (next: string[]) => void) {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isStudent && selectedCities.length === 0) return void toast.error("Selecione ao menos uma cidade.");
    setSaving(true);
    try {
      const [jobResult, notificationResult] = await Promise.all([
        isStudent ? supabase.from("student_job_alert_preferences").upsert({ user_id: userId, categories: selectedCategories, cities: selectedCities, enabled }, { onConflict: "user_id" }) : Promise.resolve({ error: null }),
        supabase.from("notification_preferences").upsert({ user_id: userId, ...notificationTypes, updated_at: new Date().toISOString() }, { onConflict: "user_id" }),
      ]);
      if (jobResult.error || notificationResult.error) return void toast.error("Não foi possível salvar suas preferências. Verifique se a migration foi aplicada.");
      await queryClient.invalidateQueries({ queryKey: ["job-alert-preferences"] });
      toast.success("Preferências de alerta salvas.");
    } catch {
      toast.error("Não foi possível salvar suas preferências. Verifique sua conexão e tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={save} className="space-y-8 rounded-xl border bg-card p-5 shadow-card sm:p-7">
    {isStudent && <section>
      <h2 className="font-bold">Áreas de interesse</h2>
      <p className="mt-1 text-sm text-muted-foreground">Se não escolher áreas, você receberá vagas de todas elas nas cidades selecionadas.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {categories.map((category) => <label key={category} className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-sm"><input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggle(category, selectedCategories, setSelectedCategories)} />{category}</label>)}
      </div>
    </section>}
    {isStudent && <section>
      <h2 className="font-bold">Cidades para buscar</h2>
      <p className="mt-1 text-sm text-muted-foreground">Escolha uma ou mais cidades. As vagas num raio de até 20 km das cidades selecionadas também serão consideradas.</p>
      <div className="mt-4 grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
        {cities.length === 0 ? <p className="rounded-md border border-warning/30 bg-warning-soft p-3 text-sm">A lista regional ainda não foi carregada. Seus alertas poderão ser configurados assim que a migração com as cidades for concluída.</p> : cities.map(({ city, is_sre_caxambu }) => <label key={city} className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-sm"><input type="checkbox" checked={selectedCities.includes(city)} onChange={() => toggle(city, selectedCities, setSelectedCities)} /><span>{city}<span className="ml-1 text-xs text-muted-foreground">{is_sre_caxambu ? "SRE Caxambu" : "até 20 km"}</span></span></label>)}
      </div>
    </section>}
    {isStudent && <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />Receber notificações de novas vagas correspondentes</label>}
    <section className="space-y-2">
      <h2 className="font-bold">Outras notificações</h2>
      {([ ["platform_posts", "Novas vagas e eventos publicados"], ["application_updates", "Candidaturas recebidas e mudanças de status"], ["messages", "Novas mensagens nas conversas"], ["event_registrations", "Inscrições nos meus eventos"] ] as const).map(([key, label]) => <label key={key} className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-sm"><input type="checkbox" checked={notificationTypes[key]} onChange={(event) => setNotificationTypes((current) => ({ ...current, [key]: event.target.checked }))} />{label}</label>)}
    </section>
    <Button type="submit" disabled={saving || (isStudent && cities.length === 0)}>{saving ? "Salvando…" : "Salvar preferências"}</Button>
  </form>;
}

function JobAlertsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["job-alert-preferences"], queryFn: loadPreferences });
  const role = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  return <>
    <PageHeader eyebrow="Preferências da conta" title="Alertas e notificações" description="Escolha quais avisos você quer receber da plataforma." />
    <div className="container-page max-w-3xl py-8">
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando preferências…</p> : isError || !data ? <div role="alert" className="rounded-lg border p-5"><p>Não foi possível carregar as preferências. Confira se as migrations de alertas já foram aplicadas no Supabase.</p></div> : <AlertsForm key={data.userId} userId={data.userId} isStudent={data.isStudent} preferences={data.preferences} notifications={data.notifications} cities={data.cities} />}
      {(role.data === "company" || role.data === "visitor") && <div className="mt-8"><NafSupport /></div>}
    </div>
  </>;
}
