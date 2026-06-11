import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
} from "recharts";
import { Users, Building2, Gauge, CalendarCheck, Trophy } from "lucide-react";
import { MOCK_MANAGER, mockFetch } from "@/lib/mockData";

export const Route = createFileRoute("/_app/manager")({
  head: () => ({ meta: [{ title: "Manager Dashboard · SalesCoach AI" }] }),
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const data = useQuery({
    queryKey: ["manager", "area-summary"],
    queryFn: () => mockFetch(MOCK_MANAGER, 700),
  });

  return (
    <div className="space-y-8">
      <header className="slide-up">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Area Management</p>
        <h1 className="mt-1 text-3xl font-bold">Team performance</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          A live view of your DSPs and merchant coverage across NCR.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ManagerKpi loading={data.isLoading} title="Active DSPs"      value={data.data?.totalDsps}      icon={<Users className="h-5 w-5" />}        gradient="bg-gradient-primary" />
        <ManagerKpi loading={data.isLoading} title="Merchants"        value={data.data?.totalMerchants} icon={<Building2 className="h-5 w-5" />}    gradient="bg-gradient-success" />
        <ManagerKpi loading={data.isLoading} title="Avg priority"     value={data.data?.avgPriorityScore.toFixed(1)} icon={<Gauge className="h-5 w-5" />} gradient="bg-gradient-warm" />
        <ManagerKpi loading={data.isLoading} title="Visits this week" value={data.data?.weeklyVisits}   icon={<CalendarCheck className="h-5 w-5" />} gradient="bg-gradient-primary" />
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        {/* Chart */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm xl:col-span-3">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-base font-bold">Visits by area</h2>
              <p className="text-xs text-muted-foreground">Weekly progress vs target</p>
            </div>
            <Legend />
          </div>
          <div className="h-72 w-full">
            {data.isLoading ? (
              <div className="skeleton h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer>
                <BarChart data={data.data?.visitsByArea} barGap={6}>
                  <defs>
                    <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="oklch(0.72 0.18 245)" />
                      <stop offset="100%" stopColor="oklch(0.55 0.21 255)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(0.9 0.015 250)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="area" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "oklch(0.95 0.02 250 / 0.6)" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.9 0.015 250)", boxShadow: "var(--shadow-elegant)" }}
                  />
                  <Bar dataKey="target" fill="oklch(0.93 0.02 250)" radius={[6,6,0,0]} animationDuration={900} />
                  <Bar dataKey="visits" radius={[6,6,0,0]} animationDuration={1100}>
                    {data.data?.visitsByArea.map((_, i) => (
                      <Cell key={i} fill="url(#barFill)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Team leaderboard */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm xl:col-span-2">
          <h2 className="mb-1 flex items-center gap-2 text-base font-bold">
            <Trophy className="h-4 w-4 text-warning" /> Top performers
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">Ranked by coaching score</p>

          {data.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <ol className="space-y-2">
              {data.data?.team.map((t, i) => (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-secondary hover:shadow-elegant"
                >
                  <div
                    className={[
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold",
                      i === 0 ? "bg-gradient-warm text-white" :
                      i === 1 ? "bg-slate-200 text-slate-800" :
                      i === 2 ? "bg-amber-100 text-amber-900" :
                      "bg-muted text-foreground",
                    ].join(" ")}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{t.area} · {t.visits} visits · {t.conversion}% conv.</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-primary">{t.score}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">score</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Team table */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="text-base font-bold">All DSPs</h2>
          <p className="text-xs text-muted-foreground">Weekly performance overview</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">DSP</th>
                <th className="px-5 py-3">Area</th>
                <th className="px-5 py-3 text-right">Visits</th>
                <th className="px-5 py-3 text-right">Conversion</th>
                <th className="px-5 py-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-5 py-3"><div className="skeleton h-4 w-32 rounded" /></td>
                      <td className="px-5 py-3"><div className="skeleton h-4 w-24 rounded" /></td>
                      <td className="px-5 py-3"><div className="skeleton ml-auto h-4 w-10 rounded" /></td>
                      <td className="px-5 py-3"><div className="skeleton ml-auto h-4 w-12 rounded" /></td>
                      <td className="px-5 py-3"><div className="skeleton ml-auto h-4 w-10 rounded" /></td>
                    </tr>
                  ))
                : data.data?.team.map((t) => (
                    <tr key={t.id} className="border-t border-border transition-colors hover:bg-secondary/50">
                      <td className="px-5 py-3 font-medium">{t.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{t.area}</td>
                      <td className="px-5 py-3 text-right">{t.visits}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                          {t.conversion}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-primary">{t.score}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ManagerKpi({
  loading, title, value, icon, gradient,
}: { loading: boolean; title: string; value?: number | string; icon: React.ReactNode; gradient: string }) {
  return (
    <div className="card-interactive group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 transition-all duration-500 group-hover:opacity-25 ${gradient}`} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          {loading
            ? <div className="skeleton mt-2 h-8 w-24 rounded-md" />
            : <p className="mt-1 text-3xl font-bold">{value}</p>}
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${gradient} text-primary-foreground shadow-elegant transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex gap-3 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-primary" /> Visits</span>
      <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted" /> Target</span>
    </div>
  );
}
