import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getMySavedJobs, getMySavedJobSlugs, toggleSavedJob } from "@/services/api";
import { formatDate, jobPublisher } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/vagas-salvas")({
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id).maybeSingle();
    if (data?.role !== "visitor") throw redirect({ to: "/cadastro" });
  },
  head: () => ({ meta: [{ title: "Vagas salvas — CONECTA UNIS" }, { name: "robots", content: "noindex" }] }),
  component: SavedJobsPage,
});

function SavedJobsPage() {
  const queryClient = useQueryClient();
  const jobs = useQuery({ queryKey: ["my-saved-jobs"], queryFn: getMySavedJobs });
  async function remove(slug: string) {
    try {
      await toggleSavedJob(slug, true);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["my-saved-jobs"] }), queryClient.invalidateQueries({ queryKey: ["saved-job-slugs"] })]);
      toast.success("Vaga removida das salvas.");
    } catch { toast.error("Não foi possível remover a vaga salva."); }
  }
  return <>
    <PageHeader eyebrow="Minha conta" title="Vagas salvas" description="Guarde oportunidades para consultar e se candidatar depois." />
    <div className="container-page max-w-4xl py-8">
      {jobs.isLoading ? <p className="py-8 text-center text-muted-foreground">Carregando suas vagas…</p> : jobs.isError ? <p role="alert" className="py-8 text-center text-destructive">Não foi possível carregar suas vagas salvas. Tente novamente.</p> : jobs.data?.length ? <ul className="space-y-3">{jobs.data.map((job) => <li key={job.slug} className="flex items-center gap-3 rounded-xl border bg-card p-4"><Bookmark className="h-5 w-5 shrink-0 fill-current text-primary" /><div className="min-w-0 flex-1"><Link to="/vagas/$slug" params={{ slug: job.slug }} className="font-semibold hover:text-primary">{job.title}</Link><p className="truncate text-sm text-muted-foreground">{jobPublisher(job)} · {job.city} · salva em {formatDate(job.publishedAt)}</p></div><Button variant="ghost" size="icon" aria-label={`Remover ${job.title} das vagas salvas`} onClick={() => void remove(job.slug)}><Trash2 className="h-4 w-4" /></Button></li>)}</ul> : <EmptyState title="Nenhuma vaga salva ainda" description="Use o marcador nos cartões de vaga para guardar oportunidades aqui." action={<Button asChild><Link to="/vagas">Explorar vagas</Link></Button>} />}
    </div>
  </>;
}
