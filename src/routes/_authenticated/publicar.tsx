import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, CalendarDays, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { createEvent, createJob, getMyProfile } from "@/services/api";

export const Route = createFileRoute("/_authenticated/publicar")({
  head: () => ({
    meta: [
      { title: "Publicar — CONECTA UNIS" },
      { name: "description", content: "Publique vagas e eventos para estudantes e egressos da Unis." },
    ],
  }),
  component: PublishPage,
});

const inputCls =
  "mt-1 h-11 w-full rounded-md border bg-surface px-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";
const areaCls =
  "mt-1 w-full rounded-md border bg-surface px-3 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function lines(text: string) {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

function JobForm({ onDone }: { onDone: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", type: "estagio", mode: "presencial", schedule: "integral",
    category: "Tecnologia", city: "", summary: "", description: "",
    activities: "", requirements: "", benefits: "", salary: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 3) { toast.error("Informe um título com pelo menos 3 caracteres."); return; }
    if (!form.city.trim() || !form.summary.trim() || !form.description.trim()) {
      toast.error("Preencha cidade, resumo e descrição."); return;
    }
    setSaving(true);
    try {
      await createJob({
        title: form.title, type: form.type as "estagio" | "emprego",
        mode: form.mode as "presencial" | "hibrido" | "remoto",
        schedule: form.schedule as "integral" | "meio-periodo",
        category: form.category, city: form.city, summary: form.summary, description: form.description,
        activities: lines(form.activities), requirements: lines(form.requirements), benefits: lines(form.benefits),
        salary: form.salary || undefined,
      });
      toast.success("Vaga publicada!");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível publicar a vaga.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <Field label="Título da vaga">
        <input className={inputCls} value={form.title} onChange={set("title")} placeholder="Ex.: Estagiário de Marketing" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <select className={inputCls} value={form.type} onChange={set("type")}>
            <option value="estagio">Estágio</option><option value="emprego">Emprego</option>
          </select>
        </Field>
        <Field label="Modalidade">
          <select className={inputCls} value={form.mode} onChange={set("mode")}>
            <option value="presencial">Presencial</option><option value="hibrido">Híbrido</option><option value="remoto">Remoto</option>
          </select>
        </Field>
        <Field label="Jornada">
          <select className={inputCls} value={form.schedule} onChange={set("schedule")}>
            <option value="integral">Integral</option><option value="meio-periodo">Meio período</option>
          </select>
        </Field>
        <Field label="Área">
          <select className={inputCls} value={form.category} onChange={set("category")}>
            {["Administração", "Contabilidade", "Tecnologia", "Saúde", "Direito", "Comércio", "Atendimento"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Cidade">
          <input className={inputCls} value={form.city} onChange={set("city")} placeholder="Ex.: São Lourenço, MG" />
        </Field>
        <Field label="Salário / bolsa (opcional)">
          <input className={inputCls} value={form.salary} onChange={set("salary")} placeholder="Ex.: R$ 1.500" />
        </Field>
      </div>
      <Field label="Resumo">
        <textarea className={areaCls} rows={2} value={form.summary} onChange={set("summary")} placeholder="Uma frase sobre a oportunidade" />
      </Field>
      <Field label="Descrição completa">
        <textarea className={areaCls} rows={4} value={form.description} onChange={set("description")} />
      </Field>
      <Field label="Atividades (uma por linha)">
        <textarea className={areaCls} rows={3} value={form.activities} onChange={set("activities")} />
      </Field>
      <Field label="Requisitos (um por linha)">
        <textarea className={areaCls} rows={3} value={form.requirements} onChange={set("requirements")} />
      </Field>
      <Field label="Benefícios (um por linha)">
        <textarea className={areaCls} rows={3} value={form.benefits} onChange={set("benefits")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        {saving ? "Publicando…" : "Publicar vaga"}
      </Button>
    </form>
  );
}

function EventForm({ onDone }: { onDone: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", date: "", endTime: "", location: "", mode: "Presencial",
    category: "Workshop", summary: "", description: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 3) { toast.error("Informe um título com pelo menos 3 caracteres."); return; }
    if (!form.date || !form.endTime || !form.location.trim() || !form.summary.trim()) {
      toast.error("Preencha data, horário, local e resumo."); return;
    }
    setSaving(true);
    try {
      await createEvent({
        title: form.title, date: new Date(form.date).toISOString(), endTime: form.endTime,
        location: form.location, mode: form.mode as "Presencial" | "Online",
        category: form.category as "Workshop" | "Feira" | "Palestra" | "Oficina",
        summary: form.summary, description: form.description,
      });
      toast.success("Evento publicado!");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível publicar o evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <Field label="Título do evento">
        <input className={inputCls} value={form.title} onChange={set("title")} placeholder="Ex.: Workshop de Currículo" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data e hora de início">
          <input type="datetime-local" className={inputCls} value={form.date} onChange={set("date")} />
        </Field>
        <Field label="Horário de término">
          <input type="time" className={inputCls} value={form.endTime} onChange={set("endTime")} />
        </Field>
        <Field label="Modalidade">
          <select className={inputCls} value={form.mode} onChange={set("mode")}>
            <option value="Presencial">Presencial</option><option value="Online">Online</option>
          </select>
        </Field>
        <Field label="Categoria">
          <select className={inputCls} value={form.category} onChange={set("category")}>
            {["Workshop", "Feira", "Palestra", "Oficina"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Local">
        <input className={inputCls} value={form.location} onChange={set("location")} placeholder="Ex.: Auditório Central ou link da transmissão" />
      </Field>
      <Field label="Resumo">
        <textarea className={areaCls} rows={2} value={form.summary} onChange={set("summary")} />
      </Field>
      <Field label="Descrição completa">
        <textarea className={areaCls} rows={4} value={form.description} onChange={set("description")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        {saving ? "Publicando…" : "Publicar evento"}
      </Button>
    </form>
  );
}

function PublishPage() {
  const { data, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile });
  const [done, setDone] = useState(false);

  if (isLoading) {
    return <div className="container-page py-16 text-center text-muted-foreground">Carregando…</div>;
  }

  const role = data?.role ?? null;

  if (!role || role === "visitor") {
    return (
      <>
        <PageHeader eyebrow="Publicar" title="Complete seu cadastro para publicar" description="Apenas contas de empresa podem publicar vagas, e contas de professor podem publicar eventos." />
        <div className="container-page py-10">
          <Button asChild size="lg"><Link to="/cadastro">Completar cadastro</Link></Button>
        </div>
      </>
    );
  }

  const isCompany = role === "company";

  return (
    <>
      <PageHeader
        eyebrow="Publicar"
        title={isCompany ? "Publicar nova vaga" : "Publicar novo evento"}
        description={isCompany
          ? "A vaga ficará visível para estudantes e egressos assim que for publicada."
          : "O evento ficará visível para toda a comunidade assim que for publicado."}
      />
      <div className="container-page max-w-2xl py-10">
        {done ? (
          <div className="rounded-xl border bg-card p-8 text-center shadow-card" aria-live="polite">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <h2 className="mt-3 text-lg font-bold">{isCompany ? "Vaga publicada!" : "Evento publicado!"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Já está visível para a comunidade.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Button variant="outline" onClick={() => setDone(false)}>Publicar outra</Button>
              <Button asChild><Link to={isCompany ? "/vagas" : "/eventos"}>Ver publicação</Link></Button>
            </div>
          </div>
        ) : (
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary-soft text-primary">
                {isCompany ? <Briefcase className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
              </span>
              <div>
                <h2 className="font-bold">{isCompany ? "Dados da vaga" : "Dados do evento"}</h2>
                <p className="text-sm text-muted-foreground">
                  {isCompany ? `Empresa: ${data?.company?.name ?? ""}` : "Publicado como professor"}
                </p>
              </div>
            </div>
            {isCompany ? <JobForm onDone={() => setDone(true)} /> : <EventForm onDone={() => setDone(true)} />}
          </section>
        )}
      </div>
    </>
  );
}
