import type { Company } from "@/types";
import { cn } from "@/lib/utils";

const tones: Record<Company["tone"], string> = {
  blue: "bg-primary-soft text-primary",
  purple: "bg-brand-purple-soft text-brand-purple",
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
};

export function CompanyAvatar({ company, size = "md" }: { company?: Company | undefined; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-lg font-display font-bold",
        size === "lg" ? "h-16 w-16 text-xl" : "h-11 w-11 text-sm",
        tones[company?.tone ?? "blue"],
      )}
    >
      {company?.initials ?? "?"}
    </span>
  );
}
