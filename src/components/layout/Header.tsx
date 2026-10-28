import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Bell, CheckCheck, Menu, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { demoNotifications } from "@/data/demo";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/services/api";
import symbolLogo from "@/assets/conecta-unis-symbol.jpeg";
import wordmarkLogo from "@/assets/conecta-unis-wordmark.png";

const nav = [
  { to: "/", label: "Início", exact: true },
  { to: "/vagas", label: "Vagas" },
  { to: "/empresas", label: "Empresas" },
  { to: "/eventos", label: "Eventos" },
] as const;

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" aria-label="Conecta Unis — início" className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
      <img src={symbolLogo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" width={36} height={36} />
      <img
        src={wordmarkLogo}
        alt="Conecta Unis"
        className={`h-10 w-[120px] shrink-0 object-contain ${dark ? "brightness-0 invert" : ""}`}
        width={120}
        height={40}
      />
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => new Set());
  const { session } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: role } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole, enabled: !!session });
  const isAdmin = role === "admin";
  const canPublish = role === "company" || role === "professor";
  const unreadCount = demoNotifications.length - readNotifications.size;
  function markAsRead(id: string) {
    setReadNotifications((current) => new Set(current).add(id));
  }
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : "Notificações"}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-purple px-1 text-[10px] font-semibold leading-none text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl p-0 shadow-lg">
              <div className="flex items-center justify-between border-b px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold">Notificações</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto gap-1.5 px-2 py-1 text-xs text-primary"
                    onClick={() => setReadNotifications(new Set(demoNotifications.map((notification) => notification.id)))}
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como lidas
                  </Button>
                )}
              </div>
              <ul className="max-h-[min(24rem,65vh)] divide-y overflow-y-auto">
                {demoNotifications.map((n) => (
                  <li key={n.id}>
                    <Link
                      to={n.to}
                      onClick={() => markAsRead(n.id)}
                      className={`group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring ${readNotifications.has(n.id) ? "" : "bg-primary-soft/60"}`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${readNotifications.has(n.id) ? "bg-transparent" : "bg-brand-purple"}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{n.title}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{n.body}</span>
                      </span>
                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          {session ? (
            <>
              {canPublish && <Button asChild className="hidden sm:inline-flex"><Link to="/publicar"><Plus className="h-4 w-4" /> Publicar vaga</Link></Button>}
              {isAdmin && (
                <Button asChild size="sm" className="hidden sm:inline-flex"><Link to="/admin"><ShieldCheck className="h-4 w-4" /> Painel admin</Link></Button>
              )}
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/candidaturas">Candidaturas</Link></Button>
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
                {session && <Link to="/candidaturas" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-medium hover:bg-muted">Candidaturas e conversas</Link>}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-medium text-primary hover:bg-muted">
                    Painel do administrador
                  </Link>
                )}
                {canPublish && <Button asChild className="mt-2"><Link to="/publicar" onClick={() => setOpen(false)}><Plus className="h-4 w-4" /> Publicar vaga</Link></Button>}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
