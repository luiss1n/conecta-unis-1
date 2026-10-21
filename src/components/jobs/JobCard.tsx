import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { formatDate, modeLabel, typeLabel } from "@/lib/jobs";
import { cn } from "@/lib/utils";
import { getCompany } from "@/services/api";
import type { Job } from "@/types";

export function JobTypeBadge({ type }: { type: Job["type"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        type === "estagio" ? "bg-brand-purple-soft text-brand-purple" : "bg-primary-soft text-primary",
      )}
    >
      {typeLabel[type]}
    </span>
  );
}

export function JobCard({ job }: { job: Job }) {
  const company = getCompany(job.companySlug);
  return (
    <Link
      to="/vagas/$slug"
      params={{ slug: job.slug }}
      className="group flex h-full flex-col rounded-xl border bg-card p-5 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyAvatar company={company} />
          <p className="truncate text-sm font-medium text-muted-foreground">{company?.name}</p>
        </div>
        <JobTypeBadge type={job.type} />
      </div>
      <h3 className="mt-4 text-base font-bold leading-snug transition-colors group-hover:text-primary">{job.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.summary}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.city} · {modeLabel[job.mode]}</span>
        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(job.publishedAt)}</span>
      </div>
    </Link>
  );
}

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export function JobList({ jobs, columns = 2 }: { jobs: Job[]; columns?: 2 | 3 }) {
  const reduce = useReducedMotion();
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <motion.ul
      className={cn("grid gap-4 sm:grid-cols-2", columns === 3 && "xl:grid-cols-3")}
      variants={listVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {jobs.map((j) => (
        <motion.li key={j.slug} variants={itemVariants}>
          <JobCard job={j} />
        </motion.li>
      ))}
    </motion.ul>
  );
}
