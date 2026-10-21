import { Briefcase, Building2, Gift, GraduationCap } from "lucide-react";
import { demoStats } from "@/data/demo";
import { DemoBadge } from "./DemoBadge";
import { CountUp } from "@/components/reveal";

const icons = [GraduationCap, Briefcase, Building2, Gift] as const;

export function StatsCards() {
  return (
    <section aria-labelledby="stats-title" className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="stats-title" className="text-xl font-bold">A plataforma em números</h2>
        <DemoBadge>Indicadores ilustrativos, não oficiais</DemoBadge>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {demoStats.map((s, i) => {
          const Icon = icons[i % icons.length] ?? Gift;
          return (
            <li key={s.label} className="rounded-xl bg-muted/60 p-4">
              <Icon className="h-5 w-5 text-brand-purple" />
              <p className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
                <CountUp to={Number(String(s.value).replace(/\D/g, ""))} />
              </p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
