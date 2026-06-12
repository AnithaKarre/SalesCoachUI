import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Sparkles, Loader2, CheckCircle2, CircleDotDashed, Circle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { getMerchantDetail, getMerchantHistory, updateRecommendationStatus } from "@/lib/api";
import { ErrorPanel } from "./_app.dashboard";

export const Route = createFileRoute("/_app/merchants/$id")({
  head: () => ({ meta: [{ title: "Merchant brief · SalesCoach AI" }] }),
  component: MerchantDetail,
});

function MerchantDetail() {
  const { id } = useParams({ from: "/_app/merchants/$id" });
  const qc = useQueryClient();

  const detail = useQuery({
    queryKey: ["merchant", id, "detail"],
    queryFn: () => getMerchantDetail(id),
  });
  const history = useQuery({
    queryKey: ["merchant", id, "history"],
    queryFn: () => getMerchantHistory(id),
  });

  const updateStatus = useMutation({
    mutationFn: ({ recId, status }: { recId: string; status: string }) =>
      updateRecommendationStatus(recId, status),
    onSuccess: (_d, vars) => {
      toast.success(`Status updated to "${vars.status}"`);
      qc.invalidateQueries({ queryKey: ["merchant", id] });
      qc.invalidateQueries({ queryKey: ["merchants", "prioritized"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not update status"),
  });

  if (detail.isLoading) return <DetailSkeleton />;
  if (detail.isError) return <ErrorPanel message={(detail.error as Error)?.message} />;

  const m: any = detail.data ?? {};
  const name = m.name ?? m.merchant_name ?? "Merchant";
  const category = m.category ?? "";
  const tier = m.tier ?? "";
  const area = m.area ?? m.region ?? "";
  const score = m.priorityScore ?? m.priority_score ?? m.score;
  const recommendation = m.recommendation ?? m.brief ?? m.ai_brief ?? "";
  const recommendationId =
    m.recommendationId ?? m.recommendation_id ?? m.recommendation?.id;
  const currentStatus = m.status ?? m.recommendation?.status ?? "Pending";

  return (
    <div className="space-y-6">
      <Link to="/merchants" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to merchants
      </Link>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="relative bg-gradient-primary p-6 text-primary-foreground">
          <div className="bg-mesh pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl font-bold uppercase ring-1 ring-white/30 backdrop-blur-md">
                {String(name).charAt(0)}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold sm:text-3xl">{name}</h1>
                <p className="truncate text-sm text-white/85">{[category, tier, area].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            {score != null && (
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur-md ring-1 ring-white/25">
                <div className="text-xs uppercase tracking-wider text-white/80">Priority score</div>
                <div className="text-2xl font-bold">{Number(score).toFixed(1)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(m)
            .filter(([k, v]) =>
              (typeof v === "string" || typeof v === "number") &&
              !["id", "name", "recommendation", "brief", "ai_brief", "status"].includes(k))
            .slice(0, 9)
            .map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-border bg-secondary/40 p-4">
                <div className="text-xs capitalize text-muted-foreground">{k.replace(/[_-]/g, " ")}</div>
                <div className="mt-1 truncate text-base font-semibold">{String(v)}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="glow-border rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">AI Coaching Brief</h2>
                <p className="text-xs text-muted-foreground">Generated by SalesCoach AI</p>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
              {recommendation || "No recommendation available."}
            </p>
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
              <Calendar className="h-4 w-4" /> Visit history
            </h2>
            {history.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
              </div>
            ) : history.isError ? (
              <ErrorPanel message={(history.error as Error)?.message} />
            ) : !history.data?.length ? (
              <p className="text-sm text-muted-foreground">No visits logged yet.</p>
            ) : (
              <ol className="relative space-y-3 border-l border-border pl-5">
                {history.data.map((h: any, i: number) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[26px] top-1.5 grid h-3 w-3 place-items-center rounded-full bg-primary ring-4 ring-primary/15" />
                    <div className="rounded-xl border border-border bg-secondary/30 p-3 text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold">{h.title ?? h.action ?? h.type ?? "Visit"}</span>
                        <span className="text-xs text-muted-foreground">{h.date ?? h.created_at ?? h.timestamp ?? ""}</span>
                      </div>
                      {h.notes || h.description ? (
                        <p className="mt-1 text-xs text-muted-foreground">{h.notes ?? h.description}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recommendation status</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {recommendationId ? `ID: ${recommendationId}` : "No recommendation linked"}
          </p>

          <div className="mt-5 flex flex-col gap-2">
            {(["Pending", "In Progress", "Done"] as const).map((s) => (
              <StatusButton
                key={s}
                active={currentStatus === s}
                loading={updateStatus.isPending && updateStatus.variables?.status === s}
                disabled={!recommendationId}
                onClick={() => recommendationId && updateStatus.mutate({ recId: String(recommendationId), status: s })}
                icon={s === "Done" ? <CheckCircle2 className="h-4 w-4" /> : s === "In Progress" ? <CircleDotDashed className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                label={s}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusButton({
  active, loading, disabled, onClick, icon, label,
}: { active: boolean; loading: boolean; disabled?: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick} disabled={loading || active || disabled}
      className={[
        "inline-flex items-center justify-between gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
        active ? "bg-gradient-primary text-primary-foreground shadow-elegant" : "bg-card hover:border-primary/40 hover:text-primary",
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
      <div className="skeleton h-6 w-40 rounded" />
      <div className="skeleton h-40 w-full rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="skeleton h-80 rounded-3xl lg:col-span-2" />
        <div className="skeleton h-80 rounded-3xl" />
      </div>
    </div>
  );
}
