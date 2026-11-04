import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { storeAuthReturn } from "@/lib/auth-return";
import { getMyRole, getMySavedJobSlugs, toggleSavedJob } from "@/services/api";
import type { Job } from "@/types";

export function useSavedJobs() {
  const { session } = useSession();
  const navigate = useNavigate();
  return useQuery({ queryKey: ["saved-job-slugs", session?.user.id], queryFn: getMySavedJobSlugs, enabled: !!session, staleTime: 60_000 });
}

export function SaveJobButton({ job, compact = false }: { job: Job; compact?: boolean }) {
  const { session } = useSession();
  const qc = useQueryClient();
  const saved = useSavedJobs();
  const role = useQuery({ queryKey: ["my-role"], queryFn: getMyRole, enabled: !!session });
  const mutation = useMutation({
    mutationFn: (wasSaved: boolean) => toggleSavedJob(job.slug, wasSaved),
    onMutate: async (wasSaved) => {
      const key = ["saved-job-slugs", session?.user.id];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<string[]>(key) ?? [];
      qc.setQueryData<string[]>(key, wasSaved ? previous.filter((slug) => slug !== job.slug) : [...previous, job.slug]);
      return { previous, key };
    },
    onError: (_error, _wasSaved, context) => { if (context) qc.setQueryData(context.key, context.previous); toast.error("Não foi possível atualizar suas vagas salvas."); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["saved-job-slugs", session?.user.id] }),
  });
  if (session && role.data !== "visitor") return null;
  const isSaved = saved.data?.includes(job.slug) ?? false;
  return <button type="button" aria-label={isSaved ? "Remover vaga salva" : "Salvar vaga"} aria-pressed={isSaved} disabled={mutation.isPending || (!session && !compact)} onClick={(event) => { event.preventDefault(); event.stopPropagation(); if (!session) { storeAuthReturn(`/vagas/${job.slug}`); navigate({ to: "/auth" }); return; } if (role.data === "visitor") mutation.mutate(isSaved); }} className={compact ? "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-primary-soft" : "absolute right-4 top-14 rounded-md p-2 text-muted-foreground hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"}>
    <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current text-primary" : ""}`} />{compact && (isSaved ? "Salva" : "Salvar vaga")}
  </button>;
}
