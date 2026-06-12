import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, LayoutDashboard, Users, Sparkles, ShieldCheck, Store, MessageCircle, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ChatWidget } from "@/components/ChatWidget";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Strict rule: any refresh wipes auth → bounce to /login.
  useEffect(() => {
    if (!user) navigate({ to: "/login", replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const home =
    user.role === "Admin" ? "/admin" :
    user.role === "Manager" ? "/manager" : "/dashboard";

  return (
    <div className="min-h-screen bg-mesh">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to={home} className="flex items-center gap-2 font-semibold">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">SalesCoach AI</span>
          </Link>

          <nav className="ml-2 flex items-center gap-1">
            {user.role === "DSP" && (
              <NavItem to="/dashboard" active={pathname.startsWith("/dashboard")} icon={<LayoutDashboard className="h-4 w-4" />}>
                Dashboard
              </NavItem>
            )}
            {user.role === "Manager" && (
              <NavItem to="/manager" active={pathname.startsWith("/manager")} icon={<Users className="h-4 w-4" />}>
                Team
              </NavItem>
            )}
            {user.role === "Admin" && (
              <NavItem to="/admin" active={pathname.startsWith("/admin")} icon={<Shield className="h-4 w-4" />}>
                Admin
              </NavItem>
            )}
            <NavItem to="/merchants" active={pathname.startsWith("/merchants")} icon={<Store className="h-4 w-4" />}>
              Merchants
            </NavItem>
            <NavItem to="/chat" active={pathname.startsWith("/chat")} icon={<MessageCircle className="h-4 w-4" />}>
              AI Coach
            </NavItem>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold capitalize leading-tight">{user.username}</div>
              <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" /> {user.role}
              </div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-bold uppercase text-primary-foreground shadow-elegant">
              {user.username.charAt(0)}
            </div>
            <button
              onClick={async () => { await logout(); navigate({ to: "/login", replace: true }); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <ChatWidget />
    </div>
  );
}

function NavItem({ to, active, icon, children }: { to: string; active: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={[
        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300",
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      ].join(" ")}
    >
      {icon}
      {children}
    </Link>
  );
}
