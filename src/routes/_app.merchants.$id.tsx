import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft, Sparkles, Loader2, CheckCircle2, CircleDotDashed, Circle,
  Phone, MapPin, Wallet, MessageSquareWarning, TrendingDown, TrendingUp, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { MOCK_MERCHANTS, mockFetch, type Merchant } from "@/lib/mockData";

export const Route = createFileRoute("/_app/merchants/$id")({
  head: () => ({ meta: [{ title: "Merchant brief · SalesCoach AI" }] }),
  component: MerchantDetail,
});

type Status = Merchant["status"];

function MerchantDetail() {
  const { id } = useParams({ from: "/_app/merchants/$id" });
  const qc = useQueryClient();

  const merchantQ = useQuery({
    queryKey: ["merchant", id],
    queryFn: async () => {
      const m = MOCK_MERCHANTS.find((x) => x.id === id);
      if (!m) throw new Error("Merchant not found");
      return mockFetch(m, 500);
    },
  });
  const scoreQ = useQuery({
    queryKey: ["merchant", id, "score"],
    queryFn: async () => {
      const m = MOCK_MERCHANTS.find((x) => x.id === id)!;
      return mockFetch({
        priorityScore: m.priorityScore,
        breakdown: [
          { label: "Transaction trend", value: Math.min(100, Math.max(0, 50 - m.transactionTrend * 2)) },
          { label: "Days since visit", value: Math.min(100, m.daysSinceVisit * 4) },
          { label: "Complaint pressure", value: Math.min(100, m.complaints * 25) },
          { label: "Wallet health", value: 100 - Math.min(100, m.walletBalance / 50) },
        ],
      }, 700);
    },
  });

  const [status, setStatus] = useState<Status>("Pending");

  const updateStatus = useMutation({
    mutationFn: async (next: Status) => {
      // Real backend would be: PATCH /recommendations/{recommendationId}/status
      await new Promise((r) => setTimeout(r, 800));
      return next;
    },
    onSuccess: (next) => {
      setStatus(next);
      toast.success(`Status updated to "${next}"`);
      qc.invalidateQueries({ queryKey: ["merchants", "prioritized"] });
    },
    onError: () => toast.error("Could not update status"),
  });

  if (merchantQ.isLoading) return <DetailSkeleton />;
  if (!merchantQ.data) return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <p>Merchant not found.</p>
      <Link to="/dashboard" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">← Back to dashboard</Link>
    </div>
  );

  const m = merchantQ.data;
  const trendNeg = m.transactionTrend < 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>

      {/* Header card */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="relative bg-gradient-primary p-6 text-primary-foreground">
          <div className="bg-mesh pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl font-bold uppercase ring-1 ring-white/30 backdrop-blur-md">
                {m.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold sm:text-3xl">{m.name}</h1>
                <p className="truncate text-sm text-white/85">{m.category} · {m.tier} tier</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur-md ring-1 ring-white/25">
              <div className="text-xs uppercase tracking-wider text-white/80">Priority score</div>
              <div className="text-2xl font-bold">{m.priorityScore.toFixed(1)}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile icon={<MapPin className="h-4 w-4" />} label="Area" value={`${m.area}, ${m.region}`} />
          <InfoTile icon={<Phone className="h-4 w-4" />} label="Campaign" value={m.campaignStatus} />
          <InfoTile icon={<Wallet className="h-4 w-4" />} label="Wallet" value={`₱${m.walletBalance.toLocaleString()}`} />
          <InfoTile
            icon={trendNeg ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            label="Trend (7d)"
            value={`${m.transactionTrend > 0 ? "+" : ""}${m.transactionTrend}%`}
            accent={trendNeg ? "danger" : "success"}
          />
        </div>
      </div>

      {/* AI insights + status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="glow-border relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">AI Coaching Brief</h2>
                <p className="text-xs text-muted-foreground">Generated by SalesCoach AI · Merchant Insight Agent</p>
              </div>
            </div>

            <p className="text-base leading-relaxed text-foreground">{m.recommendation}</p>

            <div className="mt-5 rounded-2xl bg-secondary/60 p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Score breakdown</h3>
              {scoreQ.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-3 w-full rounded-full" />
                  ))}
                </div>
              ) : (
                <ul className="space-y-3">
                  {scoreQ.data?.breakdown.map((b) => (
                    <li key={b.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">{b.label}</span>
                        <span className="font-semibold">{Math.round(b.value)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-primary transition-all duration-700"
                          style={{ width: `${b.value}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Status segmented control */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Visit status</h3>
          <p className="mt-1 text-xs text-muted-foreground">Update progress for this recommendation.</p>

          <div className="mt-5 flex flex-col gap-2">
            <StatusButton
              active={status === "Pending"}
              loading={updateStatus.isPending && updateStatus.variables === "Pending"}
              onClick={() => updateStatus.mutate("Pending")}
              icon={<Circle className="h-4 w-4" />}
              label="Pending"
              accent="muted"
            />
            <StatusButton
              active={status === "In Progress"}
              loading={updateStatus.isPending && updateStatus.variables === "In Progress"}
              onClick={() => updateStatus.mutate("In Progress")}
              icon={<CircleDotDashed className="h-4 w-4" />}
              label="Mark as In Progress"
              accent="primary"
            />
            <StatusButton
              active={status === "Done"}
              loading={updateStatus.isPending && updateStatus.variables === "Done"}
              onClick={() => updateStatus.mutate("Done")}
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Mark as Done"
              accent="success"
            />
          </div>

          <div className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" /> Last visit: <span className="font-medium text-foreground">{m.daysSinceVisit} days ago</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquareWarning className="h-4 w-4" /> Complaints: <span className="font-medium text-foreground">{m.complaints}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: string; accent?: "success" | "danger" }) {
  const v =
    accent === "success" ? "text-success" :
    accent === "danger" ? "text-destructive" :
    "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={`mt-1 truncate text-base font-semibold ${v}`}>{value}</div>
    </div>
  );
}

function StatusButton({
  active, loading, onClick, icon, label, accent,
}: {
  active: boolean; loading: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; accent: "primary" | "success" | "muted";
}) {
  const tone =
    accent === "primary" ? "bg-gradient-primary text-primary-foreground shadow-elegant" :
    accent === "success" ? "bg-gradient-success text-success-foreground shadow-elegant" :
    "bg-muted text-foreground";
  return (
    <button
      onClick={onClick} disabled={loading || active}
      className={[
        "inline-flex items-center justify-between gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5",
        active ? tone : "bg-card hover:border-primary/40 hover:text-primary hover:shadow-elegant",
        loading ? "opacity-80" : "",
      ].join(" ")}
    >
      <span className="inline-flex items-center gap-2">{icon}{label}</span>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? <CheckCircle2 className="h-4 w-4" /> : null}
    </button>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-40 rounded" />
      <div className="skeleton h-40 w-full rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="skeleton h-80 rounded-3xl lg:col-span-2" />
        <div className="skeleton h-80 rounded-3xl" />
      </div>
    </div>
  );
}
