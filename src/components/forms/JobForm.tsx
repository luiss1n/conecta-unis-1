import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DEFAULT_PUBLISHER } from "@/lib/jobs";
import type { NewJobValues } from "@/services/api";
import type { Company, Job } from "@/types";
import { Field, areaCls, inputCls, lines } from "./fields";

type Values = NewJobValues & { companySlug: string | null; publisherName: string | null };

interface Props {
  /** Vaga existente (edição). Sem isso, o formulário cria uma nova. */
  initial?: Job | undefined;
  /** Modo administrador: permite escolher a empresa ou publicar com um nome livre. */
  admin?: boolean;
  companies?: Company[];
  submitLabel: string;
  savingLabel?: string;
  successMessage: string;
  onSubmit: (values: Values) => Promise<void>;
  onDone: () => void;
  onCancel?: () => void;
}

export function JobForm({ initial, admin = false, companies = [], submitLabel, savingLabel = "Salvando…", successMessage, onSubmit, onDone, onCancel }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    type: initial?.type ?? "estagio",
    mode: initial?.mode ?? "presencial",
    schedule: initial?.schedule ?? "integral",
    category: initial?.category ?? "Tecnologia",
    city: initial?.city ?? "",
    summary: initial?.summary ?? "",
    description: initial?.description ?? "",
    activities: (initial?.activities ?? []).join("\n"),
    requirements: (initial?.requirements ?? []).join("\n"),
    benefits: (initial?.benefits ?? []).join("\n"),
    salary: initial?.salary ?? "",
    companySlug: initial?.companySlug ?? "",
    publisherName: initial?.publisherName ?? DEFAULT_PUBLISHER,
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 3) { toast.error("Informe um título com pelo menos 3 caracteres."); return; }
    if (form.city.trim().length < 2 || form.summary.trim().length < 3 || form.description.trim().length < 3) {
      toast.error("Preencha cidade, resumo e descrição."); return;
    }
    if (admin && !form.companySlug && form.publisherName.trim().length < 2) {
      toast.error("Escolha uma empresa ou informe quem está publicando a vaga."); return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: form.title,
        type: form.type as NewJobValues["type"],
        mode: form.mode as NewJobValues["mode"],
        schedule: form.schedule as NewJobValues["schedule"],
        category: form.category,
        city: form.city,
        summary: form.summary,
        description: form.description,
        activities: lines(form.activities),
        requirements: lines(form.requirements),
        benefits: lines(form.benefits),
        salary: form.salary || undefined,
        companySlug: admin && form.companySlug ? form.companySlug : null,
        publisherName: admin && !form.companySlug ? form.publisherName : null,
      });
      toast.success(successMessage);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar a vaga.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      {admin && (
        <div className="grid gap-4 rounded-lg border bg-muted/40 p-4 sm:grid-cols-2">
          <Field label="Empresa (opcional)">
            <select className={inputCls} value={form.companySlug} onChange={set("companySlug")}>
              <option value="">Sem empresa cadastrada</option>
              {companies.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </Field>
          {!form.companySlug && (
            <Field label="Publicado por">
              <input className={inputCls} value={form.publisherName} onChange={set("publisherName")} maxLength={150} placeholder="Ex.: Núcleo de Carreira ou nome da empresa" />
            </Field>
          )}
        </div>
      )}
      <Field label="Título da vaga">
        <input className={inputCls} value={form.title} onChange={set("title")} maxLength={150} placeholder="Ex.: Estagiário de Marketing" />
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
          <input className={inputCls} value={form.city} onChange={set("city")} maxLength={100} placeholder="Ex.: São Lourenço" />
        </Field>
        <Field label="Salário / bolsa (opcional)">
          <input className={inputCls} value={form.salary} onChange={set("salary")} maxLength={100} placeholder="Ex.: R$ 1.500" />
        </Field>
      </div>
      <Field label="Resumo">
        <textarea className={areaCls} rows={2} maxLength={500} value={form.summary} onChange={set("summary")} placeholder="Uma frase sobre a oportunidade" />
      </Field>
      <Field label="Descrição completa">
        <textarea className={areaCls} rows={4} maxLength={10000} value={form.description} onChange={set("description")} />
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
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {onCancel && <Button type="button" variant="outline" size="lg" className="sm:flex-1" onClick={onCancel} disabled={saving}>Cancelar</Button>}
        <Button type="submit" size="lg" className="sm:flex-1" disabled={saving}>{saving ? savingLabel : submitLabel}</Button>
      </div>
    </form>
  );
}
