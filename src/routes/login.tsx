import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, Sparkles, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · SalesCoach AI" },
      { name: "description", content: "Sign in to your SalesCoach AI account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome, ${user.username}!`);
      navigate({ to: user.role === "Manager" ? "/manager" : "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left — abstract animated graphic */}
      <section className="relative hidden overflow-hidden bg-gradient-primary lg:block">
        <div className="bg-mesh absolute inset-0 opacity-90" />
        <div className="absolute -left-24 top-24 h-80 w-80 blob float-slow bg-white/15 backdrop-blur-2xl" />
        <div className="absolute right-10 top-1/3 h-64 w-64 blob float-slower bg-emerald-300/30 backdrop-blur-xl" />
        <div className="absolute bottom-10 left-1/3 h-72 w-72 blob float-slow bg-primary-glow/40 backdrop-blur-xl" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <span>SalesCoach AI</span>
          </div>
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Field coaching, <span className="text-emerald-200">supercharged</span> by AI.
            </h1>
            <p className="text-white/85">
              Prioritized merchants, AI-generated visit briefs, and a coach on call —
              right in your pocket, every shift.
            </p>
            <div className="flex flex-wrap gap-2 pt-3">
              {["Prioritized visits", "AI recommendations", "Live coaching"].map((tag) => (
                <span key={tag} className="rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-md ring-1 ring-white/25">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/70">© {new Date().getFullYear()} GCash · Sales Enablement</p>
        </div>
      </section>

      {/* Right — glassmorphic card */}
      <section className="relative flex items-center justify-center bg-mesh p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
        <form onSubmit={onSubmit} className="relative z-10 w-full max-w-md slide-up">
          <div className="glass rounded-3xl p-8 shadow-elegant">
            <header className="mb-6 space-y-1">
              <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in with your GCash account to continue.
              </p>
            </header>

            <div className="space-y-4">
              <FieldEmail value={email} onChange={setEmail} />
              <FieldPassword
                value={password} onChange={setPassword}
                show={showPw} onToggle={() => setShowPw((v) => !v)}
              />
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded border-border" />
                  Remember device
                </label>
                <a className="font-medium text-primary hover:underline" href="#">Forgot password?</a>
              </div>

              <button
                type="submit" disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow disabled:opacity-70"
              >
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
                </span>
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Tip: use any email — emails containing <code className="rounded bg-muted px-1">manager</code> get the Manager view.
              </p>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

function FieldEmail({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground">Email</span>
      <div className="group relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          type="email" required autoComplete="email" placeholder="agent@gcash.com"
          value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-white/80 py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200 hover:border-primary/40 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
        />
      </div>
    </label>
  );
}

function FieldPassword({
  value, onChange, show, onToggle,
}: { value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground">Password</span>
      <div className="group relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          type={show ? "text" : "password"} required autoComplete="current-password"
          placeholder="••••••••"
          value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-white/80 py-2.5 pl-9 pr-10 text-sm outline-none transition-all duration-200 hover:border-primary/40 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
        />
        <button
          type="button" onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
