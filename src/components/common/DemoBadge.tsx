import { Info } from "lucide-react";

export function DemoBadge({ children = "Dados de exemplo" }: { children?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">
      <Info className="h-3 w-3" /> {children}
    </span>
  );
}
