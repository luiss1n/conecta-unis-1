import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, CalendarDays, MessageCircle, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { closeJob, getMyAlertPreferences, getMyApplications, getMyEventRegistrations, getMyProfile, getMyPublishedJobs, getMyRole, getMySavedJobSlugs, getReceivedApplications, type ApplicationListItem } from "@/services/api";
import { toast } from "sonner";
import { useMemo, useState } from "react";

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
  const qc = useQueryClient();
  const roleQuery = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const role = roleQuery.data;
  const canApply = role === "visitor" || role === "professor";
  const canReceive = role === "company" || role === "professor" || role === "admin";
  const received = useQuery({ queryKey: ["received-applications"], queryFn: getReceivedApplications, enabled: canReceive, refetchInterval: 10000 });
  const sent = useQuery({ queryKey: ["my-applications"], queryFn: getMyApplications, enabled: canApply, refetchInterval: 10000 });
  const events = useQuery({ queryKey: ["my-event-registrations"], queryFn: getMyEventRegistrations, enabled: canApply });
  const studentProfile = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile, enabled: role === "visitor" });
  const alertPreferences = useQuery({ queryKey: ["my-job-alert-preferences"], queryFn: getMyAlertPreferences, enabled: role === "visitor" });
  const savedJobs = useQuery({ queryKey: ["my-saved-job-slugs"], queryFn: getMySavedJobSlugs, enabled: role === "visitor" });
  const publishedJobs = useQuery({ queryKey: ["my-published-jobs"], queryFn: getMyPublishedJobs, enabled: role === "company" || role === "professor" });

  async function finishJob(slug: string) {
    try { await closeJob(slug); await qc.invalidateQueries({ queryKey: ["my-published-jobs"] }); toast.success("Vaga encerrada."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível encerrar a vaga."); }
  }

  const nextStep: { title: string; detail: string; to: "/perfil" | "/alertas" | "/vagas" | "/calendario"; label: string } = !studentProfile.data?.profile.resume_path
    ? { title: "Adicione seu currículo", detail: "Seu currículo ajuda as empresas a conhecer sua experiência. Você pode atualizar o arquivo quando quiser.", to: "/perfil", label: "Adicionar currículo" }
    : !alertPreferences.data?.enabled
      ? { title: "Ative alertas de vagas", detail: "Receba notificações quando surgir uma oportunidade alinhada às suas áreas e cidades escolhidas.", to: "/alertas", label: "Configurar alertas" }
      : (sent.data?.length ?? 0) === 0
        ? { title: "Encontre uma oportunidade", detail: "Explore as vagas da região e envie sua primeira candidatura pelo perfil.", to: "/vagas", label: "Explorar vagas" }
        : (savedJobs.data?.length ?? 0) === 0
          ? { title: "Salve vagas para ver depois", detail: "Marque oportunidades interessantes e acompanhe tudo em uma lista pessoal.", to: "/vagas", label: "Ver vagas" }
          : { title: "Acompanhe sua jornada", detail: "Confira suas conversas, candidaturas e eventos de carreira em um só lugar.", to: "/calendario", label: "Abrir calendário" };

  if (roleQuery.isLoading) return <div className="container-page py-16 text-muted-foreground">Carregando suas candidaturas…</div>;

  return (
    <>
      <PageHeader eyebrow="Área da conta" title="Candidaturas e conversas" description="Acompanhe oportunidades, inscrições e mensagens em um só lugar." />
      <div className="container-page max-w-4xl space-y-10 py-8 sm:py-10">
        {role === "visitor" && <section className="rounded-xl border bg-primary-soft/50 p-5"><h2 className="font-bold">Seu próximo passo</h2><p className="mt-1 font-semibold">{studentProfile.isLoading || alertPreferences.isLoading || savedJobs.isLoading ? "Carregando suas recomendações…" : nextStep.title}</p><p className="mt-1 text-sm text-muted-foreground">{studentProfile.isLoading || alertPreferences.isLoading || savedJobs.isLoading ? "" : nextStep.detail}</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm"><Link to={nextStep.to}>{nextStep.label}</Link></Button><Button asChild variant="outline" size="sm"><Link to="/alertas">Alertas</Link></Button><Button asChild variant="outline" size="sm"><Link to="/vagas-salvas">Vagas salvas</Link></Button><Button asChild variant="outline" size="sm"><Link to="/perfil">Meu perfil</Link></Button></div></section>}
        {(role === "company" || role === "professor") && <section aria-labelledby="published-jobs-title"><h2 id="published-jobs-title" className="mb-4 text-xl font-bold">Minhas vagas publicadas</h2>{publishedJobs.isLoading ? <p className="text-sm text-muted-foreground">Carregando vagas…</p> : publishedJobs.isError ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar suas vagas publicadas.</p> : publishedJobs.data?.length ? <ul className="divide-y rounded-xl border bg-card">{publishedJobs.data.map((job) => { const expired = !!job.closesAt && Date.parse(job.closesAt) <= Date.now(); const closed = job.status === "closed" || expired; return <li key={job.slug} className="flex items-center gap-3 p-4"><BriefcaseBusiness className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{job.title}</span><span className="text-sm text-muted-foreground">{job.city} · {closed ? "Encerrada" : "Ativa"}</span></span><Button asChild size="sm" variant="outline"><Link to="/vagas/$slug" params={{ slug: job.slug }}>Ver</Link></Button>{!closed && <Button size="sm" variant="outline" onClick={() => void finishJob(job.slug)}>Encerrar</Button>}</li>; })}</ul> : <p className="rounded-xl border p-4 text-sm text-muted-foreground">Você ainda não publicou vagas. <Link className="font-medium text-primary underline" to="/publicar">Publicar vaga</Link></p>}</section>}
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
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => items.filter(({ application, job }) => {
    const matchesStatus = status === "all" || application.status === status;
    const target = incoming ? `${application.applicant_name} ${job.title}` : `${job.title} ${job.publisherName || job.company?.name || ""}`;
    return matchesStatus && target.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"));
  }), [incoming, items, search, status]);
  return (
    <section aria-labelledby={`${title}-title`}>
      <div className="mb-4">
        <h2 id={`${title}-title`} className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {incoming && !loading && !error && items.length > 0 && <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]"><label className="sr-only" htmlFor={`${title}-search`}>Buscar candidaturas</label><input id={`${title}-search`} className="h-11 rounded-md border bg-background px-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pessoa ou vaga" /><label className="sr-only" htmlFor={`${title}-status`}>Filtrar por status</label><select id={`${title}-status`} className="h-11 rounded-md border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos os status</option><option value="received">Recebida</option><option value="reviewing">Em análise</option><option value="interview">Entrevista</option><option value="closed">Encerrada</option><option value="withdrawn">Cancelada pelo candidato</option></select></div>}
      {loading ? <p className="py-5 text-sm text-muted-foreground">Carregando candidaturas…</p> : error ? <p role="alert" className="py-5 text-sm text-destructive">Não foi possível carregar esta lista. Atualize a página e tente novamente.</p> : filtered.length ? (
        <ul className="divide-y rounded-xl border bg-card">
          {filtered.map(({ application, job }) => {
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
      ) : items.length ? <p className="rounded-xl border p-5 text-sm text-muted-foreground">Nenhuma candidatura corresponde à busca e ao status selecionados.</p> : <EmptyInbox icon="application" title={incoming ? "Nenhuma candidatura recebida" : "Você ainda não se candidatou"} description={incoming ? "Quando alguém se candidatar às suas vagas, a conversa aparecerá aqui." : "Encontre uma vaga e envie sua candidatura para começar."} action={<Button asChild variant="outline"><Link to={incoming ? "/publicar" : "/vagas"}>{incoming ? "Publicar vaga" : "Ver vagas"}</Link></Button>} />}
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
