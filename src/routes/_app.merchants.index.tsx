import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { getPrioritizedMerchants } from "@/lib/api";
import { ErrorPanel } from "./_app.dashboard";

export const Route = createFileRoute("/_app/merchants/")({
  head: () => ({ meta: [{ title: "Merchants · SalesCoach AI" }] }),
  component: MerchantsList,
});

function MerchantsList() {
  const q = useQuery({
    queryKey: ["merchants", "prioritized"],
    queryFn: getPrioritizedMerchants,
  });

  return (
    <div className="space-y-6">
      <header className="slide-up">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Prioritized merchants</p>
        <h1 className="mt-1 text-3xl font-bold">Today's outreach plan</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Ranked by the SalesCoach AI scoring engine.
        </p>
      </header>

      {q.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      ) : q.isError ? (
        <ErrorPanel message={(q.error as Error)?.message} />
      ) : !q.data?.length ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No merchants returned by the backend.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {q.data.map((m: any, i: number) => <Card key={m.id ?? i} m={m} rank={i + 1} />)}
        </div>
      )}
      {q.isFetching && !q.isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Refreshing…</div>
      )}
    </div>
  );
}

function Card({ m, rank }: { m: any; rank: number }) {
  const id = m.id ?? m.merchant_id ?? m.merchantId;
  const name = m.name ?? m.merchant_name ?? "Unnamed";
  const sub = m.category ?? m.tier ?? "";
  const area = m.area ?? m.region ?? "";
  const score = m.priorityScore ?? m.priority_score ?? m.score;
  return (
    <Link
      to="/merchants/$id" params={{ id: String(id) }}
      className="card-interactive group relative block overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-muted text-[11px] font-bold text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        #{rank}
      </div>
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-lg font-bold uppercase text-primary-foreground shadow-elegant">
          {String(name).charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{name}</h3>
          <p className="truncate text-xs text-muted-foreground">{[sub, area].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="inline-flex items-center gap-1 font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Score {score != null ? Number(score).toFixed(1) : "—"}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-primary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
          View brief <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
