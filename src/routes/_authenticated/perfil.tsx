import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { Building2, Camera, Download, FileText, GraduationCap, MapPin, Pencil, Trash2, Upload, UserRound, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMyProfile, saveMyProfile, uploadProfileFile, removeProfileFile } from "@/services/api";
import { profileSchema, profileKindLabels, formatBrazilianPhone, type ProfileFileKind } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [
    { title: "Meu perfil profissional — CONECTA UNIS" },
    { name: "description", content: "Seu perfil profissional, formação e currículo na CONECTA UNIS." },
    { property: "og:title", content: "Meu perfil profissional — CONECTA UNIS" },
    { property: "og:description", content: "Seu perfil profissional, formação e currículo na CONECTA UNIS." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Profile,
});

function Profile() {
  const qc = useQueryClient();
  const { data, isPending, error, refetch } = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileKind = useRef<ProfileFileKind>("avatar");
  const input = useRef<HTMLInputElement>(null);
  const refresh = async () => { await qc.invalidateQueries({ queryKey: ["my-profile"] }); await qc.invalidateQueries({ queryKey: ["registration"] }); };
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = profileSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Verifique os dados"); return; }
    setBusy(true);
    try { await saveMyProfile(parsed.data); await refresh(); setEditing(false); toast.success("Perfil atualizado!"); }
    catch { toast.error("Não foi possível salvar o perfil. Tente novamente."); }
    finally { setBusy(false); }
  }
  function chooseFile(kind: ProfileFileKind) {
    fileKind.current = kind;
    if (!input.current) return;
    input.current.accept = kind === "resume" ? "application/pdf" : "image/jpeg,image/png,image/webp";
    input.current.click();
  }
  async function upload(file: File) {
    setBusy(true);
    try { await uploadProfileFile(file, fileKind.current); await refresh(); toast.success("Arquivo atualizado!"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível enviar o arquivo."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  async function remove(kind: ProfileFileKind) {
    setBusy(true);
    try { await removeProfileFile(kind); await refresh(); toast.success("Arquivo removido."); }
    catch { toast.error("Não foi possível remover o arquivo."); }
    finally { setBusy(false); }
  }
  if (isPending) return <div className="container-page py-12"><div className="h-60 animate-pulse rounded-lg bg-muted" /><p className="mt-6 text-muted-foreground">Carregando perfil…</p></div>;
  if (error || !data) return <div className="container-page py-16"><h1 className="text-2xl font-bold">Não foi possível carregar seu perfil</h1><Button className="mt-4" onClick={() => refetch()}>Tentar novamente</Button></div>;
  const p = data.profile;
  const name = data.role === "company" ? data.company?.name ?? p.display_name : p.display_name;
  const initials = (name || "Meu perfil").split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase();
  const institution = p.institution || data.professor?.institution;
  const education = p.education || data.professor?.department;
  const Icon = data.role === "company" ? Building2 : data.role === "professor" ? GraduationCap : UserRound;
  const fields = [
    ["display_name", data.role === "company" ? "Nome do responsável" : "Nome completo", 100],
    ["headline", "Título profissional", 160], ["address", "Endereço", 250], ["city", "Cidade onde reside", 100],
    ["state", "Estado", 100], ["country", "País", 100], ["education", "O que estuda / formação", 160],
    ["institution", "Instituição de ensino", 160], ["phone", "Telefone", 30],
  ] as const;
  return (
    <div className="container-page max-w-6xl py-8 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-muted-foreground">MINHA CONTA <span className="mx-2 text-border">/</span> Perfil</p><Button asChild variant="ghost" size="sm"><Link to="/cadastro">Dados do cadastro</Link></Button></div>
      <input ref={input} type="file" className="hidden" aria-label="Arquivo do perfil" onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); }} />
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <section aria-label="Meu perfil" className="overflow-hidden rounded-lg border bg-card">
            <div className="relative h-44 bg-footer sm:h-56">
              {data.bannerUrl && <img src={data.bannerUrl} alt="Capa do perfil" className="h-full w-full object-cover" />}
              <div className="absolute right-4 top-4 flex gap-2">
                {data.bannerUrl && <Button title="Remover capa" aria-label="Remover capa" variant="secondary" size="icon" disabled={busy} onClick={() => remove("banner")}><Trash2 className="h-4 w-4" /></Button>}
                <Button title="Alterar capa" aria-label="Alterar capa" variant="secondary" size="icon" disabled={busy} onClick={() => chooseFile("banner")}><Camera className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="relative px-5 pb-7 sm:px-7">
              <div className="relative -mt-16 mb-5 w-32 sm:-mt-20 sm:w-40">
                <div className="grid aspect-square place-items-center overflow-hidden rounded-full border-4 border-card bg-primary-soft text-3xl font-bold text-primary sm:text-4xl">
                  {data.avatarUrl ? <img src={data.avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" /> : initials}
                </div>
                <Button title="Alterar foto" aria-label="Alterar foto" size="icon" variant="secondary" className="absolute bottom-1 right-0 rounded-full border" disabled={busy} onClick={() => chooseFile("avatar")}><Camera className="h-4 w-4" /></Button>
              </div>
              <Button title="Editar perfil" aria-label="Editar perfil" size="icon" variant="ghost" className="absolute right-5 top-20 sm:top-24" onClick={() => setEditing(true)}><Pencil className="h-5 w-5" /></Button>
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0 flex-1"><h1 className="break-words text-2xl font-bold sm:text-3xl">{name || "Meu perfil"}</h1>
                  {p.headline && <p className="mt-2 break-words text-base">{p.headline}</p>}
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{[p.city, p.state, p.country].filter(Boolean).join(", ") || "Localização não informada"}</p>
                </div>
                {institution && <p className="flex max-w-56 items-center gap-3 text-sm font-semibold"><GraduationCap className="h-8 w-8 shrink-0 text-primary" />{institution}</p>}
              </div>
              <div className="mt-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary"><Icon className="h-3.5 w-3.5" />{data.role ? profileKindLabels[data.role] : "Tipo de perfil não selecionado"}</span></div>
              <div className="mt-6 flex flex-wrap gap-2"><Button onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Editar perfil</Button><Button variant="outline" disabled={busy} onClick={() => chooseFile("resume")}><Upload className="h-4 w-4" />{data.resumeUrl ? "Atualizar currículo" : "Adicionar currículo"}</Button></div>
              {!data.role && <p className="mt-4 text-sm text-primary"><Link to="/cadastro">Selecione seu tipo de perfil para completar o cadastro →</Link></p>}
            </div>
          </section>
          <section className="border-b py-7"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{data.role === "company" ? "Sobre a empresa" : "Sobre"}</h2><Button title="Editar sobre" aria-label="Editar sobre" variant="ghost" size="icon" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{p.bio || "Nenhuma apresentação adicionada."}</p></section>
          <section className="border-b py-7"><h2 className="text-xl font-bold">Formação acadêmica</h2><div className="mt-5 flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><GraduationCap /></div><div><p className="font-semibold">{institution || "Instituição não informada"}</p><p className="mt-1 text-sm text-muted-foreground">{education || "Formação não informada"}</p>{data.professor?.qualification && <p className="mt-1 text-sm text-muted-foreground">{data.professor.qualification}</p>}</div></div></section>
          <section className="py-7"><h2 className="text-xl font-bold">Currículo</h2>{data.resumeUrl ? <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border p-4"><FileText className="h-8 w-8 shrink-0 text-primary" /><p className="min-w-0 flex-1 break-words text-sm font-semibold">{p.resume_name}</p><Button asChild variant="outline" size="sm"><a href={data.resumeUrl} target="_blank" rel="noreferrer"><Download className="h-4 w-4" />Abrir PDF</a></Button><Button title="Remover currículo" aria-label="Remover currículo" variant="ghost" size="icon" disabled={busy} onClick={() => remove("resume")}><Trash2 className="h-4 w-4" /></Button></div> : <p className="mt-3 text-sm text-muted-foreground">Nenhum currículo adicionado.</p>}</section>
        </div>
        <aside className="border-t pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-2">
          <h2 className="font-bold">Informações de contato</h2><p className="mt-2 text-xs text-muted-foreground">Visíveis apenas para você</p>
          <div className="mt-6 space-y-5 text-sm"><div className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><p className="min-w-0 break-all">{data.email}</p></div>{p.phone && <div className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" /><p>{p.phone}</p></div>}<div className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-muted-foreground" /><p className="break-words">{p.address || "Endereço não informado"}</p></div></div>
          <div className="mt-8 border-t pt-5"><h3 className="text-sm font-bold">{data.role ? profileKindLabels[data.role] : "Cadastro"}</h3>{data.company && <><p className="mt-2 text-sm">{data.company.name}</p><p className="mt-1 text-sm text-muted-foreground">{data.company.sector}</p></>}<Button asChild variant="link" className="mt-2 h-auto p-0"><Link to="/cadastro">Editar dados do cadastro</Link></Button></div>
          {data.avatarUrl && <Button variant="ghost" size="sm" className="mt-6 text-muted-foreground" disabled={busy} onClick={() => remove("avatar")}><Trash2 className="h-4 w-4" />Remover foto</Button>}
          {busy && <p role="status" className="mt-4 text-sm text-primary">Salvando…</p>}
        </aside>
      </div>
      <Dialog open={editing} onOpenChange={setEditing}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Editar perfil</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">{fields.map(([key, label, max]) => <div key={key} className={key === "headline" || key === "address" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}><Label htmlFor={`profile-${key}`}>{label}</Label><Input id={`profile-${key}`} name={key} defaultValue={key === "phone" ? formatBrazilianPhone(p.phone) : p[key]} maxLength={key === "phone" ? 15 : max} inputMode={key === "phone" ? "tel" : undefined} placeholder={key === "phone" ? "(XX) XXXXX-XXXX" : undefined} onChange={key === "phone" ? (event) => { event.currentTarget.value = formatBrazilianPhone(event.currentTarget.value); } : undefined} required={key === "display_name" || key === "city"} /></div>)}</div><div className="space-y-1.5"><Label htmlFor="profile-bio">Sobre</Label><Textarea id="profile-bio" name="bio" defaultValue={p.bio} maxLength={2000} rows={4} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar alterações"}</Button></div></form></DialogContent></Dialog>
    </div>
  );
}
