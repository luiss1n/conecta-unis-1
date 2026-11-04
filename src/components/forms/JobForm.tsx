import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DEFAULT_PUBLISHER } from "@/lib/jobs";
import { deletePublicationDraft, getPublicationDraft, savePublicationDraft, type NewJobValues } from "@/services/api";
import type { Company, Job } from "@/types";
import { Field, areaCls, inputCls, lines } from "./fields";
import { useQuery } from "@tanstack/react-query";
import { getRegionalCities } from "@/services/api";

type Values = NewJobValues & { companySlug: string | null; publisherName: string | null };

interface Props {
  
  initial?: Job | undefined;
  
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
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState("Carregando rascunho da conta…");
  const submitSucceeded = useRef(false);
  const isEditing = !!initial;
  const { data: regionalCities = [], isLoading: citiesLoading, isError: citiesError } = useQuery({ queryKey: ["regional-cities"], queryFn: getRegionalCities, staleTime: 24 * 60 * 60 * 1000 });
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
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [citySuggestionsError, setCitySuggestionsError] = useState(false);
  const [citySuggestionsLoading, setCitySuggestionsLoading] = useState(false);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const cityRequest = useRef(0);
  useEffect(() => {
    const query = form.city.trim();
    if (query.length < 2) { setCitySuggestions([]); setCityMenuOpen(false); return; }
    const request = ++cityRequest.current;
    const timer = window.setTimeout(async () => {
      setCitySuggestionsLoading(true);
      setCitySuggestionsError(false);
      try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Falha ao buscar municípios");
        const data = await response.json() as Array<{ nome: string; microrregiao?: { mesorregiao?: { UF?: { sigla: string } } }; "regiao-imediata"?: { "regiao-intermediaria"?: { UF?: { sigla: string } } } }>;
        if (request !== cityRequest.current) return;
        const suggestions = [...new Set(data.map((item) => `${item.nome} - ${item.microrregiao?.mesorregiao?.UF?.sigla ?? item["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ?? "Brasil"}`))].slice(0, 10);
        setCitySuggestions(suggestions);
        setCityMenuOpen(true);
      } catch {
        if (request === cityRequest.current) setCitySuggestionsError(true);
      } finally {
        if (request === cityRequest.current) setCitySuggestionsLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [form.city]);
  useEffect(() => {
    if (isEditing || admin) { setDraftReady(true); return; }
    let active = true;
    void getPublicationDraft<typeof form>("job").then((draft) => {
      if (!active) return;
      if (draft?.payload) setForm((current) => ({ ...current, ...draft.payload }));
      setDraftStatus(draft?.updated_at ? `Rascunho sincronizado em ${new Date(draft.updated_at).toLocaleString("pt-BR")}` : "Rascunho sincronizado com sua conta");
      setDraftReady(true);
    }).catch(() => { if (active) { setDraftStatus("Rascunho indisponível; você ainda pode preencher e publicar."); setDraftReady(true); } });
    return () => { active = false; };
  }, [admin, isEditing]);
  useEffect(() => {
    if (!draftReady || isEditing || admin || submitSucceeded.current || !Object.values(form).some((value) => typeof value === "string" && value.trim().length > 0)) return;
    const timer = window.setTimeout(() => {
      void savePublicationDraft("job", form, new Date().toISOString()).then(() => setDraftStatus("Rascunho salvo na sua conta")).catch(() => setDraftStatus("Não foi possível sincronizar o rascunho"));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [admin, draftReady, form, isEditing]);
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
      submitSucceeded.current = true;
      if (!isEditing && !admin) {
        try { await deletePublicationDraft("job"); }
        catch { setDraftStatus("Vaga publicada; o rascunho ainda pode aparecer em sua conta."); }
      }
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
          <div className="relative">
            <input className={inputCls} value={form.city} onChange={(event) => { set("city")(event); setCityMenuOpen(true); }} onFocus={() => { if (form.city.trim().length >= 2) setCityMenuOpen(true); }} onBlur={() => window.setTimeout(() => setCityMenuOpen(false), 150)} autoComplete="address-level2" role="combobox" aria-autocomplete="list" aria-expanded={cityMenuOpen && citySuggestions.length > 0} aria-controls="job-city-suggestions" required maxLength={100} placeholder="Digite uma cidade do Brasil" />
            {cityMenuOpen && form.city.trim().length >= 2 && <ul id="job-city-suggestions" role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">{citySuggestionsLoading && <li className="px-3 py-2 text-sm text-muted-foreground">Buscando cidades…</li>}{!citySuggestionsLoading && citySuggestions.map((city) => <li key={city} role="option" aria-selected={form.city === city}><button type="button" className="w-full rounded px-3 py-2 text-left text-sm hover:bg-accent focus-visible:bg-accent" onMouseDown={(event) => event.preventDefault()} onClick={() => { setForm((current) => ({ ...current, city })); setCityMenuOpen(false); }}>{city}</button></li>)}{!citySuggestionsLoading && !citySuggestions.length && <li className="px-3 py-2 text-sm text-muted-foreground">{citySuggestionsError ? "Não foi possível buscar sugestões. Você pode manter a cidade digitada." : "Nenhuma sugestão encontrada. Você pode manter a cidade digitada."}</li>}</ul>}
          </div>
          <p className="text-xs text-muted-foreground">Digite para ver sugestões de municípios do IBGE ou informe a cidade manualmente.</p>
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
      {!admin && !isEditing && <p className="text-xs text-muted-foreground" role="status" aria-live="polite">{draftStatus}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {onCancel && <Button type="button" variant="outline" size="lg" className="sm:flex-1" onClick={onCancel} disabled={saving}>Cancelar</Button>}
        <Button type="submit" size="lg" className="sm:flex-1" disabled={saving || (!admin && !isEditing && !draftReady)}>{saving ? savingLabel : submitLabel}</Button>
      </div>
    </form>
  );
}
