import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { getEvents, getMyEventInterestIds } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/calendario")({
  beforeLoad: async () => { const { data } = await supabase.auth.getUser(); if (!data.user) throw redirect({ to: "/auth" }); },
  head: () => ({ meta: [{ title: "Calendário de carreira — CONECTA UNIS" }, { name: "robots", content: "noindex" }] }),
  component: CareerCalendar,
});

function CareerCalendar() {
  const [month, setMonth] = useState(new Date());
  const events = useQuery({ queryKey: ["career-calendar-events"], queryFn: () => getEvents() });
  const registrations = useQuery({ queryKey: ["my-event-interests"], queryFn: getMyEventInterestIds });
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let day = first; day <= last; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) days.push(day);
  return <>
    <PageHeader eyebrow="Planejamento" title="Calendário de carreira" description="Veja os eventos da plataforma e as atividades em que você se inscreveu." />
    <div className="container-page max-w-5xl py-8">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold capitalize">{format(month, "MMMM yyyy", { locale: ptBR })}</h2><p className="text-xs text-muted-foreground">Ponto azul: evento · marcador azul escuro: inscrito</p></div><div className="flex gap-1"><Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>Hoje</Button><Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => setMonth((m) => subMonths(m, 1))}><ChevronLeft className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => setMonth((m) => addMonths(m, 1))}><ChevronRight className="h-4 w-4" /></Button></div></div>
      {events.isError ? <p role="alert" className="rounded-lg border p-5 text-destructive">Não foi possível carregar os eventos.</p> : <div className="overflow-hidden rounded-xl border bg-card"><div className="grid grid-cols-7 border-b bg-muted/50">{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground">{day}</div>)}</div><div className="grid grid-cols-7">{days.map((day) => { const dayEvents = (events.data ?? []).filter((event) => isSameDay(new Date(event.date), day)); return <div key={day.toISOString()} className={`min-h-24 border-b border-r p-1.5 sm:min-h-28 sm:p-2 ${isSameMonth(day, month) ? "bg-card" : "bg-muted/20"}`}><span className={`text-xs ${isSameDay(day, new Date()) ? "grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground" : isSameMonth(day, month) ? "text-foreground" : "text-muted-foreground/60"}`}>{format(day, "d")}</span><ul className="mt-1 space-y-1">{dayEvents.map((event) => { const registered = registrations.data?.includes(event.id); return <li key={event.id}><Link to="/eventos/$id" params={{ id: event.id }} title={`${event.title} · ${format(new Date(event.date), "HH:mm")}`} className={`block truncate rounded px-1 py-1 text-[10px] leading-tight sm:text-xs ${registered ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}><CalendarDays className="mr-1 inline h-3 w-3" />{event.title}</Link></li>; })}</ul></div>; })}</div></div>}
      {events.isLoading && <p className="mt-3 text-sm text-muted-foreground">Carregando calendário…</p>}
    </div>
  </>;
}
