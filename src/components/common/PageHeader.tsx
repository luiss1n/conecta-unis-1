import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="border-b bg-surface">
      <div className="container-page py-10 sm:py-14">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-brand-purple">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
