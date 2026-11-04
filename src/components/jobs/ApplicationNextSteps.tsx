import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CircleHelp, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ApplicationListItem } from "@/services/api";
import { getApplicationNextSteps, saveApplicationNextSteps } from "@/services/api";

const checklistItems = [
  ["review_job", "Revise atividades e requisitos da vaga"],
  ["tailor_resume", "Adapte o currículo para destacar experiências relevantes"],
  ["prepare_examples", "Separe exemplos que demonstrem suas competências"],
  ["prepare_questions", "Anote perguntas para a conversa com a empresa"],
] as const;

type Checklist = Record<(typeof checklistItems)[number][0], boolean>;

function tokens(value: string) {
  return new Set(value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").match(/[a-z0-9+#.]{3,}/g) ?? []);
}

export function ApplicationNextSteps({ item, profileText }: { item: ApplicationListItem; profileText: string }) {
  const qc = useQueryClient();
  const { application, job } = item;
  const queryKey = ["application-next-steps", application.id];
  const saved = useQuery({ queryKey, queryFn: () => getApplicationNextSteps(application.id) });
  const [reflection, setReflection] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (value: { checklist: Checklist; reflection: string }) => saveApplicationNextSteps(application.id, value),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey }); toast.success("Seu plano foi salvo."); },
    onError: () => toast.error("Não foi possível salvar. Tente novamente."),
  });
  const profileTokens = tokens(profileText);
  const requirements = job.requirements.filter((requirement) => requirement.trim().length > 0);
  const matched = requirements.filter((requirement) => {
    const words = [...tokens(requirement)];
    return words.length > 0 && words.some((word) => profileTokens.has(word));
  });
  const missing = requirements.filter((requirement) => !matched.includes(requirement));
  const checklist = { review_job: false, tailor_resume: false, prepare_examples: false, prepare_questions: false, ...saved.data?.checklist } as Checklist;
  const completed = checklistItems.filter(([key]) => checklist[key]).length;
  const currentReflection = reflection ?? saved.data?.reflection ?? "";

  async function updateChecklist(key: keyof Checklist, checked: boolean) {
    const next = { ...checklist, [key]: checked };
    await mutation.mutateAsync({ checklist: next, reflection: currentReflection });
  }

  return <details className="mt-3 rounded-lg border bg-background p-4">
    <summary className="cursor-pointer list-none font-semibold focus-visible:outline-2 focus-visible:outline-ring">Compatibilidade e próximos passos</summary>
    <p className="mt-2 text-sm text-muted-foreground">Esta comparação é uma referência baseada no texto do seu perfil e nos requisitos publicados; não prevê decisões da empresa.</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="rounded-md bg-primary-soft/50 p-3"><p className="font-medium">Pontos encontrados no perfil ({matched.length})</p>{matched.length ? <ul className="mt-2 space-y-1 text-sm">{matched.map((value) => <li key={value} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{value}</li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">Não encontramos termos em comum. Complete o perfil para uma comparação melhor.</p>}</div>
      <div className="rounded-md border p-3"><p className="font-medium">Requisitos para revisar ({missing.length})</p>{missing.length ? <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">{missing.map((value) => <li key={value}>{value}</li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">Revise os requisitos completos na descrição da vaga.</p>}</div>
    </div>
    <div className="mt-4"><p className="flex items-center gap-2 font-medium"><ClipboardCheck className="h-4 w-4" />Checklist de preparação · {completed}/{checklistItems.length}</p><div className="mt-2 grid gap-2">{checklistItems.map(([key, label]) => <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={!!checklist[key]} disabled={saved.isLoading || mutation.isPending} onChange={(event) => void updateChecklist(key, event.target.checked)} className="h-4 w-4 accent-primary" />{label}</label>)}</div></div>
    <label className="mt-4 block text-sm font-medium" htmlFor={`reflection-${application.id}`}><span className="flex items-center gap-2"><CircleHelp className="h-4 w-4" />Aprendizados ou próximos passos</span></label>
    <textarea id={`reflection-${application.id}`} value={currentReflection} maxLength={2000} onChange={(event) => setReflection(event.target.value)} onBlur={() => { if (reflection !== null && reflection !== (saved.data?.reflection ?? "")) void mutation.mutateAsync({ checklist: checklist as Checklist, reflection }); }} rows={3} className="mt-2 w-full rounded-md border bg-background p-3 text-sm" placeholder="Registre o que deseja preparar ou lembrar para esta candidatura." />
    <p className="mt-1 text-right text-xs text-muted-foreground">{currentReflection.length}/2000 · visível somente para você</p>
    {saved.isError && <p role="alert" className="mt-2 text-sm text-destructive">Não foi possível carregar seu plano. Atualize a página e tente novamente.</p>}
  </details>;
}
