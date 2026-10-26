import { Briefcase, Building2, CalendarDays } from "lucide-react";
import { CountUp } from "@/components/reveal";

interface Props {
  jobs: number;
  companies: number;
  events: number;
}

/** Contagens reais vindas do banco. Sem nenhum dado cadastrado, a seção não aparece. */
export function StatsCards({ jobs, companies, events }: Props) {
  if (jobs + companies + events === 0) return null;
  const items = [
    { label: jobs === 1 ? "Vaga disponível" : "Vagas disponíveis", value: jobs, Icon: Briefcase },
    { label: companies === 1 ? "Empresa cadastrada" : "Empresas cadastradas", value: companies, Icon: Building2 },
    { label: events === 1 ? "Evento agendado" : "Eventos agendados", value: events, Icon: CalendarDays },
  ];
  return (
    <section aria-labelledby="stats-title" className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
      <h2 id="stats-title" className="text-xl font-bold">A plataforma em números</h2>
      <ul className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        {items.map(({ label, value, Icon }) => (
          <li key={label} className="rounded-xl bg-muted/60 p-3 sm:p-4">
            <Icon className="h-5 w-5 text-brand-purple" />
            <p className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
              <CountUp to={value} />
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
