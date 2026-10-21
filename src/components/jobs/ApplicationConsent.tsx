import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function ApplicationConsent({ companyName }: { companyName: string }) {
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <section className="rounded-xl border border-success/30 bg-success-soft p-5" aria-live="polite">
        <CheckCircle2 className="h-6 w-6 text-success" />
        <p className="mt-2 font-bold">Candidatura simulada com sucesso</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta é uma demonstração: nenhuma inscrição foi registrada e nenhum dado foi enviado à empresa.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => { setDone(false); setAgreed(false); }}>
          Refazer demonstração
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="apply-title" className="rounded-xl border bg-card p-5 shadow-card">
      <h2 id="apply-title" className="font-bold">Candidatura</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Ao se candidatar, seus dados necessários (nome, curso, contato e currículo) serão compartilhados com{" "}
        <strong className="text-foreground">{companyName}</strong>, responsável pela vaga.
      </p>
      <div className="mt-4 flex items-start gap-3">
        <Checkbox
          id="consent"
          checked={agreed}
          aria-invalid={error}
          aria-describedby={error ? "consent-error" : undefined}
          onCheckedChange={(v) => { setAgreed(v === true); if (v) setError(false); }}
          className="mt-0.5 aria-invalid:border-destructive"
        />
        <label htmlFor="consent" className="text-sm leading-snug">
          Declaro que li e estou ciente da{" "}
          <Link to="/privacidade" className="font-medium text-primary underline-offset-2 hover:underline">política de privacidade</Link>.
        </label>
      </div>
      {error && (
        <p id="consent-error" role="alert" className="mt-2 text-sm text-destructive">
          Confirme a ciência da política de privacidade para continuar.
        </p>
      )}
      <Button
        className="mt-5 w-full"
        size="lg"
        onClick={() => (agreed ? setDone(true) : setError(true))}
      >
        Confirmar candidatura
      </Button>
    </section>
  );
}
