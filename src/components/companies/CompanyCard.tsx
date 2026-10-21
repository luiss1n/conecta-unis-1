import { Link } from "@tanstack/react-router";
import { Briefcase, MapPin } from "lucide-react";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { getJobsByCompany } from "@/services/api";
import type { Company } from "@/types";

export function CompanyCard({ company }: { company: Company }) {
  const count = getJobsByCompany(company.slug).length;
  return (
    <Link
      to="/empresas/$slug"
      params={{ slug: company.slug }}
      className="group flex h-full flex-col rounded-xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="flex items-center gap-3">
        <CompanyAvatar company={company} />
        <div className="min-w-0">
          <h3 className="truncate font-bold group-hover:text-primary">{company.name}</h3>
          <p className="truncate text-sm text-muted-foreground">{company.sector}</p>
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{company.summary}</p>
      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{company.city}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-primary">
          <Briefcase className="h-3.5 w-3.5" />{count} {count === 1 ? "oportunidade" : "oportunidades"}
        </span>
      </div>
    </Link>
  );
}
