import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Flag, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { NafDashboard } from "@/components/admin/NafDashboard";
import { NafSupport } from "@/components/admin/NafSupport";
import { EventForm } from "@/components/forms/EventForm";
import { JobForm } from "@/components/forms/JobForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatEventDate, jobPublisher, typeLabel } from "@/lib/jobs";
import {
  deleteEvent,
  deleteJob,
  closeJob,
  getCompanies,
  getEvents,
  getJobs,
  getAdminApplicationCounts,
  getMyRole,
  getPublicationReports,
  reviewPublicationReport,
  setPublicationHidden,
  saveEventAsAdmin,
  saveJobAsAdmin,
} from "@/services/api";
import type { CareerEvent, Job } from "@/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel de gestão — CONECTA UNIS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Editing = { kind: "job"; item?: Job } | { kind: "event"; item?: CareerEvent } | null;

function PublicationFilters({ filter, onFilter, search, onSearch }: { filter: "all" | "active" | "closed" | "hidden"; onFilter: (filter: "all" | "active" | "closed" | "hidden") => void; search: string; onSearch: (value: string) => void }) {
  return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <label className="flex flex-1 flex-col gap-1 text-sm font-medium">Buscar publicação
      <span className="flex h-10 items-center gap-2 rounded-md border px-3"><Search className="h-4 w-4 text-muted-foreground" /><input value={search} onChange={(event) => onSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Título, cidade ou publicador" /></span>
    </label>
    <label className="flex flex-col gap-1 text-sm font-medium">Status
      <select value={filter} onChange={(event) => onFilter(event.target.value as typeof filter)} className="h-10 rounded-md border bg-background px-3"><option value="all">Todas</option><option value="active">Ativas</option><option value="closed">Encerradas</option><option value="hidden">Ocultas</option></select>
    </label>
  </div>;
}

function ConfirmDelete({ title, onConfirm }: { title: string; onConfirm: () => Promise<void> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" aria-label={`Excluir ${title}`}>
          <Trash2 className="h-4 w-4" /> Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{title}”?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação não pode ser desfeita. O item deixará de aparecer para todos.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AdminPage() {
  const qc = useQueryClient();
  const role = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const isAdmin = role.data === "admin" || role.data === "naf";
  const jobs = useQuery({ queryKey: ["admin-jobs"], queryFn: () => getJobs({ includeClosed: true }), enabled: isAdmin });
  const events = useQuery({ queryKey: ["admin-events"], queryFn: () => getEvents(), enabled: isAdmin });
  const companies = useQuery({ queryKey: ["admin-companies"], queryFn: getCompanies, enabled: isAdmin });
  const applicationCounts = useQuery({ queryKey: ["admin-application-counts"], queryFn: getAdminApplicationCounts, enabled: isAdmin, staleTime: 60_000 });
  const reports = useQuery({ queryKey: ["admin-publication-reports"], queryFn: getPublicationReports, enabled: isAdmin });
  const [editing, setEditing] = useState<Editing>(null);
  const [tab, setTab] = useState("vagas");
  useEffect(() => { if (role.data === "naf") setTab("atendimento"); }, [role.data]);
  const [publicationFilter, setPublicationFilter] = useState<"all" | "active" | "closed" | "hidden">("all");
  const [search, setSearch] = useState("");

  const refresh = () =>
    Promise.all(["admin-jobs", "admin-events", "admin-companies", "admin-publication-reports"].map((k) => qc.invalidateQueries({ queryKey: [k] })));

  async function reviewReport(id: string, status: "resolved" | "dismissed") {
    try {
      await reviewPublicationReport(id, status);
      await qc.invalidateQueries({ queryKey: ["admin-publication-reports"] });
      toast.success(status === "resolved" ? "Denúncia marcada como analisada." : "Denúncia arquivada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a denúncia.");
    }
  }

  async function changeVisibility(kind: "job" | "event", targetRef: string, hidden: boolean) {
    try {
      await setPublicationHidden(kind, targetRef, hidden);
      await Promise.all([qc.invalidateQueries({ queryKey: ["admin-jobs"] }), qc.invalidateQueries({ queryKey: ["admin-events"] })]);
      toast.success(hidden ? "Publicação ocultada para usuários." : "Publicação voltou a ficar visível.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar a visibilidade.");
    }
  }

  async function remove(action: () => Promise<void>, done: string) {
    try {
      await action();
      toast.success(done);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir.");
    }
  }

  async function closePublishedJob(slug: string) {
    try { await closeJob(slug); await qc.invalidateQueries({ queryKey: ["admin-jobs"] }); toast.success("Vaga encerrada."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível encerrar a vaga."); }
  }

  if (role.isLoading) {
    return <div className="container-page py-16 text-center text-muted-foreground">Carregando…</div>;
  }

  if (!isAdmin) {
    return (
      <>
        <PageHeader eyebrow="Gestão" title="Acesso restrito" description="Esta área é exclusiva para administradores e integrantes do NAF." />
        <div className="container-page py-10">
          <Button asChild size="lg"><Link to="/">Voltar ao início</Link></Button>
        </div>
      </>
    );
  }

  const jobList = jobs.data ?? [];
  const eventList = events.data ?? [];
  const visibleJobs = jobList.filter((job) => {
    const unavailable = job.status === "closed" || (!!job.closesAt && Date.parse(job.closesAt) <= Date.now());
    const matchesState = publicationFilter === "all" || (publicationFilter === "hidden" ? !!job.isHidden : !job.isHidden && (publicationFilter === "closed" ? unavailable : !unavailable));
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return matchesState && (!query || `${job.title} ${job.city} ${jobPublisher(job)}`.toLocaleLowerCase("pt-BR").includes(query));
  });
  const visibleEvents = eventList.filter((event) => {
    const past = new Date(event.date).getTime() < Date.now();
    const matchesState = publicationFilter === "all" || (publicationFilter === "hidden" ? !!event.isHidden : !event.isHidden && (publicationFilter === "active" ? !past : past));
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return matchesState && (!query || `${event.title} ${event.location} ${event.category}`.toLocaleLowerCase("pt-BR").includes(query));
  });
  const stats = [
    { label: "Vagas", value: jobList.length },
    { label: "Eventos", value: eventList.length },
    { label: "Empresas", value: companies.data?.length ?? 0 },
  ];

  if (editing) {
    const isJob = editing.kind === "job";
    const back = () => setEditing(null);
    const done = () => { void refresh(); back(); };
    return (
      <>
        <PageHeader
          eyebrow={role.data === "naf" ? "Núcleo de Apoio Contábil e Fiscal" : "Administração"}
          title={isJob ? (editing.item ? "Editar vaga" : "Nova vaga") : editing.item ? "Editar evento" : "Novo evento"}
          description="Sua conta de gestão pode publicar sem um cadastro de empresa ou professor."
        />
        <div className="container-page max-w-2xl py-10">
          <section className="rounded-xl border bg-card p-6 shadow-card">
            {editing.kind === "job" ? (
              <JobForm
                admin
                initial={editing.item}
                companies={companies.data ?? []}
                submitLabel={editing.item ? "Salvar alterações" : "Publicar vaga"}
                successMessage={editing.item ? "Vaga atualizada!" : "Vaga publicada!"}
                onSubmit={(v) => saveJobAsAdmin(v, editing.item?.slug)}
                onDone={done}
                onCancel={back}
              />
            ) : (
              <EventForm
                admin
                initial={editing.item}
                submitLabel={editing.item ? "Salvar alterações" : "Publicar evento"}
                successMessage={editing.item ? "Evento atualizado!" : "Evento publicado!"}
                onSubmit={(v) => saveEventAsAdmin(v, editing.item?.id)}
                onDone={done}
                onCancel={back}
              />
            )}
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow={role.data === "naf" ? "Núcleo de Apoio Contábil e Fiscal" : "Administração"} title={role.data === "naf" ? "Painel do NAF" : "Painel do administrador"} description={role.data === "naf" ? "Atenda empresas e alunos, acompanhe os relatórios e gerencie publicações." : "Crie, edite e exclua vagas e eventos da plataforma."}>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => { setTab("vagas"); setEditing({ kind: "job" }); }}><Plus className="h-4 w-4" /> Nova vaga</Button>
          <Button variant="outline" onClick={() => { setTab("eventos"); setEditing({ kind: "event" }); }}><CalendarDays className="h-4 w-4" /> Novo evento</Button>
        </div>
      </PageHeader>
      <div className="container-page py-10">
        <ul className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map((s) => (
            <li key={s.label} className="rounded-xl border bg-card p-4 shadow-card">
              <p className="font-display text-2xl font-extrabold sm:text-3xl">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </li>
          ))}
        </ul>

        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <TabsList className="h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="vagas">Vagas ({jobList.length})</TabsTrigger>
            <TabsTrigger value="eventos">Eventos ({eventList.length})</TabsTrigger>
            <TabsTrigger value="denuncias"><Flag className="mr-1 h-4 w-4" />Denúncias ({(reports.data ?? []).filter((report) => report.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="naf">NAF · Relatórios</TabsTrigger>
            <TabsTrigger value="atendimento">NAF · Atendimento</TabsTrigger>
          </TabsList>

          <TabsContent value="vagas" className="mt-5">
            <PublicationFilters filter={publicationFilter} onFilter={setPublicationFilter} search={search} onSearch={setSearch} />
            {jobs.isLoading ? (
              <p className="text-muted-foreground">Carregando…</p>
            ) : visibleJobs.length === 0 && jobList.length > 0 ? (
              <EmptyState title="Nenhuma vaga encontrada" description="Nenhuma vaga corresponde à busca e ao status selecionados." action={<Button variant="outline" onClick={() => { setSearch(""); setPublicationFilter("all"); }}>Limpar filtros</Button>} />
            ) : visibleJobs.length === 0 ? (
              <EmptyState title="Nenhuma vaga publicada" description="Publique a primeira vaga da plataforma." action={<Button onClick={() => setEditing({ kind: "job" })}>Nova vaga</Button>} />
            ) : (
              <ul className="space-y-3">
                {visibleJobs.map((j) => (
                  <li key={j.slug} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{j.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {jobPublisher(j)} · {j.city} · {typeLabel[j.type]} · {formatDate(j.publishedAt)} · {j.isHidden ? "Oculta" : j.status === "closed" || (j.closesAt && Date.parse(j.closesAt) <= Date.now()) ? "Encerrada" : "Ativa"}{j.closesAt ? ` · limite ${formatDate(j.closesAt)}` : ""} · {applicationCounts.data?.[j.slug] ?? 0} candidaturas
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button asChild variant="ghost" size="sm"><Link to="/vagas/$slug" params={{ slug: j.slug }}>Ver</Link></Button>
                      <Button variant="outline" size="sm" onClick={() => setEditing({ kind: "job", item: j })}>Editar</Button>
                      <Button variant="outline" size="sm" className="min-h-11" onClick={() => void changeVisibility("job", j.slug, !j.isHidden)}>{j.isHidden ? "Restaurar" : "Ocultar"}</Button>
                      {j.status === "open" && !(j.closesAt && Date.parse(j.closesAt) <= Date.now()) && <Button variant="outline" size="sm" onClick={() => void closePublishedJob(j.slug)}>Encerrar</Button>}
                      <ConfirmDelete title={j.title} onConfirm={() => remove(() => deleteJob(j.slug), "Vaga excluída.")} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="eventos" className="mt-5">
            <PublicationFilters filter={publicationFilter} onFilter={setPublicationFilter} search={search} onSearch={setSearch} />
            {events.isLoading ? (
              <p className="text-muted-foreground">Carregando…</p>
            ) : visibleEvents.length === 0 && eventList.length > 0 ? (
              <EmptyState title="Nenhum evento encontrado" description="Nenhum evento corresponde à busca e ao status selecionados." action={<Button variant="outline" onClick={() => { setSearch(""); setPublicationFilter("all"); }}>Limpar filtros</Button>} />
            ) : visibleEvents.length === 0 ? (
              <EmptyState title="Nenhum evento publicado" description="Publique o primeiro evento da plataforma." action={<Button onClick={() => setEditing({ kind: "event" })}>Novo evento</Button>} />
            ) : (
              <ul className="space-y-3">
                {visibleEvents.map((e) => {
                  const d = formatEventDate(e.date);
                  const past = new Date(e.date).getTime() < Date.now();
                  return (
                    <li key={e.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{e.title}{e.isHidden ? <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Oculto</span> : past && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Encerrado</span>}</p>
                        <p className="truncate text-sm text-muted-foreground">{d.day} {d.month}, {d.time} · {e.location} · {e.category}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Button asChild variant="ghost" size="sm"><Link to="/eventos/$id" params={{ id: e.id }}>Ver</Link></Button>
                        <Button variant="outline" size="sm" onClick={() => setEditing({ kind: "event", item: e })}>Editar</Button>
                        <Button variant="outline" size="sm" className="min-h-11" onClick={() => void changeVisibility("event", e.id, !e.isHidden)}>{e.isHidden ? "Restaurar" : "Ocultar"}</Button>
                        <ConfirmDelete title={e.title} onConfirm={() => remove(() => deleteEvent(e.id), "Evento excluído.")} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="denuncias" className="mt-5">
            <p className="mb-4 text-sm text-muted-foreground">Analise relatos de usuários. A análise não remove automaticamente a publicação; use as ações de vagas ou eventos após revisar o conteúdo.</p>
            {reports.isLoading ? <p className="text-sm text-muted-foreground">Carregando denúncias…</p> : reports.isError ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar as denúncias agora. Tente novamente. Se o problema continuar, fale com um administrador.</p> : reports.data?.length ? <ul className="space-y-3">{reports.data.map((report) => { const hidden = report.target_kind === "job" ? jobList.find((job) => job.slug === report.target_ref)?.isHidden : eventList.find((event) => event.id === report.target_ref)?.isHidden; return <li key={report.id} className="rounded-xl border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-all font-semibold">{report.target_kind === "job" ? "Vaga" : "Evento"} · {report.target_ref}</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{report.reason}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(report.created_at).toLocaleString("pt-BR")} · {report.status === "pending" ? "Pendente" : report.status === "resolved" ? "Analisada" : "Arquivada"}</p></div><div className="flex flex-wrap gap-2">{report.target_kind === "job" ? <><Button asChild size="sm" variant="outline" className="min-h-11"><Link to="/vagas/$slug" params={{ slug: report.target_ref }}>Abrir vaga</Link></Button><Button size="sm" variant="outline" className="min-h-11" onClick={() => void changeVisibility("job", report.target_ref, !hidden)}>{hidden ? "Restaurar" : "Ocultar"}</Button></> : <><Button asChild size="sm" variant="outline" className="min-h-11"><Link to="/eventos/$id" params={{ id: report.target_ref }}>Abrir evento</Link></Button><Button size="sm" variant="outline" className="min-h-11" onClick={() => void changeVisibility("event", report.target_ref, !hidden)}>{hidden ? "Restaurar" : "Ocultar"}</Button></>}{report.status === "pending" && <><Button size="sm" className="min-h-11" onClick={() => void reviewReport(report.id, "resolved")}>Marcar analisada</Button><Button size="sm" variant="outline" className="min-h-11" onClick={() => void reviewReport(report.id, "dismissed")}>Arquivar</Button></>}</div></div></li>; })}</ul> : <EmptyState title="Nenhuma denúncia recebida" description="As denúncias enviadas pelos usuários aparecerão aqui." />}
          </TabsContent>
          <TabsContent value="naf" className="mt-5"><NafDashboard /></TabsContent>
          <TabsContent value="atendimento" className="mt-5"><NafSupport staff /></TabsContent>
        </Tabs>

        <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> As permissões desta conta são validadas pelo banco de dados.
        </p>
      </div>
    </>
  );
}
