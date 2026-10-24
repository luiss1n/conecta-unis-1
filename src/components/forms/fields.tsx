import type { ReactNode } from "react";

export const inputCls =
  "mt-1 h-11 w-full rounded-md border bg-surface px-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";
export const areaCls =
  "mt-1 w-full rounded-md border bg-surface px-3 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

/** O <label> envolve o campo, então leitores de tela associam rótulo e controle sem precisar de ids. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);
