import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Activity, Calendar, Target, TrendingUp, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getDashboard } from "@/lib/api";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · SalesCoach AI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const role =
    user?.role === "Admin" ? "admin" :
    user?.role === "Manager" ? "manager" : "dsp";

  const q = useQuery({
    queryKey: ["dashboard", role],
    queryFn: () => getDashboard(role),
    enabled: !!user,
  });

  return (
    <div className="space-y-8">
      <header className="slide-up">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{user?.role} dashboard</p>
        <h1 className="mt-1 text-3xl font-bold capitalize">Hello, {user?.username} 👋</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Live metrics streamed from your SalesCoach AI backend.
        </p>
      </header>

      {q.isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard…
        </div>
      ) : q.isError ? (
        <ErrorPanel message={(q.error as Error)?.message} />
      ) : (
        <DashboardBody data={q.data} />
      )}
    </div>
  );
}

function DashboardBody({ data }: { data: any }) {
  // Flatten scalar fields to KPI cards; render arrays as tables.
  const kpis = scalarKpis(data);
  const tables = arrayTables(data);

  return (
    <>
      {kpis.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k, i) => (
            <Kpi key={k.label} title={k.label} value={k.value} icon={kpiIcon(i)} />
          ))}
        </section>
      )}
      {tables.length === 0 && kpis.length === 0 && (
        <pre className="overflow-auto rounded-2xl border border-border bg-card p-4 text-xs">{JSON.stringify(data, null, 2)}</pre>
      )}
      {tables.map((t) => (
        <section key={t.key} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="text-base font-bold capitalize">{t.key.replace(/[_-]/g, " ")}</h2>
          </div>
          <DataTable rows={t.rows} />
        </section>
      ))}
    </>
  );
}

function kpiIcon(i: number) {
  const icons = [<Calendar key="c" />, <TrendingUp key="t" />, <Target key="g" />, <Users key="u" />, <Activity key="a" />];
  return icons[i % icons.length];
}

function scalarKpis(data: any): { label: string; value: string }[] {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  return Object.entries(data)
    .filter(([, v]) => typeof v === "number" || typeof v === "string" || typeof v === "boolean")
    .map(([k, v]) => ({ label: humanize(k), value: String(v) }));
}

function arrayTables(data: any): { key: string; rows: any[] }[] {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data)
    .filter(([, v]) => Array.isArray(v) && v.length > 0 && typeof v[0] === "object")
    .map(([k, v]) => ({ key: k, rows: v as any[] }));
}

function humanize(s: string) {
  return s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function Kpi({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card-interactive group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-primary opacity-10 transition-all duration-500 group-hover:opacity-25" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-3xl font-bold">{value}</p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DataTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <div className="p-5 text-sm text-muted-foreground">No rows.</div>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>{cols.map((c) => <th key={c} className="px-5 py-3">{humanize(c)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border transition-colors hover:bg-secondary/50">
              {cols.map((c) => (
                <td key={c} className="px-5 py-3">{formatCell(r[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(v: any): React.ReactNode {
  if (v == null) return <span className="text-muted-foreground">—</span>;
  if (typeof v === "object") return <code className="text-xs">{JSON.stringify(v)}</code>;
  return String(v);
}

export function ErrorPanel({ message }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
      Could not load data. {message ? <span className="opacity-80">({message})</span> : null}
    </div>
  );
}
