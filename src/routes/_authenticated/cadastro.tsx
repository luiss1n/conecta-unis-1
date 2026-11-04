import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, GraduationCap, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { consumeAuthReturn } from "@/lib/auth-return";
import { formatBrazilianCnpj, formatBrazilianPhone, isValidBrazilianCnpj } from "@/lib/profile";
import { uploadProfileFile } from "@/services/api";

export const Route = createFileRoute("/_authenticated/cadastro")({
  head: () => ({
    meta: [
      { title: "Meu cadastro — CONECTA UNIS" },
      { name: "description", content: "Cadastre-se como empresa ou professor na CONECTA UNIS." },
      { property: "og:title", content: "Meu cadastro — CONECTA UNIS" },
      {
        property: "og:description",
        content: "Cadastre-se como empresa ou professor na CONECTA UNIS.",
      },
    ],
  }),
  component: Registration,
});

type Kind = "company" | "professor" | "visitor";

function registrationErrorMessage(message: string, kind: Kind): string {
  const value = message.toLowerCase();
  if (value.includes("username") && (value.includes("unique") || value.includes("duplicate")))
    return "Este nome de usuário já está em uso. Escolha outro.";
  if (value.includes("invalid company"))
    return "Confira nome da empresa, razão social, setor e site. O CNPJ deve conter exatamente 14 números; o site deve começar com http:// ou https://.";
  if (value.includes("invalid professor"))
    return "Confira instituição, curso/departamento, disciplinas e titulação; cada campo precisa ter pelo menos 2 caracteres.";
  if (value.includes("invalid profile"))
    return "Confira nome, nome de usuário, cidade e telefone. O telefone deve seguir o formato (XX) XXXXX-XXXX.";
  if (value.includes("account type cannot be changed"))
    return "O tipo desta conta já foi definido e não pode ser alterado.";
  if (value.includes("account type not allowed"))
    return "Este tipo de conta não pode ser cadastrado por este formulário.";
  if (value.includes("authentication required") || value.includes("jwt"))
    return "Sua sessão expirou. Entre novamente e tente salvar o cadastro.";
  if (value.includes("duplicate key") || value.includes("company_details_cnpj"))
    return "Já existe uma conta cadastrada com este CNPJ. Confira o número ou entre em contato com o suporte.";
  if (value.includes("row-level security") || value.includes("permission denied"))
    return "Sua sessão não tem permissão para concluir este cadastro. Saia da conta e entre novamente.";
  if (kind === "professor" && value.includes("professor.unis.edu.br"))
    return "O perfil de professor exige um e-mail institucional confirmado @professor.unis.edu.br.";
  return "Não foi possível salvar o cadastro. Confira os campos e sua conexão e tente novamente.";
}

function normalizeUsername(value: string): string {
  return value.trim().normalize("NFC").slice(0, 25).toLocaleLowerCase("pt-BR");
}

const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .refine((value) => value.length >= 3 && value.length <= 25, "Use de 3 a 25 caracteres.")
  .refine(
    (value) => /^[\p{L}\p{M}\p{N}\p{P}]+$/u.test(value) && /[\p{L}\p{N}]/u.test(value),
    "Use letras, números e pontuação, sem espaços ou emojis.",
  );

const base = z.object({
  display_name: z.string().trim().min(2, "Informe seu nome").max(100),
  username: usernameSchema,
  city: z.string().trim().min(2, "Informe a cidade").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\(\d{2}\) \d{5}-\d{4})?$/, "Informe o telefone no formato (XX) XXXXX-XXXX."),
  bio: z.string().trim().max(2000),
});
const company = base.extend({
  kind: z.literal("company"),
  company_name: z.string().trim().min(2, "Informe o nome da empresa").max(120),
  legal_name: z.string().trim().min(2, "Informe a razão social").max(150),
  cnpj: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine(isValidBrazilianCnpj, "Informe exatamente 14 números para o CNPJ."),
  sector: z.string().trim().min(2, "Informe o setor").max(100),
  website: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Site deve começar com http:// ou https://"),
});
const professor = base.extend({
  kind: z.literal("professor"),
  institution: z.string().trim().min(2, "Informe a instituição").max(150),
  department: z.string().trim().min(2, "Informe o curso/departamento").max(150),
  subjects: z.string().trim().min(2, "Informe as disciplinas").max(500),
  qualification: z.string().trim().min(2, "Informe a titulação").max(150),
});

async function loadRegistration() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Entre na sua conta para continuar");
  const uid = u.user.id;
  const [p, r, cd, co, pd] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
    supabase.from("company_details").select("*").eq("user_id", uid).maybeSingle(),
    supabase.from("companies").select("name, sector").eq("owner_id", uid).maybeSingle(),
    supabase.from("professor_details").select("*").eq("user_id", uid).maybeSingle(),
  ]);
  return {
    email: u.user.email ?? "",
    role: (r.data?.role ?? null) as Kind | "admin" | null,
    values: {
      ...p.data,
      ...cd.data,
      company_name: co.data?.name,
      sector: co.data?.sector,
      ...pd.data,
    } as Record<string, string | undefined>,
  };
}

const fieldMaxLengths: Record<string, number> = {
  display_name: 100,
  city: 100,
  bio: 2000,
  company_name: 120,
  legal_name: 150,
  sector: 100,
  website: 300,
  institution: 150,
  department: 150,
  qualification: 150,
  subjects: 500,
};

function Field({
  name,
  label,
  d,
  area,
  ...rest
}: {
  name: string;
  label: string;
  d: Record<string, string | undefined>;
  area?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  const maxLength = fieldMaxLengths[name];
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {area ? (
        <Textarea
          id={name}
          name={name}
          defaultValue={d[name] ?? ""}
          rows={3}
          maxLength={maxLength}
          {...rest}
        />
      ) : (
        <Input id={name} name={name} defaultValue={d[name] ?? ""} maxLength={maxLength} {...rest} />
      )}
    </div>
  );
}

function UsernameField({ defaultValue }: { defaultValue: string | undefined }) {
  const [username, setUsername] = useState(() => normalizeUsername(defaultValue ?? ""));
  return (
    <div className="space-y-1.5">
      <Label htmlFor="username">Nome de usuário</Label>
      <Input
        id="username"
        name="username"
        value={username}
        onChange={(event) => setUsername(normalizeUsername(event.target.value))}
        required
        minLength={3}
        maxLength={25}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="ex.: maria.silva"
        aria-describedby="username-help"
      />
      <p id="username-help" className="text-xs text-muted-foreground">
        Use de 3 a 25 caracteres, sem espaços. Letras acentuadas, números e pontuação são aceitos.
      </p>
    </div>
  );
}

function PhoneField({ defaultValue }: { defaultValue: string | undefined }) {
  const [phone, setPhone] = useState(() => formatBrazilianPhone(defaultValue ?? ""));
  return (
    <div className="space-y-1.5">
      <Label htmlFor="phone">Telefone</Label>
      <Input
        id="phone"
        name="phone"
        value={phone}
        onChange={(event) => setPhone(formatBrazilianPhone(event.target.value))}
        placeholder="(XX) XXXXX-XXXX"
        maxLength={15}
        inputMode="tel"
      />
    </div>
  );
}

function CnpjField({ defaultValue }: { defaultValue: string | undefined }) {
  const [cnpj, setCnpj] = useState(() => formatBrazilianCnpj(defaultValue ?? ""));
  return (
    <div className="space-y-1.5">
      <Label htmlFor="cnpj">CNPJ</Label>
      <Input
        id="cnpj"
        name="cnpj"
        value={cnpj}
        onChange={(event) => setCnpj(formatBrazilianCnpj(event.target.value))}
        placeholder="00.000.000/0000-00"
        maxLength={18}
        inputMode="numeric"
        autoComplete="off"
        required
      />
    </div>
  );
}

function Registration() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["registration"], queryFn: loadRegistration });
  const [kind, setKind] = useState<Kind | null>(null);
  const [busy, setBusy] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeReady, setResumeReady] = useState(false);
  useEffect(() => {
    if (data?.role && data.role !== "admin") setKind(data.role);
  }, [data?.role]);

  if (isLoading || !data)
    return <p className="container-page py-16 text-muted-foreground">Carregando…</p>;
  if (data.role === "admin") {
    return (
      <div className="container-page max-w-3xl py-12">
        <h1 className="font-display text-3xl font-extrabold">Conta de administrador</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conta: {data.email}</p>
        <p className="mt-6 text-muted-foreground">
          Contas de administrador não precisam de cadastro de empresa ou professor.
        </p>
        <Button asChild className="mt-6">
          <Link to="/admin">Ir para o painel</Link>
        </Button>
      </div>
    );
  }

  const d = data.values;
  const locked = !!data.role;
  const canRegisterAsProfessor =
    data.role === "professor" || data.email.toLowerCase().endsWith("@professor.unis.edu.br");

  async function submit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const raw = { ...Object.fromEntries(new FormData(e.currentTarget)), kind };
    const parsed = (
      kind === "company"
        ? company
        : kind === "professor"
          ? professor
          : base.extend({ kind: z.literal("visitor") })
    ).safeParse(raw);
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message);
    if (kind === "professor" && !canRegisterAsProfessor)
      return void toast.error(
        "Para cadastrar perfil de professor, use um e-mail institucional confirmado @professor.unis.edu.br.",
      );
    if (kind === "visitor" && !d.resume_path && !resumeFile)
      return void toast.error("Adicione seu currículo em PDF para concluir o perfil de aluno.");
    const registrationPayload =
      kind === "visitor" && resumeFile
        ? { ...parsed.data, resume_upload_pending: true }
        : parsed.data;
    setBusy(true);
    let error: { message: string } | null = null;
    try {
      ({ error } = await supabase.rpc("save_registration", { payload: registrationPayload }));
      if (error) throw new Error(registrationErrorMessage(error.message, kind));
      if (kind === "visitor" && resumeFile) {
        try {
          await uploadProfileFile(resumeFile, "resume");
          setResumeReady(true);
        } catch (uploadError) {
          throw new Error(
            uploadError instanceof Error
              ? `Cadastro salvo, mas o currículo não foi enviado. ${uploadError.message}`
              : "Cadastro salvo, mas o currículo não foi enviado.",
          );
        }
      }
    } catch (saveError) {
      setBusy(false);
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar o cadastro. Confira sua conexão e tente novamente.",
      );
      return;
    }
    setBusy(false);
    toast.success(kind === "visitor" ? "Perfil de aluno concluído!" : "Cadastro salvo!");
    qc.invalidateQueries({ queryKey: ["registration"] });
    qc.invalidateQueries({ queryKey: ["my-profile"] });
    const returnTo = consumeAuthReturn();
    if (returnTo) window.location.assign(returnTo);
    else navigate({ to: "/perfil" });
  }

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-display text-3xl font-extrabold">Meu cadastro</h1>
      <p className="mt-1 text-sm text-muted-foreground">Conta: {data.email}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {(
          [
            ["company", "Sou empresa", "Empresa", Building2],
            ["visitor", "Sou aluno", "Perfil de aluno", UserRound],
            ["professor", "Sou professor", "Perfil acadêmico", GraduationCap],
          ] as const
        ).map(([k, t, s, Icon]) => (
          <Button
            variant="outline"
            key={k}
            type="button"
            disabled={(locked && data.role !== k) || (k === "professor" && !canRegisterAsProfessor)}
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`h-auto items-start justify-start gap-3 whitespace-normal rounded-lg p-4 text-left disabled:opacity-40 ${kind === k ? "border-primary bg-primary-soft" : "bg-card"}`}
          >
            <Icon className="mt-0.5 h-5 w-5 text-primary" />
            <span>
              <span className="block font-bold">{t}</span>
              <span className="text-sm text-muted-foreground">
                {k === "professor" && !canRegisterAsProfessor
                  ? "Use seu e-mail institucional de professor"
                  : s}
              </span>
            </span>
          </Button>
        ))}
      </div>
      {locked && (
        <p className="mt-2 text-xs text-muted-foreground">
          O tipo de conta não pode ser alterado depois de salvo.
        </p>
      )}

      {kind && (
        <form
          key={kind}
          onSubmit={submit}
          className="mt-8 space-y-6 rounded-xl border bg-card p-6 shadow-card"
        >
          <section className="grid gap-4 sm:grid-cols-2">
            <h2 className="font-bold sm:col-span-2">Seus dados</h2>
            <Field name="display_name" label="Nome completo" d={d} required />
            <UsernameField defaultValue={d.username} />
            <Field name="city" label="Cidade" d={d} required />
            <PhoneField defaultValue={d.phone} />
            <div className="sm:col-span-2">
              <Field
                name="bio"
                label={kind === "company" ? "Sobre a empresa" : "Sobre você"}
                d={d}
                area
              />
            </div>
          </section>
          {kind === "company" ? (
            <section className="grid gap-4 sm:grid-cols-2">
              <h2 className="font-bold sm:col-span-2">Dados da empresa</h2>
              <Field name="company_name" label="Nome da empresa" d={d} required />
              <Field name="legal_name" label="Razão social" d={d} required />
              <CnpjField defaultValue={d.cnpj} />
              <Field name="sector" label="Setor" d={d} required />
              <div className="sm:col-span-2">
                <Field name="website" label="Site" d={d} placeholder="https://" />
              </div>
            </section>
          ) : kind === "professor" ? (
            <section className="grid gap-4 sm:grid-cols-2">
              <h2 className="font-bold sm:col-span-2">Dados acadêmicos</h2>
              <Field name="institution" label="Instituição" d={d} required />
              <Field name="department" label="Curso / departamento" d={d} required />
              <Field
                name="qualification"
                label="Titulação"
                d={d}
                required
                placeholder="ex.: Mestre"
              />
              <Field name="subjects" label="Disciplinas" d={d} required />
            </section>
          ) : (
            <section className="space-y-2 rounded-lg border border-primary/20 bg-primary-soft/50 p-4">
              <h2 className="font-bold">Currículo obrigatório</h2>
              <p className="text-sm text-muted-foreground">
                Envie seu currículo em PDF para concluir o perfil. Você poderá atualizar o arquivo
                depois.
              </p>
              <Label htmlFor="onboarding-resume">Currículo (PDF, até 2 MB)</Label>
              <Input
                id="onboarding-resume"
                type="file"
                accept="application/pdf,.pdf"
                required={!d.resume_path}
                onChange={(event) => {
                  setResumeFile(event.target.files?.[0] ?? null);
                  setResumeReady(false);
                }}
              />
              {d.resume_path && !resumeFile && (
                <p className="text-sm text-success">Já existe um currículo salvo na sua conta.</p>
              )}
              {resumeFile && (
                <p className="text-sm text-muted-foreground">Selecionado: {resumeFile.name}</p>
              )}
              {resumeReady && (
                <p role="status" className="text-sm text-success">
                  Currículo enviado.
                </p>
              )}
            </section>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Salvando…" : "Salvar cadastro"}
          </Button>
        </form>
      )}
    </div>
  );
}
