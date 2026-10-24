import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
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
  getCompanies,
  getEvents,
  getJobs,
  getMyRole,
  saveEventAsAdmin,
  saveJobAsAdmin,
} from "@/services/api";
import type { CareerEvent, Job } from "@/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do administrador — CONECTA UNIS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Editing = { kind: "job"; item?: Job } | { kind: "event"; item?: CareerEvent } | null;

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
  const isAdmin = role.data === "admin";
  const jobs = useQuery({ queryKey: ["admin-jobs"], queryFn: getJobs, enabled: isAdmin });
  const events = useQuery({ queryKey: ["admin-events"], queryFn: () => getEvents(), enabled: isAdmin });
  const companies = useQuery({ queryKey: ["admin-companies"], queryFn: getCompanies, enabled: isAdmin });
  const [editing, setEditing] = useState<Editing>(null);
  const [tab, setTab] = useState("vagas");

  const refresh = () =>
    Promise.all(["admin-jobs", "admin-events", "admin-companies"].map((k) => qc.invalidateQueries({ queryKey: [k] })));

  async function remove(action: () => Promise<void>, done: string) {
    try {
      await action();
      toast.success(done);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir.");
    }
  }

  if (role.isLoading) {
    return <div className="container-page py-16 text-center text-muted-foreground">Carregando…</div>;
  }

  if (!isAdmin) {
    return (
      <>
        <PageHeader eyebrow="Administração" title="Acesso restrito" description="Esta área é exclusiva para administradores da plataforma." />
        <div className="container-page py-10">
          <Button asChild size="lg"><Link to="/">Voltar ao início</Link></Button>
        </div>
      </>
    );
  }

  const jobList = jobs.data ?? [];
  const eventList = events.data ?? [];
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
          eyebrow="Administração"
          title={isJob ? (editing.item ? "Editar vaga" : "Nova vaga") : editing.item ? "Editar evento" : "Novo evento"}
          description="Como administrador, você não precisa de uma conta de empresa ou de professor para publicar."
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
      <PageHeader eyebrow="Administração" title="Painel do administrador" description="Crie, edite e exclua vagas e eventos da plataforma.">
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
          <TabsList>
            <TabsTrigger value="vagas">Vagas ({jobList.length})</TabsTrigger>
            <TabsTrigger value="eventos">Eventos ({eventList.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="vagas" className="mt-5">
            {jobs.isLoading ? (
              <p className="text-muted-foreground">Carregando…</p>
            ) : jobList.length === 0 ? (
              <EmptyState title="Nenhuma vaga publicada" description="Publique a primeira vaga da plataforma." action={<Button onClick={() => setEditing({ kind: "job" })}>Nova vaga</Button>} />
            ) : (
              <ul className="space-y-3">
                {jobList.map((j) => (
                  <li key={j.slug} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{j.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {jobPublisher(j)} · {j.city} · {typeLabel[j.type]} · {formatDate(j.publishedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button asChild variant="ghost" size="sm"><Link to="/vagas/$slug" params={{ slug: j.slug }}>Ver</Link></Button>
                      <Button variant="outline" size="sm" onClick={() => setEditing({ kind: "job", item: j })}>Editar</Button>
                      <ConfirmDelete title={j.title} onConfirm={() => remove(() => deleteJob(j.slug), "Vaga excluída.")} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="eventos" className="mt-5">
            {events.isLoading ? (
              <p className="text-muted-foreground">Carregando…</p>
            ) : eventList.length === 0 ? (
              <EmptyState title="Nenhum evento publicado" description="Publique o primeiro evento da plataforma." action={<Button onClick={() => setEditing({ kind: "event" })}>Novo evento</Button>} />
            ) : (
              <ul className="space-y-3">
                {eventList.map((e) => {
                  const d = formatEventDate(e.date);
                  const past = new Date(e.date).getTime() < Date.now();
                  return (
                    <li key={e.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{e.title}{past && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Encerrado</span>}</p>
                        <p className="truncate text-sm text-muted-foreground">{d.day} {d.month}, {d.time} · {e.location} · {e.category}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Button asChild variant="ghost" size="sm"><Link to="/eventos/$id" params={{ id: e.id }}>Ver</Link></Button>
                        <Button variant="outline" size="sm" onClick={() => setEditing({ kind: "event", item: e })}>Editar</Button>
                        <ConfirmDelete title={e.title} onConfirm={() => remove(() => deleteEvent(e.id), "Evento excluído.")} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> As permissões de administrador são validadas pelo banco de dados, não apenas por esta tela.
        </p>
      </div>
    </>
  );
}
