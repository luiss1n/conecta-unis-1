import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, MessageCircle, Send, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { getApplicationConversation, getApplicationMessages, getApplicationResumeUrl, sendApplicationMessage, updateApplicationStatus } from "@/services/api";

export const Route = createFileRoute("/_authenticated/conversas/$applicationId")({
  head: () => ({ meta: [
    { title: "Conversa de candidatura — CONECTA UNIS" },
    { name: "description", content: "Converse com o candidato ou anunciante sobre uma oportunidade." },
  ] }),
  component: ApplicationConversation,
});

const statusLabels: Record<string, string> = {
  received: "Recebida",
  reviewing: "Em análise",
  interview: "Entrevista",
  closed: "Encerrada",
  withdrawn: "Cancelada pelo candidato",
};

function ApplicationConversation() {
  const { applicationId } = Route.useParams();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);
  const applicationQuery = useQuery({ queryKey: ["application-conversation", applicationId], queryFn: () => getApplicationConversation(applicationId), refetchInterval: 10000 });
  const application = applicationQuery.data?.application;
  const isCandidate = applicationQuery.data?.isCandidate ?? false;
  const messagesQuery = useQuery({
    queryKey: ["application-messages", applicationId],
    queryFn: () => getApplicationMessages(applicationId),
    enabled: !!application,
    refetchInterval: 5000,
  });
  const resumeQuery = useQuery({
    queryKey: ["application-resume", applicationId],
    queryFn: () => getApplicationResumeUrl(application!),
    enabled: !!application?.applicant_resume_path && !isCandidate,
  });
  const send = useMutation({
    mutationFn: () => sendApplicationMessage(applicationId, body),
    onSuccess: async () => {
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["application-messages", applicationId] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível enviar a mensagem."),
  });
  const changeStatus = useMutation({
    mutationFn: (status: "reviewing" | "interview" | "closed" | "withdrawn") => updateApplicationStatus(applicationId, status),
    onSuccess: async () => {
      toast.success("Status da candidatura atualizado.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["application-conversation", applicationId] }),
        queryClient.invalidateQueries({ queryKey: ["my-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["received-applications"] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o status."),
  });

  useEffect(() => { messagesEnd.current?.scrollIntoView({ block: "end" }); }, [messagesQuery.data?.length]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (send.isPending || !body.trim()) return;
    send.mutate();
  }

  if (applicationQuery.isLoading) return <div className="container-page py-16 text-muted-foreground">Carregando conversa…</div>;
  if (applicationQuery.isError || !applicationQuery.data) {
    return <div className="container-page max-w-3xl py-12"><h1 className="text-2xl font-bold">Conversa indisponível</h1><p className="mt-2 text-sm text-muted-foreground">Ela pode não existir ou sua conta não ter acesso.</p><Button asChild variant="outline" className="mt-5"><Link to="/candidaturas"><ArrowLeft className="h-4 w-4" /> Voltar às candidaturas</Link></Button></div>;
  }

  const { job } = applicationQuery.data;
  const otherParty = isCandidate ? (job.publisherName || job.company?.name || "Anunciante") : application.applicant_name;
  const closed = application.status === "closed" || application.status === "withdrawn";

  return (
    <div className="container-page max-w-5xl py-6 sm:py-9">
      <Link to="/candidaturas" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Candidaturas</Link>
      <header className="mt-5 flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Conversa sobre a vaga</p>
          <h1 className="mt-1 break-words text-2xl font-extrabold">{job.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{otherParty} · <span className="font-medium text-foreground">{statusLabels[application.status] ?? application.status}</span></p>
        </div>
        {isCandidate && application.status !== "withdrawn" && application.status !== "closed" ? (
          <Button type="button" variant="outline" disabled={changeStatus.isPending} onClick={() => changeStatus.mutate("withdrawn")}>Cancelar candidatura</Button>
        ) : !isCandidate ? (
          <label className="flex items-center gap-2 text-sm font-medium">
            Andamento
            <select className="h-10 rounded-md border bg-background px-3" value={application.status} disabled={changeStatus.isPending || application.status === "withdrawn"} onChange={(event) => {
              const value = event.target.value;
              if (value === "reviewing" || value === "interview" || value === "closed") changeStatus.mutate(value);
            }}>
              <option value="received">Recebida</option><option value="reviewing">Em análise</option><option value="interview">Entrevista</option><option value="closed">Encerrada</option>{application.status === "withdrawn" && <option value="withdrawn">Cancelada pelo candidato</option>}
            </select>
          </label>
        ) : null}
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-labelledby="messages-title" className="flex min-h-[60vh] flex-col rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b px-5 py-4"><MessageCircle className="h-5 w-5 text-primary" /><h2 id="messages-title" className="font-bold">Conversa privada</h2></div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5" aria-live="polite">
            {application.cover_message && <article className="mx-auto max-w-2xl rounded-xl border border-primary/20 bg-primary-soft/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Apresentação enviada na candidatura</p><p className="mt-2 whitespace-pre-wrap text-sm">{application.cover_message}</p></article>}
            {messagesQuery.isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Carregando mensagens…</p> : messagesQuery.isError ? <p role="alert" className="py-8 text-center text-sm text-destructive">Não foi possível carregar as mensagens.</p> : messagesQuery.data?.length ? messagesQuery.data.map((message) => {
              const mine = message.sender_id === session?.user.id;
              return <article key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"}`}>
                  <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                  <time className={`mt-1 block text-right text-[11px] ${mine ? "text-primary-foreground/75" : "text-muted-foreground"}`} dateTime={message.created_at}>{new Date(message.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time>
                </div>
              </article>;
            }) : <div className="flex min-h-48 flex-col items-center justify-center text-center"><MessageCircle className="h-8 w-8 text-muted-foreground" /><p className="mt-3 font-semibold">Comece a conversa</p><p className="mt-1 text-sm text-muted-foreground">Combine os próximos passos da seleção com {otherParty}.</p></div>}
            <div ref={messagesEnd} />
          </div>
          {closed ? <p className="border-t p-4 text-center text-sm text-muted-foreground">Esta candidatura foi encerrada. A conversa continua disponível para consulta.</p> : (
            <form onSubmit={submit} className="flex items-end gap-3 border-t p-4 sm:p-5">
              <Textarea aria-label="Escreva uma mensagem" value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} rows={2} placeholder="Escreva sua mensagem…" className="min-h-12 resize-y" />
              <Button type="submit" size="icon" aria-label="Enviar mensagem" disabled={send.isPending || !body.trim()}><Send className="h-4 w-4" /></Button>
            </form>
          )}
        </section>

        <aside className="h-fit rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" /><h2 className="font-bold">{isCandidate ? "Vaga" : "Perfil do candidato"}</h2></div>
          {isCandidate ? <div className="mt-4"><p className="font-semibold">{job.publisherName || job.company?.name || "Anunciante"}</p><p className="mt-1 text-sm text-muted-foreground">{job.city} · {job.type === "estagio" ? "Estágio" : "Emprego"}</p><Button asChild variant="outline" className="mt-4 w-full"><Link to="/vagas/$slug" params={{ slug: job.slug }}>Ver vaga</Link></Button></div> : (
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-semibold">{application.applicant_name}</p>
              {application.applicant_headline && <p className="text-muted-foreground">{application.applicant_headline}</p>}
              {application.applicant_education && <p><span className="font-medium">Formação:</span> {application.applicant_education}</p>}
              {application.applicant_institution && <p><span className="font-medium">Instituição:</span> {application.applicant_institution}</p>}
              {application.applicant_city && <p><span className="font-medium">Cidade:</span> {application.applicant_city}</p>}
              <a className="block break-all text-primary underline-offset-2 hover:underline" href={`mailto:${application.applicant_email}`}>{application.applicant_email}</a>
              {application.applicant_phone && <a className="block text-primary underline-offset-2 hover:underline" href={`tel:${application.applicant_phone}`}>{application.applicant_phone}</a>}
              {application.applicant_resume_path && (resumeQuery.data ? <Button asChild variant="outline" className="w-full"><a href={resumeQuery.data} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /> Abrir currículo</a></Button> : resumeQuery.isError ? <p role="alert" className="text-xs text-destructive">Não foi possível abrir o currículo.</p> : <p className="text-xs text-muted-foreground">Carregando currículo…</p>)}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
