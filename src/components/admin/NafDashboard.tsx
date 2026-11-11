import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getNafJobAnalytics, type NafJobAnalytics } from "@/services/api";

const periods = [
  { days: 1, label: "Hoje" },
  { days: 7, label: "Esta semana" },
  { days: 30, label: "Este mês" },
] as const;

export function NafDashboard() {
  const [days, setDays] = useState<1 | 7 | 30>(7);
  const report = useQuery({ queryKey: ["naf-job-analytics", days], queryFn: () => getNafJobAnalytics(days), refetchInterval: 60_000 });
  const data: NafJobAnalytics = report.data ?? { jobs: [], series: [] };
  const views = data.series.reduce((sum, day) => sum + day.views, 0);
  const applications = data.series.reduce((sum, day) => sum + day.applications, 0);
  const max = Math.max(1, ...data.series.flatMap((day) => [day.views, day.applications]));

  return <section aria-labelledby="naf-title" className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 id="naf-title" className="text-xl font-bold">NAF · Relatório de vagas</h2><p className="mt-1 text-sm text-muted-foreground">Visualizações únicas por visitante em cada dia e candidaturas recebidas.</p></div>
      <label className="flex flex-col gap-1 text-sm font-medium">Período
        <select className="h-11 rounded-md border bg-background px-3" value={days} onChange={(event) => setDays(Number(event.target.value) as 1 | 7 | 30)}>{periods.map((period) => <option key={period.days} value={period.days}>{period.label}</option>)}</select>
      </label>
    </div>
    {report.isLoading ? <p>Carregando relatório…</p> : report.isError ? <p role="alert" className="text-destructive">Não foi possível carregar o relatório. Confira se a migração do NAF foi aplicada ao banco.</p> : <>
      <ul className="grid gap-3 sm:grid-cols-3">
        {[{ label: "Vagas no sistema", value: data.jobs.length }, { label: "Visualizações no período", value: views }, { label: "Candidaturas no período", value: applications }].map((item) => <li key={item.label} className="rounded-xl border bg-card p-4"><p className="font-display text-3xl font-bold">{item.value}</p><p className="text-sm text-muted-foreground">{item.label}</p></li>)}
      </ul>
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <h3 className="font-bold">Evolução diária</h3>
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {data.series.map((day) => <div key={day.date} className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 text-xs sm:grid-cols-[7rem_minmax(0,1fr)]"><span>{day.date.slice(8, 10)}/{day.date.slice(5, 7)}</span><div className="space-y-1"><div className="flex items-center gap-2"><div className="h-3 rounded bg-primary" style={{ width: `${Math.max(day.views ? 2 : 0, day.views / max * 100)}%` }} /><span>{day.views} views</span></div><div className="flex items-center gap-2"><div className="h-3 rounded bg-success" style={{ width: `${Math.max(day.applications ? 2 : 0, day.applications / max * 100)}%` }} /><span>{day.applications} candidaturas</span></div></div></div>)}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[32rem] text-left text-sm"><caption className="px-4 py-3 text-left font-bold">Resultados por vaga no período</caption><thead className="border-y bg-muted/50"><tr><th scope="col" className="px-4 py-3">Vaga</th><th scope="col" className="px-4 py-3 text-right">Visualizações</th><th scope="col" className="px-4 py-3 text-right">Candidaturas</th></tr></thead><tbody>{data.jobs.map((job) => <tr key={job.slug} className="border-t"><td className="px-4 py-3 font-medium">{job.title}</td><td className="px-4 py-3 text-right">{job.views}</td><td className="px-4 py-3 text-right">{job.applications}</td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
