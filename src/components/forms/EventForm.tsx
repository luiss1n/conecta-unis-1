import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { NewEventValues } from "@/services/api";
import type { CareerEvent } from "@/types";
import { Field, areaCls, inputCls } from "./fields";

interface Props {
  /** Evento existente (edição). Sem isso, o formulário cria um novo. */
  initial?: CareerEvent | undefined;
  submitLabel: string;
  savingLabel?: string;
  successMessage: string;
  onSubmit: (values: NewEventValues) => Promise<void>;
  onDone: () => void;
  onCancel?: () => void;
}

/** ISO (UTC) → valor de <input type="datetime-local"> no fuso do navegador. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ initial, submitLabel, savingLabel = "Salvando…", successMessage, onSubmit, onDone, onCancel }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    date: initial ? toLocalInput(initial.date) : "",
    endTime: initial?.endTime ?? "",
    location: initial?.location ?? "",
    mode: initial?.mode ?? "Presencial",
    category: initial?.category ?? "Workshop",
    summary: initial?.summary ?? "",
    description: initial?.description ?? "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 3) { toast.error("Informe um título com pelo menos 3 caracteres."); return; }
    if (!form.date || !form.endTime || form.location.trim().length < 2 || form.summary.trim().length < 3 || form.description.trim().length < 3) {
      toast.error("Preencha data, horário, local, resumo e descrição."); return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: form.title,
        date: new Date(form.date).toISOString(),
        endTime: form.endTime,
        location: form.location,
        mode: form.mode as NewEventValues["mode"],
        category: form.category as NewEventValues["category"],
        summary: form.summary,
        description: form.description,
      });
      toast.success(successMessage);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <Field label="Título do evento">
        <input className={inputCls} value={form.title} onChange={set("title")} maxLength={150} placeholder="Ex.: Workshop de Currículo" />
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
        <input className={inputCls} value={form.location} onChange={set("location")} maxLength={300} placeholder="Ex.: Auditório Central ou link da transmissão" />
      </Field>
      <Field label="Resumo">
        <textarea className={areaCls} rows={2} maxLength={500} value={form.summary} onChange={set("summary")} />
      </Field>
      <Field label="Descrição completa">
        <textarea className={areaCls} rows={4} maxLength={10000} value={form.description} onChange={set("description")} />
      </Field>
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {onCancel && <Button type="button" variant="outline" size="lg" className="sm:flex-1" onClick={onCancel} disabled={saving}>Cancelar</Button>}
        <Button type="submit" size="lg" className="sm:flex-1" disabled={saving}>{saving ? savingLabel : submitLabel}</Button>
      </div>
    </form>
  );
}
