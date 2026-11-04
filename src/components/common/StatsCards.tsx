import { Briefcase, Building2, Gift, GraduationCap } from "lucide-react";
import { CountUp } from "@/components/reveal";
import type { PlatformStats } from "@/services/api";

const stats = [
  { key: "users", label: "Pessoas cadastradas", icon: GraduationCap },
  { key: "jobs", label: "Vagas publicadas", icon: Briefcase },
  { key: "companies", label: "Empresas cadastradas", icon: Building2 },
  { key: "events", label: "Eventos publicados", icon: Gift },
] as const;

export function StatsCards({ values, error = false }: { values?: PlatformStats; error?: boolean }) {
  return (
    <section aria-labelledby="stats-title" className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
      <h2 id="stats-title" className="text-xl font-bold">A plataforma em números</h2>
      <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.key} className="rounded-xl bg-muted/60 p-4">
              <Icon className="h-5 w-5 text-brand-purple" />
              <p className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
                {error || !values ? "—" : <CountUp to={values[s.key]} />}
              </p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </li>
          );
        })}
      </ul>
      {error && <p role="status" className="mt-4 text-sm text-muted-foreground">Não foi possível carregar os números reais agora. Tente novamente mais tarde.</p>}
    </section>
  );
}
