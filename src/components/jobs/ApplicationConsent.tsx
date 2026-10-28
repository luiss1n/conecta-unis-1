import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { storeAuthReturn } from "@/lib/auth-return";
import { getMyJobApplication, getMyRole, submitJobApplication } from "@/services/api";

const statusLabels: Record<string, string> = {
  received: "Recebida",
  reviewing: "Em análise",
  interview: "Entrevista",
  closed: "Encerrada",
  withdrawn: "Cancelada por você",
};

export function ApplicationConsent({ companyName, jobSlug }: { companyName: string; jobSlug: string }) {
  const navigate = useNavigate();
  const { session, ready } = useSession();
  const queryClient = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const [consentError, setConsentError] = useState(false);
  const roleQuery = useQuery({ queryKey: ["my-role"], queryFn: getMyRole, enabled: ready && !!session });
  const applicationQuery = useQuery({
    queryKey: ["my-job-application", jobSlug],
    queryFn: () => getMyJobApplication(jobSlug),
    enabled: ready && !!session && (roleQuery.data === "visitor" || roleQuery.data === "professor"),
  });
  const apply = useMutation({
    mutationFn: () => submitJobApplication(jobSlug, coverMessage),
    onSuccess: async () => {
      toast.success("Candidatura enviada. A conversa com o anunciante já está disponível.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-job-application", jobSlug] }),
        queryClient.invalidateQueries({ queryKey: ["my-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["received-applications"] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível enviar sua candidatura."),
  });

  const role = roleQuery.data;
  const application = applicationQuery.data;
  const canApply = role === "visitor" || role === "professor";

  if (!ready || (session && (roleQuery.isLoading || (canApply && applicationQuery.isLoading)))) {
    return <section className="rounded-xl border bg-card p-5 shadow-card"><p className="text-sm text-muted-foreground">Verificando sua candidatura…</p></section>;
  }

  if (session && roleQuery.isError) {
    return <section className="rounded-xl border bg-card p-5 shadow-card"><p role="alert" className="text-sm text-destructive">Não foi possível verificar seu perfil. Atualize a página e tente novamente.</p></section>;
  }

  if (application) {
    return (
      <section className="rounded-xl border border-success/30 bg-success-soft p-5" aria-live="polite">
        <div className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-5 w-5 text-success" /> Candidatura {statusLabels[application.status] ?? application.status}</div>
        <p className="mt-2 text-sm text-muted-foreground">Acompanhe o retorno do anunciante pela conversa privada desta vaga.</p>
        <Button asChild className="mt-4 w-full">
          <Link to="/conversas/$applicationId" params={{ applicationId: application.id }}><MessageCircle className="h-4 w-4" /> Abrir conversa</Link>
        </Button>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="font-bold">Candidatar-se à vaga</h2>
        <p className="mt-2 text-sm text-muted-foreground">Entre na sua conta de aluno ou professor para enviar sua candidatura.</p>
        <Button className="mt-4 w-full" onClick={() => { storeAuthReturn(`/vagas/${jobSlug}`); navigate({ to: "/auth" }); }}>Entrar para se candidatar</Button>
      </section>
    );
  }

  if (!canApply) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="font-bold">Candidatura</h2>
        <p className="mt-2 text-sm text-muted-foreground">Esta funcionalidade está disponível para perfis de aluno e professor.</p>
        {role == null && <Button variant="outline" className="mt-4 w-full" onClick={() => { storeAuthReturn(`/vagas/${jobSlug}`); navigate({ to: "/cadastro" }); }}>Completar cadastro de aluno</Button>}
      </section>
    );
  }

  return (
    <section aria-labelledby="apply-title" className="rounded-xl border bg-card p-5 shadow-card">
      <h2 id="apply-title" className="font-bold">Candidatar-se à vaga</h2>
      <p className="mt-2 text-sm text-muted-foreground">Sua candidatura iniciará uma conversa privada com <strong className="text-foreground">{companyName}</strong>.</p>
      <div className="mt-4 space-y-1.5">
        <Label htmlFor="application-message">Apresentação (opcional)</Label>
        <Textarea id="application-message" value={coverMessage} onChange={(event) => setCoverMessage(event.target.value)} maxLength={2000} rows={3} placeholder="Conte brevemente por que esta oportunidade combina com você." />
        <p className="text-right text-xs text-muted-foreground">{coverMessage.length}/2000</p>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <Checkbox id="application-consent" checked={agreed} aria-invalid={consentError} aria-describedby={consentError ? "application-consent-error" : undefined} onCheckedChange={(value) => { setAgreed(value === true); if (value) setConsentError(false); }} className="mt-0.5 aria-invalid:border-destructive" />
        <label htmlFor="application-consent" className="text-sm leading-snug">
          Autorizo compartilhar meu nome, e-mail, telefone, resumo profissional, formação, cidade e currículo cadastrado (se houver) com {companyName} para esta seleção. Li a{" "}
          <Link to="/privacidade" className="font-medium text-primary underline-offset-2 hover:underline">política de privacidade</Link>.
        </label>
      </div>
      {consentError && <p id="application-consent-error" role="alert" className="mt-2 text-sm text-destructive">Confirme o compartilhamento para enviar a candidatura.</p>}
      <Button className="mt-5 w-full" size="lg" disabled={apply.isPending || applicationQuery.isError} onClick={() => {
        if (!agreed) { setConsentError(true); return; }
        apply.mutate();
      }}>
        <Send className="h-4 w-4" /> {apply.isPending ? "Enviando…" : "Enviar candidatura"}
      </Button>
      {applicationQuery.isError && <p role="alert" className="mt-3 text-sm text-destructive">Não foi possível verificar inscrições anteriores. Atualize a página antes de enviar uma candidatura.</p>}
    </section>
  );
}
