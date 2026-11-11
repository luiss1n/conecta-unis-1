import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Bell, CheckCheck, Menu, Plus, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyNotifications,
  deleteNotification,
  getMyRole,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/api";
import symbolLogo from "@/assets/conecta-unis-symbol.jpeg";
import wordmarkLogo from "@/assets/conecta-unis-wordmark.png";

const nav = [
  { to: "/", label: "Início", exact: true },
  { to: "/vagas", label: "Vagas" },
  { to: "/empresas", label: "Empresas" },
  { to: "/eventos", label: "Eventos" },
] as const;

function accountNav(role: string | null | undefined) {
  if (role === "company" || role === "professor") {
    return [
      { to: "/publicar" as const, label: "Publicar vaga" },
      { to: "/candidaturas" as const, label: "Candidaturas" },
      { to: "/calendario" as const, label: "Calendário" },
      { to: "/alertas" as const, label: "Atendimento NAF" },
    ];
  }
  if (role === "visitor") {
    return [
      { to: "/candidaturas" as const, label: "Minhas candidaturas" },
      { to: "/vagas-salvas" as const, label: "Vagas salvas" },
      { to: "/alertas" as const, label: "Alertas e NAF" },
      { to: "/calendario" as const, label: "Calendário" },
    ];
  }
  if (role === "admin" || role === "naf") return [{ to: "/admin" as const, label: role === "naf" ? "Painel NAF" : "Painel admin" }];
  if (role === undefined) return [];
  return [{ to: "/cadastro" as const, label: "Completar cadastro" }];
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="Conecta Unis — início"
      className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-ring"
    >
      <img
        src={symbolLogo}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full object-cover"
        width={36}
        height={36}
      />
      <img
        src={wordmarkLogo}
        alt="Conecta Unis"
        className={`h-8 w-24 shrink-0 object-contain sm:h-10 sm:w-[120px] ${dark ? "brightness-0 invert" : ""}`}
        width={120}
        height={40}
      />
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { session } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: role } = useQuery({
    queryKey: ["my-role"],
    queryFn: getMyRole,
    enabled: !!session,
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ["my-notifications", session?.user.id],
    queryFn: getMyNotifications,
    enabled: !!session,
    refetchInterval: 30_000,
  });
  const isAdmin = role === "admin" || role === "naf";
  const isStudent = role === "visitor";
  const canPublish = role === "company" || role === "professor";
  const roleLinks = accountNav(role);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  );
  async function markAsRead(id: string) {
    await markNotificationRead(id);
    await qc.invalidateQueries({ queryKey: ["my-notifications", session?.user.id] });
  }
  async function markAllAsRead() {
    await markAllNotificationsRead();
    await qc.invalidateQueries({ queryKey: ["my-notifications", session?.user.id] });
  }
  async function removeNotification(id: string) {
    try {
      await deleteNotification(id);
      await qc.invalidateQueries({ queryKey: ["my-notifications", session?.user.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a notificação.");
    }
  }
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-2 sm:gap-4">
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
          {session && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={
                    unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : "Notificações"
                  }
                  className="relative min-h-11 min-w-11"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-purple px-1 text-[10px] font-semibold leading-none text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl p-0 shadow-lg"
              >
                <div className="flex items-center justify-between border-b px-4 py-3.5">
                  <div>
                    <p className="text-sm font-semibold">Notificações</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {unreadCount > 0
                        ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
                        : "Tudo em dia"}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto gap-1.5 px-2 py-1 text-xs text-primary"
                      onClick={() => void markAllAsRead()}
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como lidas
                    </Button>
                  )}
                </div>
                <ul data-lenis-prevent className="max-h-[min(24rem,65dvh)] divide-y overflow-y-auto overscroll-contain touch-pan-y">
                  {notifications.length === 0 && (
                    <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Você ainda não tem notificações.
                    </li>
                  )}
                  {notifications.map((n) => (
                    <li key={n.id} className="relative">
                      <a
                        href={n.target_path}
                        onClick={async (event) => {
                          event.preventDefault();
                          if (!n.read_at) await markAsRead(n.id);
                          window.location.assign(n.target_path);
                        }}
                        className={`group flex items-start gap-3 py-3.5 pl-4 pr-14 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring ${n.read_at ? "" : "bg-primary-soft/60"}`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-brand-purple"}`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{n.title}</span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                            {n.body}
                          </span>
                        </span>
                        <ArrowUpRight
                          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                          aria-hidden="true"
                        />
                      </a>
                      <button type="button" aria-label={`Remover notificação: ${n.title}`} title="Remover notificação" onClick={() => void removeNotification(n.id)} className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"><X className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          )}
          {session ? (
            <>
              {roleLinks.map((item) => (
                <Button
                  key={item.to}
                  asChild
                  variant={item.to === "/publicar" || item.to === "/admin" ? "default" : "ghost"}
                  size="sm"
                  className="hidden lg:inline-flex"
                >
                  <Link to={item.to}>
                    {item.to === "/publicar" && <Plus className="h-4 w-4" />}
                    {item.to === "/admin" && <ShieldCheck className="h-4 w-4" />}
                    {item.label}
                  </Link>
                </Button>
              ))}
              {session && role && (
                <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
                  <Link to="/alertas">Notificações</Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
                <Link to="/perfil">Meu perfil</Link>
              </Button>
              <Button variant="ghost" size="sm" className="hidden lg:inline-flex" onClick={signOut}>
                Sair
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="min-h-11 min-w-11 lg:hidden" aria-label="Abrir menu">
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
                <Link
                  to={session ? "/perfil" : "/auth"}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 font-medium hover:bg-muted"
                >
                  {session ? "Meu perfil" : "Entrar"}
                </Link>
                {roleLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 font-medium hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
                {session && (
                  <button
                    type="button"
                    onClick={() => { setOpen(false); void signOut(); }}
                    className="min-h-11 rounded-md px-3 py-3 text-left font-medium hover:bg-muted"
                  >
                    Sair
                  </button>
                )}
                {session && role && (
                  <Link
                    to="/alertas"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 font-medium hover:bg-muted"
                  >
                    Preferências de notificações
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
