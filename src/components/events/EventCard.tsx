import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, MapPin, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { formatEventDate } from "@/lib/jobs";
import { storeAuthReturn } from "@/lib/auth-return";
import { getMyEventInterestIds, getMyRole, registerForEvent } from "@/services/api";
import type { CareerEvent } from "@/types";

function DateBlock({ iso }: { iso: string }) {
  const d = formatEventDate(iso);
  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-soft text-primary">
      <span className="font-display text-lg font-extrabold leading-none">{d.day}</span>
      <span className="text-[11px] font-semibold uppercase">{d.month}</span>
    </div>
  );
}

export function EventCardCompact({ event }: { event: CareerEvent }) {
  const d = formatEventDate(event.date);
  return (
    <Link
      to="/eventos/$id"
      params={{ id: event.id }}
      className="group flex gap-3 rounded-xl border bg-card p-4 shadow-card transition-colors hover:border-primary/30 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <DateBlock iso={event.date} />
      <div className="min-w-0">
        <h3 className="text-sm font-bold group-hover:text-primary">{event.title}</h3>
        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="truncate">{d.time} · {event.location}</span>
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{event.summary}</p>
      </div>
    </Link>
  );
}

export function useEventInterest() {
  const { session, ready } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const interests = useQuery({
    queryKey: ["my-event-interests", session?.user.id],
    queryFn: getMyEventInterestIds,
    enabled: ready && !!session,
  });
  const role = useQuery({ queryKey: ["my-role"], queryFn: getMyRole, enabled: ready && !!session });
  const registration = useMutation({
    mutationFn: registerForEvent,
    onSuccess: async () => {
      toast.success("Inscrição no evento confirmada.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-event-interests"] }),
        queryClient.invalidateQueries({ queryKey: ["my-event-registrations"] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível confirmar sua inscrição."),
  });
  const mark = (e: CareerEvent) => {
    if (!ready) return;
    if (!session) {
      toast.info("Entre na sua conta de aluno ou professor para se inscrever.");
      storeAuthReturn(`/eventos/${e.id}`);
      navigate({ to: "/auth" });
      return;
    }
    if (role.isLoading || !ready) return;
    if (role.data == null) {
      storeAuthReturn(`/eventos/${e.id}`);
      navigate({ to: "/cadastro" });
      return;
    }
    if (role.data !== "visitor" && role.data !== "professor") {
      toast.error("A inscrição em eventos está disponível para alunos e professores.");
      return;
    }
    registration.mutate(e.id);
  };
  return { interested: interests.data ?? [], mark, registering: registration.isPending ? registration.variables : null };
}

export function EventCard({ event, interested, onInterest, registering = false }: { event: CareerEvent; interested: boolean; onInterest: () => void; registering?: boolean }) {
  const d = formatEventDate(event.date);
  return (
    <article className="flex h-full flex-col rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-start gap-4">
        <DateBlock iso={event.date} />
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-brand-purple-soft px-2.5 py-0.5 text-xs font-semibold text-brand-purple">
            {event.category}
          </span>
          <h3 className="mt-2 text-lg font-bold">{event.title}</h3>
        </div>
      </div>
      <dl className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><dt className="sr-only">Horário</dt><dd className="capitalize">{d.weekday}, {d.time} – {event.endTime}</dd></div>
        <div className="flex items-center gap-2">{event.mode === "Online" ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}<dt className="sr-only">Local</dt><dd>{event.location}</dd></div>
      </dl>
      <p className="mt-3 text-sm">{event.summary}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Button asChild variant="outline">
          <Link to="/eventos/$id" params={{ id: event.id }}>Ver detalhes</Link>
        </Button>
        <Button onClick={onInterest} disabled={interested || registering} variant={interested ? "secondary" : "default"}>
          {interested ? (<><CheckCircle2 className="h-4 w-4" /> Inscrição confirmada</>) : registering ? "Inscrevendo…" : "Inscrever-se"}
        </Button>
      </div>
    </article>
  );
}
