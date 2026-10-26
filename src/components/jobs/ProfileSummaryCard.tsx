import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { initialsOf } from "@/lib/jobs";
import { profileCompleteness } from "@/lib/profile";
import { getMyProfile } from "@/services/api";

function Shell({ children }: { children: ReactNode }) {
  return (
    <section aria-label="Seu perfil" className="rounded-xl border bg-card p-5 shadow-card">
      {children}
    </section>
  );
}

/** Mostra à pessoa logada o perfil real que uma empresa veria, e o quanto dele já está preenchido. */
export function ProfileSummaryCard() {
  const { session, ready } = useSession();
  const { data, isPending, isError } = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile, enabled: !!session });

  if (!ready) return null;

  if (!session) {
    return (
      <Shell>
        <p className="font-bold">Seu perfil</p>
        <p className="mt-2 text-sm text-muted-foreground">Entre ou crie uma conta para montar seu perfil e ver como ele aparece para as empresas.</p>
        <Button asChild className="mt-4 w-full"><Link to="/auth">Entrar ou criar conta</Link></Button>
      </Shell>
    );
  }
  if (isPending) return <Shell><p className="text-sm text-muted-foreground">Carregando seu perfil…</p></Shell>;
  if (isError || !data) return <Shell><p className="text-sm text-muted-foreground">Não foi possível carregar seu perfil agora.</p></Shell>;
  if (data.role === "company" || data.role === "professor" || data.role === "admin") return null;

  if (!data.role) {
    return (
      <Shell>
        <p className="font-bold">Conclua seu cadastro</p>
        <p className="mt-2 text-sm text-muted-foreground">Escolha o tipo de conta e complete seus dados para se candidatar.</p>
        <Button asChild className="mt-4 w-full"><Link to="/cadastro">Concluir cadastro</Link></Button>
      </Shell>
    );
  }

  const p = data.profile;
  const name = p.display_name || data.email;
  const detail = [p.education, p.institution].filter(Boolean).join(" · ") || p.headline || "Formação não informada";
  const { percent, missing } = profileCompleteness(p);

  return (
    <Shell>
      <div className="flex items-center gap-3">
        {data.avatarUrl ? (
          <img src={data.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-purple-soft font-bold text-brand-purple">{initialsOf(name)}</span>
        )}
        <div className="min-w-0">
          <p className="truncate font-bold">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{detail}</p>
          {p.city && <p className="truncate text-xs text-muted-foreground">{p.city}</p>}
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Perfil preenchido</span>
          <span className="font-display font-extrabold text-primary">{percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Perfil preenchido">
          <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${percent}%` }} />
        </div>
        {missing.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Falta preencher: {missing.join(", ")}.</p>}
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4 shrink-0" />
        {p.resume_path ? "Currículo anexado" : "Nenhum currículo anexado"}
      </p>
      <Button asChild variant="outline" className="mt-4 w-full"><Link to="/perfil">{percent < 100 ? "Completar perfil" : "Editar perfil"}</Link></Button>
    </Shell>
  );
}
