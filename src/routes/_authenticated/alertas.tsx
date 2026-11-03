import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { getRegionalCities, type RegionalCity } from "@/services/api";

const categories = ["Administração", "Contabilidade", "Tecnologia", "Saúde", "Direito", "Comércio", "Atendimento"];

export const Route = createFileRoute("/_authenticated/alertas")({
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id).maybeSingle();
    if (data?.role !== "visitor") throw redirect({ to: "/cadastro" });
  },
  head: () => ({ meta: [{ title: "Alertas de vagas — CONECTA UNIS" }, { name: "description", content: "Escolha as áreas e cidades para receber alertas de vagas." }] }),
  component: JobAlertsPage,
});

async function loadPreferences() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre na sua conta para configurar alertas.");
  const [prefs, cities] = await Promise.all([
    supabase.from("student_job_alert_preferences").select("categories,cities,enabled").eq("user_id", auth.user.id).maybeSingle(),
    getRegionalCities(),
  ]);
  if (prefs.error) throw prefs.error;
  return { userId: auth.user.id, preferences: prefs.data, cities };
}

function AlertsForm({ userId, preferences, cities }: { userId: string; preferences: { categories: string[]; cities: string[]; enabled: boolean } | null; cities: RegionalCity[] }) {
  const queryClient = useQueryClient();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(preferences?.categories ?? []);
  const [selectedCities, setSelectedCities] = useState<string[]>(preferences?.cities ?? []);
  const [enabled, setEnabled] = useState(preferences?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  function toggle(value: string, values: string[], setter: (next: string[]) => void) {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedCities.length === 0) return void toast.error("Selecione ao menos uma cidade.");
    setSaving(true);
    const { error } = await supabase.from("student_job_alert_preferences").upsert({ user_id: userId, categories: selectedCategories, cities: selectedCities, enabled }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return void toast.error("Não foi possível salvar seus alertas. Verifique se a migração foi aplicada.");
    await queryClient.invalidateQueries({ queryKey: ["job-alert-preferences"] });
    toast.success("Preferências de alerta salvas.");
  }

  return <form onSubmit={save} className="space-y-8 rounded-xl border bg-card p-5 shadow-card sm:p-7">
    <section>
      <h2 className="font-bold">Áreas de interesse</h2>
      <p className="mt-1 text-sm text-muted-foreground">Se não escolher áreas, você receberá vagas de todas elas nas cidades selecionadas.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {categories.map((category) => <label key={category} className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-sm"><input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggle(category, selectedCategories, setSelectedCategories)} />{category}</label>)}
      </div>
    </section>
    <section>
      <h2 className="font-bold">Cidades para buscar</h2>
      <p className="mt-1 text-sm text-muted-foreground">Escolha uma ou mais cidades. As vagas num raio de até 20 km das cidades selecionadas também serão consideradas.</p>
      <div className="mt-4 grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
        {cities.length === 0 ? <p className="rounded-md border border-warning/30 bg-warning-soft p-3 text-sm">A lista regional ainda não foi carregada. Seus alertas poderão ser configurados assim que a migração com as cidades for concluída.</p> : cities.map(({ city, is_sre_caxambu }) => <label key={city} className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-sm"><input type="checkbox" checked={selectedCities.includes(city)} onChange={() => toggle(city, selectedCities, setSelectedCities)} /><span>{city}<span className="ml-1 text-xs text-muted-foreground">{is_sre_caxambu ? "SRE Caxambu" : "até 20 km"}</span></span></label>)}
      </div>
    </section>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />Receber notificações de novas vagas correspondentes</label>
    <Button type="submit" disabled={saving || cities.length === 0}>{saving ? "Salvando…" : "Salvar preferências"}</Button>
  </form>;
}

function JobAlertsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["job-alert-preferences"], queryFn: loadPreferences });
  return <>
    <PageHeader eyebrow="Para você" title="Alertas de vagas" description="Receba avisos quando uma oportunidade combinar com suas áreas e cidades de interesse." />
    <div className="container-page max-w-3xl py-8">
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando preferências…</p> : isError || !data ? <div role="alert" className="rounded-lg border p-5"><p>Não foi possível carregar as preferências. Confira se a migração de alertas já foi aplicada no Supabase.</p></div> : <AlertsForm key={data.userId} userId={data.userId} preferences={data.preferences} cities={data.cities} />}
    </div>
  </>;
}
