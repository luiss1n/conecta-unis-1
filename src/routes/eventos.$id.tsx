import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, ChevronRight, Clock, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventInterest } from "@/components/events/EventCard";
import { formatEventDate } from "@/lib/jobs";
import { getEvent } from "@/services/api";

export const Route = createFileRoute("/eventos/$id")({
  loader: async ({ params }) => {
    const event = await getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Evento não encontrado — CONECTA UNIS" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.event.title} — Eventos CONECTA UNIS`;
    return { meta: [{ title: t }, { name: "description", content: loaderData.event.summary }, { property: "og:title", content: t }, { property: "og:description", content: loaderData.event.summary }] };
  },
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="text-2xl font-bold">Evento não encontrado</h1>
      <Link to="/eventos" className="mt-6 inline-block font-semibold text-primary hover:underline">Ver eventos</Link>
    </div>
  ),
  component: EventPage,
});

function EventPage() {
  const { event } = Route.useLoaderData();
  const { interested, mark } = useEventInterest();
  const d = formatEventDate(event.date);
  const done = interested.includes(event.id);
  return (
    <div className="container-page max-w-4xl py-8">
      <nav aria-label="Trilha" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/eventos" className="hover:text-primary">Eventos</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground" aria-current="page">{event.title}</span>
      </nav>
      <article className="mt-6 rounded-xl border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-brand-purple-soft px-2.5 py-0.5 text-xs font-semibold text-brand-purple">{event.category}</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold">{event.title}</h1>
        <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><span className="capitalize">{d.weekday}, {d.day} {d.month}</span></li>
          <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{d.time} – {event.endTime}</li>
          <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{event.location}</li>
          <li className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary" />{event.mode}</li>
        </ul>
        <p className="mt-6 leading-relaxed text-muted-foreground">{event.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => mark(event)} disabled={done}>
            {done ? (<><CheckCircle2 className="h-4 w-4" /> Interesse registrado</>) : "Tenho interesse"}
          </Button>
          <Button asChild size="lg" variant="outline"><Link to="/eventos">Outros eventos</Link></Button>
        </div>
        {done && <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">Seu interesse foi registrado. A inscrição oficial, quando houver, será divulgada pelo organizador.</p>}
      </article>
    </div>
  );
}
