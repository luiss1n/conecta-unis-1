import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, CalendarDays, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { EventForm } from "@/components/forms/EventForm";
import { JobForm } from "@/components/forms/JobForm";
import { createEvent, createJob, getMyProfile } from "@/services/api";

export const Route = createFileRoute("/_authenticated/publicar")({
  head: () => ({
    meta: [
      { title: "Publicar — CONECTA UNIS" },
      { name: "description", content: "Publique vagas e eventos para estudantes e egressos da Unis." },
    ],
  }),
  component: PublishPage,
});

function PublishPage() {
  const { data, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile });
  const [done, setDone] = useState(false);

  if (isLoading) {
    return <div className="container-page py-16 text-center text-muted-foreground">Carregando…</div>;
  }

  const role = data?.role ?? null;

  if (!role || role === "visitor") {
    return (
      <>
        <PageHeader eyebrow="Publicar" title="Complete seu cadastro para publicar" description="Apenas contas de empresa podem publicar vagas, e contas de professor podem publicar eventos." />
        <div className="container-page py-10">
          <Button asChild size="lg"><Link to="/cadastro">Completar cadastro</Link></Button>
        </div>
      </>
    );
  }

  if (role === "admin") {
    return (
      <>
        <PageHeader eyebrow="Publicar" title="Use o painel do administrador" description="Como administrador, você cria e gerencia vagas e eventos pelo painel." />
        <div className="container-page py-10">
          <Button asChild size="lg"><Link to="/admin">Ir para o painel</Link></Button>
        </div>
      </>
    );
  }

  const isCompany = role === "company";

  return (
    <>
      <PageHeader
        eyebrow="Publicar"
        title={isCompany ? "Publicar nova vaga" : "Publicar novo evento"}
        description={isCompany
          ? "A vaga ficará visível para estudantes e egressos assim que for publicada."
          : "O evento ficará visível para toda a comunidade assim que for publicado."}
      />
      <div className="container-page max-w-2xl py-10">
        {done ? (
          <div className="rounded-xl border bg-card p-8 text-center shadow-card" aria-live="polite">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <h2 className="mt-3 text-lg font-bold">{isCompany ? "Vaga publicada!" : "Evento publicado!"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Já está visível para a comunidade.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Button variant="outline" onClick={() => setDone(false)}>Publicar outra</Button>
              <Button asChild><Link to={isCompany ? "/vagas" : "/eventos"}>Ver publicação</Link></Button>
            </div>
          </div>
        ) : (
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary-soft text-primary">
                {isCompany ? <Briefcase className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
              </span>
              <div>
                <h2 className="font-bold">{isCompany ? "Dados da vaga" : "Dados do evento"}</h2>
                <p className="text-sm text-muted-foreground">
                  {isCompany ? `Empresa: ${data?.company?.name ?? ""}` : "Publicado como professor"}
                </p>
              </div>
            </div>
            {isCompany ? (
              <JobForm submitLabel="Publicar vaga" savingLabel="Publicando…" successMessage="Vaga publicada!" onSubmit={createJob} onDone={() => setDone(true)} />
            ) : (
              <EventForm submitLabel="Publicar evento" savingLabel="Publicando…" successMessage="Evento publicado!" onSubmit={createEvent} onDone={() => setDone(true)} />
            )}
          </section>
        )}
      </div>
    </>
  );
}
