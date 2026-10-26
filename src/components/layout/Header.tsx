import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/services/api";
import logo from "@/assets/conecta-unis-logo.png";

const nav = [
  { to: "/", label: "Início", exact: true },
  { to: "/vagas", label: "Vagas" },
  { to: "/empresas", label: "Empresas" },
  { to: "/eventos", label: "Eventos" },
  { to: "/sobre", label: "Sobre nós" },
] as const;

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
      <img src={logo} alt="" className="h-9 w-9 shrink-0 object-contain" width={36} height={36} />
      <span className="font-display text-lg font-extrabold tracking-tight">
        CONECTA <span className={dark ? "text-footer-accent" : "text-brand-gradient"}>UNIS</span>
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { session } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: role } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole, enabled: !!session });
  const isAdmin = role === "admin";
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />
        <nav aria-label="Principal" className="ml-6 hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: "exact" in n }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "!text-primary bg-primary-soft" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/publicar">
              <Plus className="h-4 w-4" /> Publicar vaga
            </Link>
          </Button>
          {session ? (
            <>
              {isAdmin && (
                <Button asChild size="sm" className="hidden sm:inline-flex"><Link to="/admin"><ShieldCheck className="h-4 w-4" /> Painel admin</Link></Button>
              )}
              <Button asChild variant="outline" size="sm"><Link to="/perfil">Meu perfil</Link></Button>
              <Button variant="ghost" size="sm" onClick={signOut}>Sair</Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm"><Link to="/auth">Entrar</Link></Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Menu móvel" className="mt-2 flex flex-col gap-1 px-4">
                {nav.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: "exact" in n }}
                    className="rounded-md px-3 py-3 text-base font-medium hover:bg-muted"
                    activeProps={{ className: "bg-primary-soft text-primary" }}
                  >
                    {n.label}
                  </Link>
                ))}
                <hr className="my-2" />
                <Link to={session ? "/perfil" : "/auth"} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-medium hover:bg-muted">
                  {session ? "Meu perfil" : "Entrar"}
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-medium text-primary hover:bg-muted">
                    Painel do administrador
                  </Link>
                )}
                <Button asChild className="mt-2">
                  <Link to="/publicar" onClick={() => setOpen(false)}>
                    <Plus className="h-4 w-4" /> Publicar vaga
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
