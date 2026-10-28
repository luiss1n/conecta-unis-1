import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { passwordRequirements, strongPasswordSchema } from "@/lib/password";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — CONECTA UNIS" },
      { name: "description", content: "Defina uma nova senha para sua conta CONECTA UNIS." },
      { property: "og:title", content: "Nova senha — CONECTA UNIS" },
      { property: "og:description", content: "Defina uma nova senha para sua conta CONECTA UNIS." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  async function submit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (busy) return;
    const result = strongPasswordSchema.safeParse(password);
    if (!result.success) {
      setPasswordError(result.error.issues[0]?.message ?? "Confira os requisitos da senha.");
      passwordRef.current?.focus();
      return;
    }
    setBusy(true);
    let error: { message: string } | null = null;
    try {
      ({ error } = await supabase.auth.updateUser({ password }));
    } catch {
      return void toast.error("Não foi possível atualizar a senha. Peça um novo link e tente novamente.");
    } finally {
      setBusy(false);
    }
    if (error) return void toast.error("Não foi possível atualizar a senha. Confira o link e os requisitos da senha.");
    toast.success("Senha atualizada!");
    navigate({ to: "/cadastro" });
  }
  return (
    <div className="container-page flex justify-center py-16">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8 shadow-card">
        <h1 className="font-display text-2xl font-extrabold">Nova senha</h1>
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <Input ref={passwordRef} id="password" name="password" type="password" minLength={8} maxLength={72} required autoComplete="new-password" value={password} aria-invalid={!!passwordError} aria-describedby={passwordError ? "password-error" : "password-requirements"} onChange={(event) => { setPassword(event.target.value); if (passwordError) setPasswordError(null); }} onBlur={() => { const result = strongPasswordSchema.safeParse(password); setPasswordError(result.success ? null : result.error.issues[0]?.message ?? null); }} />
          {passwordError && <p id="password-error" role="alert" className="text-sm text-destructive">{passwordError}</p>}
          <p id="password-requirements" className="text-xs text-muted-foreground">{passwordRequirements}</p>
        </div>
        <Button type="submit" className="w-full" aria-busy={busy}>{busy ? "Salvando…" : "Salvar senha"}</Button>
      </form>
    </div>
  );
}
