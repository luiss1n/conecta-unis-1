import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { consumeAuthReturn, getAuthCallbackUrl } from "@/lib/auth-return";
import { passwordRequirements, strongPasswordSchema } from "@/lib/password";
import { supabase } from "@/integrations/supabase/client";
import wordmarkLogo from "@/assets/conecta-unis-wordmark-login.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — CONECTA UNIS" },
      { name: "description", content: "Acesse vagas, eventos e oportunidades da comunidade Unis." },
      { property: "og:title", content: "Entrar — CONECTA UNIS" },
      { property: "og:description", content: "Acesse vagas, eventos e oportunidades da comunidade Unis." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Informe um e-mail válido.").max(255, "O e-mail deve ter até 255 caracteres.");
const passwordSchema = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72, "A senha deve ter até 72 caracteres.");

type Mode = "entrar" | "criar" | "recuperar";

function getIssue<T>(schema: z.ZodType<T>, value: string): string | null {
  const result = schema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? "Confira este campo.");
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#4285F4" d="M48 24.5c0-1.57-.15-3.09-.38-4.55H24v9.02h13.53c-.59 2.96-2.26 5.48-4.75 7.18l7.65 5.93C44.9 37.56 48 31.47 48 24.5Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.65-5.93c-2.13 1.43-4.86 2.27-8.26 2.27-6.35 0-11.72-4.28-13.64-10.03l-7.9 6.11C6.42 42.52 14.51 48 24 48Z" />
      <path fill="#FBBC05" d="M10.36 28.51a14.4 14.4 0 0 1 0-9.02l-7.9-6.11a24 24 0 0 0 0 21.24l7.9-6.11Z" />
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.51 0 6.42 5.48 2.46 13.38l7.9 6.11C12.28 13.78 17.65 9.5 24 9.5Z" />
    </svg>
  );
}

function AuthPage() {
  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { session } = useSession();

  useEffect(() => {
    if (session) window.location.replace(consumeAuthReturn() ?? "/cadastro");
  }, [session]);

  function changeMode(next: Mode) {
    setMode(next);
    setSent(null);
    setAuthError(null);
    setEmailError(null);
    setPasswordError(null);
  }

  function validateEmail(): string | null {
    const error = getIssue(emailSchema, email);
    setEmailError(error);
    return error;
  }

  function validatePassword(): string | null {
    if (mode === "recuperar") return null;
    const error = getIssue(mode === "criar" ? strongPasswordSchema : passwordSchema, password);
    setPasswordError(error);
    return error;
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;
    setAuthError(null);
    const invalidEmail = validateEmail();
    const invalidPassword = validatePassword();
    if (invalidEmail || invalidPassword) {
      if (invalidEmail) emailRef.current?.focus();
      else passwordRef.current?.focus();
      return;
    }

    setBusy(true);
    try {
      if (mode === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("Enviamos um link para redefinir sua senha.");
        return;
      }

      if (mode === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: getAuthCallbackUrl() },
        });
        if (error) throw error;
        if (!data.session) {
          setSent("Conta criada. Confirme o link enviado ao seu e-mail para continuar.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (mode === "entrar" && /invalid login credentials|invalid_credentials/.test(message)) {
        setAuthError("E-mail ou senha incorretos. Confira os dados ou recupere sua senha.");
      } else if (/weak|pwned|guess|password/.test(message)) {
        setPasswordError(`A senha não atende aos requisitos: ${passwordRequirements}`);
        passwordRef.current?.focus();
      } else {
        setAuthError(mode === "recuperar" ? "Não foi possível enviar o link. Confira o e-mail e tente novamente." : "Não foi possível concluir o acesso. Tente novamente em instantes.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function google(): Promise<void> {
    if (googleBusy) return;
    setGoogleBusy(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getAuthCallbackUrl() },
      });
      if (error) {
        const message = error.message.toLowerCase();
        if (/provider is not enabled|unsupported provider/.test(message)) {
          setAuthError("O acesso com Google ainda não está ativado no Supabase. É preciso habilitar o provedor Google e cadastrar as credenciais OAuth.");
        } else {
          setAuthError("Não foi possível iniciar o acesso com Google. Tente novamente ou entre com e-mail e senha.");
        }
      }
    } catch {
      setAuthError("Não foi possível conectar ao Supabase. Verifique a configuração de autenticação e tente novamente.");
    } finally {
      setGoogleBusy(false);
    }
  }

  const title = mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar conta" : "Recuperar senha";

  return (
    <div className="grid min-h-[100svh] place-items-center bg-background px-4 py-8 sm:py-12">
      <section aria-labelledby="auth-title" className="auth-enter w-full max-w-md rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <header className="text-center">
          <h1 id="auth-title" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <Link to="/" aria-label="Conecta Unis — voltar ao início" className="mx-auto mt-5 inline-flex items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-ring">
            <img src={wordmarkLogo} alt="Conecta Unis" className="h-12 w-36 object-contain" width={144} height={48} />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {mode === "recuperar" ? "Informe seu e-mail para receber o link de redefinição." : "Acesse vagas, eventos e oportunidades da comunidade Unis."}
          </p>
        </header>

        {sent ? (
          <div role="status" className="mt-7 rounded-xl border border-primary/20 bg-primary-soft p-4 text-sm text-foreground">
            <p>{sent}</p>
          </div>
        ) : (
          <>
            {authError && <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{authError}</p>}
            <form noValidate onSubmit={submit} className="mt-7 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail <span aria-hidden="true">*</span><span className="sr-only"> obrigatório</span></Label>
                <Input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  onChange={(event) => { setEmail(event.target.value); if (emailError) setEmailError(null); setAuthError(null); }}
                  onBlur={validateEmail}
                  onFocus={() => emailError && setEmailError(null)}
                />
                {emailError && <p id="email-error" role="alert" className="text-sm text-destructive">{emailError}</p>}
              </div>
              {mode !== "recuperar" && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha <span aria-hidden="true">*</span><span className="sr-only"> obrigatório</span></Label>
                  <Input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === "criar" ? "new-password" : "current-password"}
                    required
                    minLength={8}
                    maxLength={72}
                    value={password}
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? "password-error" : undefined}
                    onChange={(event) => { setPassword(event.target.value); if (passwordError) setPasswordError(null); setAuthError(null); }}
                    onBlur={validatePassword}
                    onFocus={() => passwordError && setPasswordError(null)}
                  />
                  {passwordError && <p id="password-error" role="alert" className="text-sm text-destructive">{passwordError}</p>}
                  {mode === "criar" && !passwordError && <p className="text-xs text-muted-foreground">{passwordRequirements}</p>}
                </div>
              )}
              <Button type="submit" className="btn-press w-full" aria-busy={busy}>
                {busy ? "Aguarde…" : mode === "recuperar" ? <><KeyRound className="h-4 w-4" /> Enviar link</> : mode === "criar" ? "Criar conta" : "Entrar"}
              </Button>
            </form>

            {mode !== "recuperar" && (
              <>
                <div className="my-5 flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-border" /><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ou</span><span className="h-px flex-1 bg-border" />
                </div>
                <Button type="button" variant="outline" className="w-full" onClick={google} aria-busy={googleBusy}>
                  <GoogleMark /> {googleBusy ? "Conectando ao Google…" : "Continuar com Google"}
                </Button>
                <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">Usaremos sua conta Google apenas para autenticar seu acesso.</p>
              </>
            )}
          </>
        )}

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-sm">
          {mode === "entrar" ? (
            <>
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => changeMode("criar")}>Criar conta</button>
              <button type="button" className="text-muted-foreground hover:text-foreground hover:underline" onClick={() => changeMode("recuperar")}>Esqueci minha senha</button>
            </>
          ) : (
            <button type="button" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline" onClick={() => changeMode("entrar")}><ArrowLeft className="h-4 w-4" /> Voltar para entrar</button>
          )}
          <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline">Voltar ao site <ArrowRight className="h-3.5 w-3.5" /></Link>
        </footer>
      </section>
      <p className="mt-5 max-w-md text-center text-xs text-muted-foreground">Contas confirmadas com e-mail institucional recebem automaticamente o perfil correspondente.</p>
    </div>
  );
}
