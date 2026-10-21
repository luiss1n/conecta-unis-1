import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Chip {
  id: string;
  label: string;
  active: boolean;
}

export function FilterChips({ chips, onToggle, label = "Filtros rápidos" }: { chips: Chip[]; onToggle: (id: string) => void; label?: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          aria-pressed={c.active}
          onClick={() => onToggle(c.id)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            c.active
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-surface text-foreground hover:border-primary/40 hover:bg-primary-soft",
          )}
        >
          {c.active && <Check className="h-3.5 w-3.5" />}
          {c.label}
        </button>
      ))}
    </div>
  );
}
