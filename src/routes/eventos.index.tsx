import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoBadge } from "@/components/common/DemoBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { EventCard, useEventInterest } from "@/components/events/EventCard";
import { FilterChips } from "@/components/jobs/FilterChips";
import { getEvents } from "@/services/api";
import type { EventCategory } from "@/types";

export const Route = createFileRoute("/eventos/")({
  head: () => ({
    meta: [
      { title: "Eventos de carreira — CONECTA UNIS" },
      { name: "description", content: "Workshops, feiras, palestras e oficinas de desenvolvimento profissional." },
      { property: "og:title", content: "Eventos de carreira — CONECTA UNIS" },
      { property: "og:description", content: "Workshops, feiras, palestras e oficinas de desenvolvimento profissional." },
    ],
  }),
  component: EventsPage,
});

const cats: EventCategory[] = ["Workshop", "Feira", "Palestra", "Oficina"];

function EventsPage() {
  const [sel, setSel] = useState<EventCategory[]>([]);
  const { interested, mark } = useEventInterest();
  const list = getEvents().filter((e) => !sel.length || sel.includes(e.category));
  return (
    <>
      <PageHeader eyebrow="Eventos" title="Eventos e atividades" description="Atividades de desenvolvimento profissional promovidas com o Núcleo de Carreira e Empregabilidade.">
        <div className="flex flex-col gap-4">
          <DemoBadge>Eventos de exemplo</DemoBadge>
          <FilterChips label="Categorias" chips={cats.map((c) => ({ id: c, label: c, active: sel.includes(c) }))} onToggle={(id) => setSel((p) => p.includes(id as EventCategory) ? p.filter((x) => x !== id) : [...p, id as EventCategory])} />
        </div>
      </PageHeader>
      <div className="container-page py-10">
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((e) => (
            <li key={e.id}><EventCard event={e} interested={interested.includes(e.id)} onInterest={() => mark(e)} /></li>
          ))}
        </ul>
      </div>
    </>
  );
}
