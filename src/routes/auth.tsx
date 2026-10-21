import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — CONECTA UNIS" },
      { name: "description", content: "Acesse ou crie sua conta na CONECTA UNIS como empresa ou professor." },
      { property: "og:title", content: "Entrar ou criar conta — CONECTA UNIS" },
      { property: "og:description", content: "Acesse ou crie sua conta na CONECTA UNIS como empresa ou professor." },
    ],
  }),
  component: AuthPage,
});

const creds = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(72),
});

type Mode = "entrar" | "criar" | "recuperar";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("entrar");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "");
    const password = String(f.get("password") ?? "");
    setBusy(true);
    try {
      if (mode === "recuperar") {
        const p = creds.shape.email.safeParse(email);
        if (!p.success) return void toast.error(p.error.issues[0]?.message);
        const { error } = await supabase.auth.resetPasswordForEmail(p.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return void toast.error("Não foi possível enviar o e-mail.");
        return void setSent("Enviamos um link para redefinir sua senha.");
      }
      const p = creds.safeParse({ email, password });
      if (!p.success) return void toast.error(p.error.issues[0]?.message);
      if (mode === "criar") {
        const { data, error } = await supabase.auth.signUp({
          ...p.data,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) return void toast.error(error.message.includes("registered") ? "Este e-mail já tem conta." : /weak|pwned|guess/i.test(error.message) ? "Essa senha é muito comum e fácil de adivinhar. Escolha uma senha mais forte, misturando letras, números e símbolos." : "Não foi possível criar a conta.");
        if (!data.session) return void setSent("Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.");
      } else {
        const { error } = await supabase.auth.signInWithPassword(p.data);
        if (error) return void toast.error("E-mail ou senha incorretos.");
      }
      navigate({ to: "/cadastro" });
    } finally {
      setBusy(false);
    }
  }

  async function google(): Promise<void> {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (r.error) return void toast.error("Não foi possível entrar com Google.");
    if (!r.redirected) navigate({ to: "/cadastro" });
  }

  const title = mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar conta" : "Recuperar senha";

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-card">
        <h1 className="font-display text-2xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesse seu perfil de empresa, visitante ou professor.
        </p>
        {sent ? (
          <p className="mt-6 rounded-md bg-primary-soft p-4 text-sm text-primary">{sent}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            {mode !== "recuperar" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" autoComplete={mode === "criar" ? "new-password" : "current-password"} required minLength={8} />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Aguarde…" : title}</Button>
            {mode !== "recuperar" && (
              <Button type="button" variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>
            )}
          </form>
        )}
        <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm">
          {mode !== "entrar" && <button className="text-primary hover:underline" onClick={() => { setSent(null); setMode("entrar"); }}>Já tenho conta</button>}
          {mode !== "criar" && <button className="text-primary hover:underline" onClick={() => { setSent(null); setMode("criar"); }}>Criar conta</button>}
          {mode === "entrar" && <button className="text-muted-foreground hover:underline" onClick={() => setMode("recuperar")}>Esqueci minha senha</button>}
        </div>
      </div>
    </div>
  );
}
