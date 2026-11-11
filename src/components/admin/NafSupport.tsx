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
  const activeId = selected ?? cases.data?.[0]?.id ?? null;
  const messages = useQuery({ queryKey: ["naf-messages", activeId], enabled: !!activeId, queryFn: async () => {
    const { data, error } = await supabase.from("naf_messages").select("*").eq("case_id", activeId!).order("created_at");
    if (error) throw error;
    return data ?? [];
  }, refetchInterval: 5000 });
  const [userId, setUserId] = useState("");
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? "")); }, []);

  async function openCase() {
    if (!userId) return;
    setBusy(true);
    try {
      const requesterId = staff ? companyId : userId;
      const existing = cases.data?.find((item) => item.requester_id === requesterId && item.topic === topic);
      if (existing) setSelected(existing.id);
      else {
        const { data, error } = await supabase.from("naf_cases").insert({ requester_id: requesterId, topic }).select("id").single();
        if (error) throw error;
        setSelected(data.id);
      }
      await qc.invalidateQueries({ queryKey: ["naf-cases"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível abrir o atendimento."); }
    finally { setBusy(false); }
  }

  async function send() {
    if (!activeId || !body.trim() || !userId) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("naf_messages").insert({ case_id: activeId, sender_id: userId, body: body.trim() });
      if (error) throw error;
      setBody("");
      await qc.invalidateQueries({ queryKey: ["naf-messages", activeId] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível enviar a mensagem."); }
    finally { setBusy(false); }
  }

  return <section aria-labelledby="naf-support-title" className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
    <div><h2 id="naf-support-title" className="text-xl font-bold">Atendimento do NAF</h2><p className="mt-1 text-sm text-muted-foreground">Orientação gratuita sobre assuntos contábeis e fiscais. A disponibilidade de cada serviço depende do núcleo.</p></div>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <label className="flex flex-col gap-1 text-sm font-medium">Assunto<select className="h-11 min-w-0 rounded-md border bg-background px-3" value={topic} onChange={(event) => setTopic(event.target.value)}>{topics.map((value) => <option key={value}>{value}</option>)}</select></label>
      {staff && <label className="flex flex-col gap-1 text-sm font-medium">Empresa<select className="h-11 min-w-0 rounded-md border bg-background px-3" value={companyId} onChange={(event) => setCompanyId(event.target.value)}><option value="">Selecione</option>{companies.data?.map((company) => <option key={company.owner_id} value={company.owner_id}>{company.name}</option>)}</select></label>}
      <Button className="self-end" type="button" onClick={() => void openCase()} disabled={busy || (staff && !companyId)}>Abrir atendimento</Button>
    </div>
    {cases.isError && <p role="alert" className="text-destructive">Não foi possível carregar os atendimentos. Confira se a migração do NAF foi aplicada.</p>}
    <div className="grid min-w-0 gap-4 md:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="max-h-80 space-y-1 overflow-y-auto" aria-label="Conversas do NAF">{cases.data?.map((item) => <button key={item.id} type="button" onClick={() => setSelected(item.id)} className={`block w-full rounded-md border p-3 text-left text-sm ${activeId === item.id ? "border-primary bg-primary-soft" : ""}`}><span className="block font-semibold">{item.topic}</span><span className="text-xs text-muted-foreground">{staff ? companies.data?.find((company) => company.owner_id === item.requester_id)?.name ?? `Conta ${item.requester_id.slice(0, 8)}` : new Date(item.created_at).toLocaleDateString("pt-BR")}</span></button>)}</div>
      <div className="min-w-0 space-y-3"><div data-lenis-prevent className="h-72 space-y-2 overflow-y-auto overscroll-contain rounded-md border bg-muted/30 p-3" aria-live="polite">{messages.data?.map((message) => <div key={message.id} className={`max-w-[90%] rounded-lg p-3 text-sm ${message.sender_id === userId ? "ml-auto bg-primary text-primary-foreground" : "bg-card"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><span className="mt-1 block text-xs opacity-70">{new Date(message.created_at).toLocaleString("pt-BR")}</span></div>)}</div><form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex gap-2"><label className="sr-only" htmlFor="naf-message">Mensagem</label><input id="naf-message" className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder="Escreva sua dúvida ou resposta" disabled={!activeId} /><Button type="submit" disabled={!activeId || busy || !body.trim()}>Enviar</Button></form></div>
    </div>
  </section>;
}
