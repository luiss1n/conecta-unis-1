import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

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
  async function submit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (password.length < 8) return void toast.error("A senha precisa de pelo menos 8 caracteres");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return void toast.error("Link expirado ou inválido. Peça um novo.");
    toast.success("Senha atualizada!");
    navigate({ to: "/cadastro" });
  }
  return (
    <div className="container-page flex justify-center py-16">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8 shadow-card">
        <h1 className="font-display text-2xl font-extrabold">Nova senha</h1>
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>Salvar senha</Button>
      </form>
    </div>
  );
}
