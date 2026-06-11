import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, Target, TrendingUp, AlertOctagon, Sparkles, Crown, Award, Medal } from "lucide-react";
import { MOCK_DSP_DASHBOARD, MOCK_MERCHANTS, mockFetch, type Merchant } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "DSP Dashboard · SalesCoach AI" }] }),
  component: DspDashboard,
});

function DspDashboard() {
  const { user } = useAuth();
  const summary = useQuery({
    queryKey: ["dashboard", "dsp"],
    queryFn: () => mockFetch(MOCK_DSP_DASHBOARD, 600),
  });
  const merchants = useQuery({
    queryKey: ["merchants", "prioritized"],
    queryFn: () => mockFetch(MOCK_MERCHANTS, 800),
  });

  return (
    <div className="space-y-8">
      <header className="slide-up">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Field Coaching</p>
        <h1 className="mt-1 text-3xl font-bold capitalize">Hello, {user?.username} 👋</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Here's your prioritized plan for today, ranked by the SalesCoach AI scoring engine.
        </p>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          loading={summary.isLoading}
          title="Visits today"
          value={summary.data ? `${summary.data.visitsToday} / ${summary.data.visitsGoal}` : ""}
          hint="Goal progress"
          icon={<Calendar className="h-5 w-5" />}
          gradient="bg-gradient-primary"
          progress={summary.data ? (summary.data.visitsToday / summary.data.visitsGoal) * 100 : 0}
        />
        <KpiCard
          loading={summary.isLoading}
          title="Conversion rate"
          value={summary.data ? `${summary.data.conversionRate}%` : ""}
          hint="vs last 30 days"
          icon={<TrendingUp className="h-5 w-5" />}
          gradient="bg-gradient-success"
          trend={+4}
        />
        <KpiCard
          loading={summary.isLoading}
          title="Pending actions"
          value={summary.data ? `${summary.data.pendingActions}` : ""}
          hint="Open recommendations"
          icon={<AlertOctagon className="h-5 w-5" />}
          gradient="bg-gradient-warm"
        />
      </section>

      {/* Prioritized merchants */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Prioritized merchants
            </h2>
            <p className="text-sm text-muted-foreground">Top scored outlets needing your attention today.</p>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">{merchants.data?.length ?? 0} merchants</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {merchants.isLoading
            ? Array.from({ length: 6 }).map((_, i) => <MerchantCardSkeleton key={i} />)
            : merchants.data?.map((m, i) => <MerchantCard key={m.id} m={m} rank={i + 1} />)}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  title, value, hint, icon, gradient, loading, progress, trend,
}: {
  title: string; value: string; hint: string;
  icon: React.ReactNode; gradient: string;
  loading?: boolean; progress?: number; trend?: number;
}) {
  return (
    <div className="card-interactive group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 transition-all duration-500 group-hover:opacity-25 ${gradient}`} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          {loading ? (
            <div className="skeleton mt-2 h-8 w-28 rounded-md" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${gradient} text-primary-foreground shadow-elegant transition-transform duration-300 group-hover:scale-110 group-hover:opacity-90`}
        >
          {icon}
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-primary transition-all duration-700"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
      {trend !== undefined && (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
          <Target className="h-3 w-3" /> +{trend}% vs last period
        </div>
      )}
    </div>
  );
}

function tierBadge(tier: Merchant["tier"]) {
  const map = {
    Gold: { cls: "bg-gradient-warm text-white", icon: <Crown className="h-3 w-3" /> },
    Silver: { cls: "bg-slate-200 text-slate-800", icon: <Award className="h-3 w-3" /> },
    Bronze: { cls: "bg-amber-100 text-amber-800", icon: <Medal className="h-3 w-3" /> },
    New: { cls: "bg-primary/10 text-primary", icon: <Sparkles className="h-3 w-3" /> },
  } as const;
  return map[tier];
}

function MerchantCard({ m, rank }: { m: Merchant; rank: number }) {
  const t = tierBadge(m.tier);
  const trendNeg = m.transactionTrend < 0;
  return (
    <Link
      to="/merchants/$id" params={{ id: m.id }}
      className="card-interactive group relative block overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/20"
    >
      <div className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-muted text-[11px] font-bold text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        #{rank}
      </div>

      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-lg font-bold uppercase text-primary-foreground shadow-elegant">
          {m.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{m.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{m.category} · {m.area}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.cls}`}>
              {t.icon} {m.tier}
            </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {m.campaignStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
        <Stat label="Score" value={m.priorityScore.toFixed(1)} accent="primary" />
        <Stat
          label="Trend"
          value={`${m.transactionTrend > 0 ? "+" : ""}${m.transactionTrend}%`}
          accent={trendNeg ? "danger" : "success"}
        />
        <Stat label="Last visit" value={`${m.daysSinceVisit}d`} />
      </div>

      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
        View brief <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "primary" | "success" | "danger" }) {
  const cls =
    accent === "primary" ? "text-primary" :
    accent === "success" ? "text-success" :
    accent === "danger" ? "text-destructive" :
    "text-foreground";
  return (
    <div>
      <div className={`text-sm font-bold ${cls}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function MerchantCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="skeleton h-12 w-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
          <div className="skeleton h-4 w-24 rounded-full" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="skeleton mx-auto h-4 w-10 rounded" />
            <div className="skeleton mx-auto h-2 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
