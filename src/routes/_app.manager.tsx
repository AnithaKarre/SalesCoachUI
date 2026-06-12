import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
} from "recharts";
import { Trophy, Loader2 } from "lucide-react";
import { getManagerAreaSummary, getManagerTeam } from "@/lib/api";
import { DataTable, ErrorPanel, Kpi } from "./_app.dashboard";

export const Route = createFileRoute("/_app/manager")({
  head: () => ({ meta: [{ title: "Manager Dashboard · SalesCoach AI" }] }),
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const summary = useQuery({ queryKey: ["manager", "area-summary"], queryFn: getManagerAreaSummary });
  const team = useQuery({ queryKey: ["manager", "team"], queryFn: getManagerTeam });

  const areaChartData: any[] =
    (summary.data?.visitsByArea ?? summary.data?.visits_by_area ?? summary.data?.areas ?? [])
      .map((r: any) => ({
        area: r.area ?? r.name ?? r.region,
        visits: Number(r.visits ?? r.value ?? 0),
        target: Number(r.target ?? r.goal ?? 0),
      }));

  const kpis = scalars(summary.data);

  return (
    <div className="space-y-8">
      <header className="slide-up">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Area Management</p>
        <h1 className="mt-1 text-3xl font-bold">Team performance</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">A live view of your DSPs and merchant coverage.</p>
      </header>

      {summary.isError ? <ErrorPanel message={(summary.error as Error)?.message} /> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)
          : kpis.map((k) => <Kpi key={k.label} title={k.label} value={k.value} icon={<Trophy className="h-5 w-5" />} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm xl:col-span-3">
          <div className="mb-3">
            <h2 className="text-base font-bold">Visits by area</h2>
            <p className="text-xs text-muted-foreground">Weekly progress vs target</p>
          </div>
          <div className="h-72 w-full">
            {summary.isLoading ? <div className="skeleton h-full w-full rounded-xl" /> :
              areaChartData.length === 0 ? (
                <p className="grid h-full place-items-center text-sm text-muted-foreground">No area data.</p>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={areaChartData} barGap={6}>
                    <defs>
                      <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.18 245)" />
                        <stop offset="100%" stopColor="oklch(0.55 0.21 255)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="oklch(0.9 0.015 250)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="area" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="target" fill="oklch(0.93 0.02 250)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="visits" radius={[6, 6, 0, 0]}>
                      {areaChartData.map((_, i) => <Cell key={i} fill="url(#barFill)" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm xl:col-span-2">
          <h2 className="mb-1 flex items-center gap-2 text-base font-bold">
            <Trophy className="h-4 w-4 text-warning" /> Team roster
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">From /manager/team</p>
          {team.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : team.isError ? (
            <ErrorPanel message={(team.error as Error)?.message} />
          ) : !team.data?.length ? (
            <p className="text-sm text-muted-foreground">No team members.</p>
          ) : (
            <ol className="space-y-2">
              {team.data.map((t: any, i: number) => (
                <li key={t.id ?? i} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-sm font-bold">{i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t.name ?? t.full_name ?? t.username}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {[t.area, t.visits != null ? `${t.visits} visits` : null, t.conversion != null ? `${t.conversion}% conv.` : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {t.score != null && (
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">{t.score}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">score</div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="text-base font-bold">All DSPs</h2>
        </div>
        {team.isLoading ? (
          <div className="p-5"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : team.data?.length ? <DataTable rows={team.data} /> : (
          <p className="p-5 text-sm text-muted-foreground">No team data.</p>
        )}
      </section>
    </div>
  );
}

function scalars(data: any) {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data)
    .filter(([, v]) => typeof v === "number" || typeof v === "string")
    .slice(0, 4)
    .map(([k, v]) => ({ label: k.replace(/[_-]/g, " "), value: String(v) }));
}
