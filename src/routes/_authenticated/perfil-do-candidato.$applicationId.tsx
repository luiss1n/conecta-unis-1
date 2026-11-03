import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, MapPin, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApplicationCandidateProfile } from "@/services/api";

export const Route = createFileRoute("/_authenticated/perfil-do-candidato/$applicationId")({
  head: () => ({ meta: [
    { title: "Perfil do candidato — CONECTA UNIS" },
    { name: "description", content: "Perfil profissional do candidato nesta conversa." },
  ] }),
  component: CandidateProfile,
});

function CandidateProfile() {
  const { applicationId } = Route.useParams();
  const query = useQuery({
    queryKey: ["application-candidate-profile", applicationId],
    queryFn: () => getApplicationCandidateProfile(applicationId),
  });

  if (query.isLoading) return <div className="container-page max-w-3xl py-12 text-muted-foreground">Carregando perfil…</div>;
  if (query.isError || !query.data) return (
    <div className="container-page max-w-3xl py-12">
      <Button asChild variant="ghost" className="mb-5"><Link to="/conversas/$applicationId" params={{ applicationId }}><ArrowLeft className="h-4 w-4" /> Voltar à conversa</Link></Button>
      <h1 className="text-2xl font-bold">Perfil indisponível</h1>
      <p className="mt-2 text-sm text-muted-foreground">Este perfil só pode ser visto por quem participa da candidatura.</p>
    </div>
  );

  const candidate = query.data;
  const initials = candidate.display_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <main className="container-page max-w-3xl py-8 sm:py-12">
      <Button asChild variant="ghost" className="mb-6"><Link to="/conversas/$applicationId" params={{ applicationId }}><ArrowLeft className="h-4 w-4" /> Voltar à conversa</Link></Button>
      <article className="overflow-hidden rounded-xl border bg-card">
        <div className="h-2 bg-primary" aria-hidden="true" />
        <div className="p-6 sm:p-9">
          <header className="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border bg-primary-soft text-2xl font-bold text-primary">
              {candidate.avatarUrl ? <img src={candidate.avatarUrl} alt={`Foto de ${candidate.display_name}`} className="h-full w-full object-cover" /> : initials || <UserRound className="h-10 w-10" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Perfil do candidato</p>
              <h1 className="mt-1 break-words text-3xl font-extrabold">{candidate.display_name}</h1>
              {candidate.username && <p className="mt-1 text-sm text-muted-foreground">@{candidate.username}</p>}
              {candidate.headline && <p className="mt-2 text-base">{candidate.headline}</p>}
              <a className="mt-2 inline-block break-all text-sm text-primary underline-offset-2 hover:underline" href={`mailto:${candidate.email}`}>{candidate.email}</a>
              {candidate.city && <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{candidate.city}</p>}
            </div>
          </header>

          <section className="border-b py-6" aria-labelledby="candidate-about-title">
            <h2 id="candidate-about-title" className="text-lg font-bold">Sobre</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{candidate.bio || "Este candidato ainda não adicionou uma apresentação."}</p>
          </section>

          <section className="py-6" aria-labelledby="candidate-education-title">
            <h2 id="candidate-education-title" className="flex items-center gap-2 text-lg font-bold"><GraduationCap className="h-5 w-5 text-primary" /> Formação acadêmica</h2>
            <div className="mt-3">
              <p className="font-semibold">{candidate.institution || "Instituição não informada"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{candidate.education || "Formação não informada"}</p>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
