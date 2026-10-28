import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, CalendarDays, MessageCircle, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { getMyApplications, getMyEventRegistrations, getMyRole, getReceivedApplications, type ApplicationListItem } from "@/services/api";

export const Route = createFileRoute("/_authenticated/candidaturas")({
  head: () => ({ meta: [
    { title: "Candidaturas e conversas — CONECTA UNIS" },
    { name: "description", content: "Acompanhe candidaturas, respostas e inscrições em eventos." },
  ] }),
  component: ApplicationsInbox,
});

const statusLabel: Record<string, string> = {
  received: "Recebida",
  reviewing: "Em análise",
  interview: "Entrevista",
  closed: "Encerrada",
  withdrawn: "Cancelada",
};

function ApplicationsInbox() {
  const roleQuery = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const role = roleQuery.data;
  const canApply = role === "visitor" || role === "professor";
  const canReceive = role === "company" || role === "professor" || role === "admin";
  const received = useQuery({ queryKey: ["received-applications"], queryFn: getReceivedApplications, enabled: canReceive, refetchInterval: 10000 });
  const sent = useQuery({ queryKey: ["my-applications"], queryFn: getMyApplications, enabled: canApply, refetchInterval: 10000 });
  const events = useQuery({ queryKey: ["my-event-registrations"], queryFn: getMyEventRegistrations, enabled: canApply });

  if (roleQuery.isLoading) return <div className="container-page py-16 text-muted-foreground">Carregando suas candidaturas…</div>;

  return (
    <>
      <PageHeader eyebrow="Área da conta" title="Candidaturas e conversas" description="Acompanhe oportunidades, inscrições e mensagens em um só lugar." />
      <div className="container-page max-w-4xl space-y-10 py-8 sm:py-10">
        {canReceive && <ApplicationSection title="Candidaturas recebidas" description="Converse com quem se candidatou às suas vagas." items={received.data ?? []} loading={received.isLoading} error={received.isError} incoming />}
        {canApply && <ApplicationSection title="Minhas candidaturas" description="Veja o andamento das suas inscrições e abra a conversa com o anunciante." items={sent.data ?? []} loading={sent.isLoading} error={sent.isError} />}
        {canApply && (
          <section aria-labelledby="event-registrations-title">
            <div className="mb-4">
              <h2 id="event-registrations-title" className="text-xl font-bold">Eventos inscritos</h2>
              <p className="mt-1 text-sm text-muted-foreground">Eventos em que sua inscrição foi confirmada.</p>
            </div>
            {events.isLoading ? <p className="py-5 text-sm text-muted-foreground">Carregando inscrições…</p> : events.isError ? <p role="alert" className="py-5 text-sm text-destructive">Não foi possível carregar suas inscrições em eventos.</p> : events.data?.length ? (
              <ul className="divide-y rounded-xl border bg-card">
                {events.data.map(({ event, registration }) => (
                  <li key={registration.event_id}>
                    <Link to="/eventos/$id" params={{ id: event.id }} className="flex items-center gap-3 p-4 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring">
                      <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{event.title}</span><span className="text-sm text-muted-foreground">Inscrição confirmada</span></span>
                      <span className="text-xs text-muted-foreground">{new Date(registration.created_at).toLocaleDateString("pt-BR")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <EmptyInbox icon="event" title="Você ainda não se inscreveu em eventos" description="Explore os próximos eventos e confirme sua inscrição por lá." action={<Button asChild variant="outline"><Link to="/eventos">Ver eventos</Link></Button>} />}
          </section>
        )}
        {!canApply && !canReceive && <EmptyInbox icon="application" title="Complete seu cadastro" description="Escolha um perfil de aluno, empresa ou professor para acessar suas candidaturas." action={<Button asChild><Link to="/cadastro">Completar cadastro</Link></Button>} />}
      </div>
    </>
  );
}

function ApplicationSection({ title, description, items, loading, error, incoming = false }: {
  title: string; description: string; items: ApplicationListItem[]; loading: boolean; error: boolean; incoming?: boolean;
}) {
  return (
    <section aria-labelledby={`${title}-title`}>
      <div className="mb-4">
        <h2 id={`${title}-title`} className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {loading ? <p className="py-5 text-sm text-muted-foreground">Carregando candidaturas…</p> : error ? <p role="alert" className="py-5 text-sm text-destructive">Não foi possível carregar esta lista. Atualize a página e tente novamente.</p> : items.length ? (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map(({ application, job }) => {
            const name = incoming ? application.applicant_name : job.title;
            const detail = incoming ? job.title : (job.publisherName || job.company?.name || "Anunciante");
            return (
              <li key={application.id}>
                <Link to="/conversas/$applicationId" params={{ applicationId: application.id }} className="flex items-center gap-3 p-4 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring">
                  {incoming ? <UserRound className="h-5 w-5 shrink-0 text-primary" /> : <BriefcaseBusiness className="h-5 w-5 shrink-0 text-primary" />}
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{name}</span><span className="block truncate text-sm text-muted-foreground">{detail}</span></span>
                  <span className="hidden rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary sm:inline-flex">{statusLabel[application.status] ?? application.status}</span>
                  <span className="hidden text-xs text-muted-foreground md:inline">{new Date(application.updated_at).toLocaleDateString("pt-BR")}</span>
                  <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Abrir conversa" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : <EmptyInbox icon="application" title={incoming ? "Nenhuma candidatura recebida" : "Você ainda não se candidatou"} description={incoming ? "Quando alguém se candidatar às suas vagas, a conversa aparecerá aqui." : "Encontre uma vaga e envie sua candidatura para começar."} action={<Button asChild variant="outline"><Link to={incoming ? "/publicar" : "/vagas"}>{incoming ? "Publicar vaga" : "Ver vagas"}</Link></Button>} />}
    </section>
  );
}

function EmptyInbox({ icon, title, description, action }: { icon: "application" | "event"; title: string; description: string; action: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
      {icon === "event" ? <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" /> : <BriefcaseBusiness className="h-5 w-5 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
      {action}
    </div>
  );
}
