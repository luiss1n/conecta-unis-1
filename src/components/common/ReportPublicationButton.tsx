import { Flag } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { storeAuthReturn } from "@/lib/auth-return";
import { submitPublicationReport } from "@/services/api";

export function ReportPublicationButton({ kind, targetRef }: { kind: "job" | "event"; targetRef: string }) {
  const { session, ready } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (reason.trim().length < 10) return void toast.error("Descreva o motivo com pelo menos 10 caracteres.");
    setSaving(true);
    try {
      await submitPublicationReport(kind, targetRef, reason);
      toast.success("Denúncia enviada para análise.");
      setOpen(false);
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a denúncia.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <Button variant="ghost" size="sm" className="min-h-11" onClick={() => {
      if (!ready) return;
      if (!session) {
        const path = kind === "job" ? `/vagas/${targetRef}` : `/eventos/${targetRef}`;
        storeAuthReturn(path);
        toast.info("Entre na sua conta para denunciar esta publicação.");
        navigate({ to: "/auth" });
        return;
      }
      setOpen(true);
    }} disabled={!ready}><Flag className="h-4 w-4" /> Denunciar</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-2rem)]">
        <DialogHeader><DialogTitle>Denunciar publicação</DialogTitle><DialogDescription>Explique o que precisa ser verificado. A denúncia será enviada à equipe responsável.</DialogDescription></DialogHeader>
        <label htmlFor={`report-${targetRef}`} className="text-sm font-medium">Motivo</label>
        <Textarea id={`report-${targetRef}`} value={reason} onChange={(event) => setReason(event.target.value.slice(0, 1000))} maxLength={1000} rows={5} placeholder="Descreva o problema (mínimo de 10 caracteres)." />
        <p className="text-xs text-muted-foreground">{reason.length}/1000</p>
        <DialogFooter><Button className="min-h-11" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button className="min-h-11" onClick={() => void submit()} disabled={saving || reason.trim().length < 10}>{saving ? "Enviando…" : "Enviar denúncia"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
