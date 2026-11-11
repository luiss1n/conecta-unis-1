import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const topics = ["MEI e obrigações fiscais", "CNPJ e formalização", "Certidões e pendências fiscais", "Pagamentos e parcelamentos", "CPF e imposto de renda", "Outro assunto"];

export function NafSupport({ staff = false }: { staff?: boolean }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [topic, setTopic] = useState(topics[0]!);
  const [companyId, setCompanyId] = useState("");
  const [body, setBody] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [busy, setBusy] = useState(false);
  const cases = useQuery({ queryKey: ["naf-cases"], queryFn: async () => {
    const { data, error } = await supabase.from("naf_cases").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }, refetchInterval: 10000 });
  const companies = useQuery({ queryKey: ["naf-companies"], enabled: staff, queryFn: async () => {
    const { data, error } = await supabase.from("companies").select("owner_id,name").order("name");
    if (error) throw error;
    return data ?? [];
  } });
  const activeId = selected;
  const messages = useQuery({ queryKey: ["naf-messages", activeId], enabled: !!activeId, queryFn: async () => {
    const { data, error } = await supabase.from("naf_messages").select("*").eq("case_id", activeId!).order("created_at");
    if (error) throw error;
    return data ?? [];
  }, refetchInterval: 5000 });
  const [userId, setUserId] = useState("");
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? "")); }, []);
  const requesterId = staff ? (companyId || companies.data?.[0]?.owner_id || "") : userId;
  const canStart = !!userId && !!requesterId && !busy;

  function showError(error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const message = code === "42501" || code === "PGRST205" || code === "42P01"
      ? "O atendimento do NAF ainda não está habilitado no banco. Aplique as migrações 0023 e 0024."
      : error && typeof error === "object" && "message" in error ? String(error.message) : "Não foi possível concluir o atendimento.";
    setInlineError(message);
    toast.error(message);
  }

  async function ensureCase(): Promise<string> {
    if (!requesterId) throw new Error(staff ? "Selecione uma empresa para iniciar o atendimento." : "Entre novamente na sua conta.");
    const { data: existing, error: lookupError } = await supabase.from("naf_cases").select("id")
      .eq("requester_id", requesterId).eq("topic", topic).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return existing.id;
    const { data, error } = await supabase.from("naf_cases").insert({ requester_id: requesterId, topic }).select("id").single();
    if (error) throw error;
    return data.id;
  }

  async function openCase() {
    if (!canStart) return;
    setBusy(true);
    setInlineError("");
    try {
      setSelected(await ensureCase());
      await qc.invalidateQueries({ queryKey: ["naf-cases"] });
    } catch (error) { showError(error); }
    finally { setBusy(false); }
  }

  async function send() {
    if (!body.trim() || !canStart) return;
    setBusy(true);
    setInlineError("");
    try {
      const caseId = activeId ?? await ensureCase();
      const { error } = await supabase.from("naf_messages").insert({ case_id: caseId, sender_id: userId, body: body.trim() });
      if (error) throw error;
      setSelected(caseId);
      setBody("");
      await Promise.all([qc.invalidateQueries({ queryKey: ["naf-messages", caseId] }), qc.invalidateQueries({ queryKey: ["naf-cases"] })]);
    } catch (error) { showError(error); }
    finally { setBusy(false); }
  }

  return <section aria-labelledby="naf-support-title" className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
    <div><h2 id="naf-support-title" className="text-xl font-bold">Atendimento do NAF</h2><p className="mt-1 text-sm text-muted-foreground">Orientação gratuita sobre assuntos contábeis e fiscais. A disponibilidade de cada serviço depende do núcleo.</p></div>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <label className="flex flex-col gap-1 text-sm font-medium">Assunto<select className="h-11 min-w-0 rounded-md border bg-background px-3" value={topic} onChange={(event) => setTopic(event.target.value)}>{topics.map((value) => <option key={value}>{value}</option>)}</select></label>
      {staff && <label className="flex flex-col gap-1 text-sm font-medium">Empresa<select className="h-11 min-w-0 rounded-md border bg-background px-3" value={requesterId} onChange={(event) => setCompanyId(event.target.value)}><option value="">Selecione uma empresa</option>{companies.data?.map((company) => <option key={company.owner_id} value={company.owner_id}>{company.name}</option>)}</select></label>}
      <Button className="self-end" type="button" onClick={() => void openCase()} disabled={!canStart}>Abrir atendimento</Button>
    </div>
    {staff && companies.isLoading && <p className="text-sm text-muted-foreground">Carregando empresas…</p>}
    {staff && companies.isError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar as empresas.</p>}
    {staff && !companies.isLoading && !companies.isError && !companies.data?.length && <p className="text-sm text-muted-foreground">Ainda não há empresas cadastradas para iniciar um atendimento.</p>}
    {inlineError && <p role="alert" className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">{inlineError}</p>}
    {cases.isError && <p role="alert" className="text-destructive">Não foi possível carregar os atendimentos. Confira se a migração do NAF foi aplicada.</p>}
    <div className="grid min-w-0 gap-4 md:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="max-h-80 space-y-1 overflow-y-auto" aria-label="Conversas do NAF">{cases.data?.map((item) => <button key={item.id} type="button" onClick={() => setSelected(item.id)} className={`block w-full rounded-md border p-3 text-left text-sm ${activeId === item.id ? "border-primary bg-primary-soft" : ""}`}><span className="block font-semibold">{item.topic}</span><span className="text-xs text-muted-foreground">{staff ? companies.data?.find((company) => company.owner_id === item.requester_id)?.name ?? `Conta ${item.requester_id.slice(0, 8)}` : new Date(item.created_at).toLocaleDateString("pt-BR")}</span></button>)}</div>
      <div className="min-w-0 space-y-3"><div data-lenis-prevent className="h-72 space-y-2 overflow-y-auto overscroll-contain rounded-md border bg-muted/30 p-3" aria-live="polite">{!activeId && <p className="text-sm text-muted-foreground">Escreva uma mensagem e envie para iniciar a conversa.</p>}{messages.data?.map((message) => <div key={message.id} className={`max-w-[90%] rounded-lg p-3 text-sm ${message.sender_id === userId ? "ml-auto bg-primary text-primary-foreground" : "bg-card"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><span className="mt-1 block text-xs opacity-70">{new Date(message.created_at).toLocaleString("pt-BR")}</span></div>)}</div><form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex gap-2"><label className="sr-only" htmlFor="naf-message">Mensagem</label><input id="naf-message" className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder="Escreva sua dúvida ou resposta" /><Button type="submit" disabled={!canStart || !body.trim()}>Enviar</Button></form></div>
    </div>
  </section>;
}
