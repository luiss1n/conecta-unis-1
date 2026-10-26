import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Candidatura online ainda não existe: o aviso é honesto e nenhum dado é enviado. */
export function ApplicationNotice({ publisher }: { publisher: string }) {
  return (
    <section aria-labelledby="apply-title" className="rounded-xl border bg-card p-5 shadow-card">
      <h2 id="apply-title" className="font-bold">Candidatura</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        A candidatura pela plataforma ainda não está disponível. Quando for liberada, você revisará seus dados e só então
        eles serão compartilhados com <strong className="text-foreground">{publisher}</strong>.
      </p>
      <Button className="mt-5 w-full" size="lg" disabled>
        <Clock className="h-4 w-4" /> Candidatura em breve
      </Button>
    </section>
  );
}
