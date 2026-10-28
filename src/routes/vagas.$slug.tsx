import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Briefcase, CalendarDays, CheckCircle2, ChevronRight, Clock, Gift, MapPin, Monitor } from "lucide-react";
import type { ReactNode } from "react";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { ApplicationConsent } from "@/components/jobs/ApplicationConsent";
import { JobTypeBadge } from "@/components/jobs/JobCard";
import { formatDate, jobPublisher, modeLabel, scheduleLabel, typeLabel } from "@/lib/jobs";
import { getJob } from "@/services/api";

export const Route = createFileRoute("/vagas/$slug")({
  loader: async ({ params }) => {
    const job = await getJob(params.slug);
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Vaga não encontrada — CONECTA UNIS" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.job.title} — ${jobPublisher(loaderData.job)} | CONECTA UNIS`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.job.summary },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.job.summary },
      ],
    };
  },
  notFoundComponent: JobNotFound,
  component: JobDetails,
});

function JobNotFound() {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="text-2xl font-bold">Vaga não encontrada</h1>
      <p className="mt-2 text-muted-foreground">Esta vaga pode ter sido encerrada.</p>
      <Link to="/vagas" className="mt-6 inline-block font-semibold text-primary hover:underline">Ver todas as vagas</Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-card">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i} className="flex gap-2.5 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{i}</li>
      ))}
    </ul>
  );
}

function JobDetails() {
  const { job } = Route.useLoaderData();
  const company = job.company;
  const publisher = jobPublisher(job);
  const meta = [
    { icon: MapPin, label: job.city },
    { icon: Monitor, label: modeLabel[job.mode] },
    { icon: Briefcase, label: typeLabel[job.type] },
    { icon: Clock, label: scheduleLabel[job.schedule] },
    { icon: CalendarDays, label: `Publicada em ${formatDate(job.publishedAt)}` },
  ];

  return (
    <div className="container-page py-8">
      <nav aria-label="Trilha" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Início</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/vagas" className="hover:text-primary">Vagas</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-foreground" aria-current="page">{job.title}</span>
      </nav>

      <header className="mt-6 rounded-xl border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <CompanyAvatar company={company} label={publisher} size="lg" />
          <div className="min-w-0">
            <JobTypeBadge type={job.type} />
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{job.title}</h1>
            {company ? (
              <Link to="/empresas/$slug" params={{ slug: company.slug }} className="mt-1 inline-block font-medium text-primary hover:underline">
                {company.name}
              </Link>
            ) : (
              <p className="mt-1 font-medium text-primary">{publisher}</p>
            )}
          </div>
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {meta.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-1.5"><Icon className="h-4 w-4" />{label}</li>
          ))}
        </ul>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Section title="Descrição da vaga">
            <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
            {job.salary && <p className="mt-3 text-sm"><strong>Remuneração:</strong> {job.salary}</p>}
          </Section>
          <Section title="Atividades principais"><List items={job.activities} /></Section>
          <Section title="Requisitos"><List items={job.requirements} /></Section>
          {job.benefits.length > 0 && (
            <Section title="Benefícios">
              <ul className="flex flex-wrap gap-2">
                {job.benefits.map((b) => (
                  <li key={b} className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success"><Gift className="h-3.5 w-3.5" />{b}</li>
                ))}
              </ul>
            </Section>
          )}
        </div>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <ApplicationConsent companyName={publisher} jobSlug={job.slug} />
        </aside>
      </div>
    </div>
  );
}
