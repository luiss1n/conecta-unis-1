import { DemoBadge } from "@/components/common/DemoBadge";
import type { CandidateProfile } from "@/types";

export function CandidateProfileCard({ profile, match }: { profile: CandidateProfile; match: number }) {
  const initials = profile.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <section aria-label="Seu perfil" className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-purple-soft font-bold text-brand-purple">{initials}</span>
        <div className="min-w-0">
          <p className="truncate font-bold">{profile.name}</p>
          <p className="truncate text-sm text-muted-foreground">{profile.course} · {profile.period}</p>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Compatibilidade</span>
          <span className="font-display font-extrabold text-primary">{match}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={match} aria-valuemin={0} aria-valuemax={100} aria-label="Compatibilidade simulada">
          <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${match}%` }} />
        </div>
        <div className="mt-3"><DemoBadge>Simulação visual</DemoBadge></div>
      </div>
    </section>
  );
}
