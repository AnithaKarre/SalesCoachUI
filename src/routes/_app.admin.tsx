import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2, Shield, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import {
  adminChangeUserRole, adminCreateUser, adminDeactivateUser,
  adminGetAuditLogs, adminListUsers, adminUpdateUser,
} from "@/lib/api";
import { DataTable, ErrorPanel } from "./_app.dashboard";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin · SalesCoach AI" }] }),
  component: AdminPanel,
});

function AdminPanel() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: adminListUsers });
  const logs = useQuery({ queryKey: ["admin", "audit-logs"], queryFn: adminGetAuditLogs });

  const invalidateUsers = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const createUser = useMutation({
    mutationFn: (payload: any) => adminCreateUser(payload),
    onSuccess: () => { toast.success("User created"); invalidateUsers(); },
  });
  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminUpdateUser(id, payload),
    onSuccess: () => { toast.success("User updated"); invalidateUsers(); },
  });
  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminChangeUserRole(id, role),
    onSuccess: () => { toast.success("Role updated"); invalidateUsers(); },
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => adminDeactivateUser(id),
    onSuccess: () => { toast.success("User deactivated"); invalidateUsers(); },
  });

  const [form, setForm] = useState({ email: "", name: "", role: "DSP", password: "" });

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email) return;
    createUser.mutate(form);
    setForm({ email: "", name: "", role: "DSP", password: "" });
  }

  return (
    <div className="space-y-8">
      <header className="slide-up">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Administration</p>
        <h1 className="mt-1 text-3xl font-bold">Admin panel</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">Manage users, roles, and audit activity.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submitCreate} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold"><Plus className="h-4 w-4 text-primary" /> Create user</h2>
          <div className="space-y-3">
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" required />
            <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">Role</span>
              <select
                value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
              >
                <option>DSP</option><option>Manager</option><option>Admin</option>
              </select>
            </label>
            <button
              type="submit" disabled={createUser.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
            >
              {createUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
            </button>
          </div>
        </form>

        <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="flex items-center gap-2 text-base font-bold"><Shield className="h-4 w-4 text-primary" /> Users</h2>
          </div>
          {users.isLoading ? (
            <div className="p-6"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : users.isError ? (
            <div className="p-5"><ErrorPanel message={(users.error as Error)?.message} /></div>
          ) : !users.data?.length ? (
            <p className="p-6 text-sm text-muted-foreground">No users.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((u: any) => {
                    const id = String(u.id ?? u.user_id ?? u._id);
                    return (
                      <tr key={id} className="border-t border-border hover:bg-secondary/40">
                        <td className="px-5 py-3 font-medium">{u.name ?? u.full_name ?? u.username ?? "—"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                        <td className="px-5 py-3">
                          <select
                            defaultValue={u.role ?? "DSP"}
                            onChange={(e) => changeRole.mutate({ id, role: e.target.value })}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                          >
                            <option>DSP</option><option>Manager</option><option>Admin</option>
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                const name = window.prompt("New name", u.name ?? "");
                                if (name) updateUser.mutate({ id, payload: { name } });
                              }}
                              className="rounded-lg border border-border px-2 py-1 text-xs hover:border-primary/40 hover:text-primary"
                            >Edit</button>
                            <button
                              onClick={() => { if (confirm("Deactivate this user?")) deactivate.mutate(id); }}
                              className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3" /> Deactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="flex items-center gap-2 text-base font-bold"><ClipboardList className="h-4 w-4 text-primary" /> Audit logs</h2>
        </div>
        {logs.isLoading ? (
          <div className="p-6"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : logs.isError ? (
          <div className="p-5"><ErrorPanel message={(logs.error as Error)?.message} /></div>
        ) : logs.data?.length ? (
          <DataTable rows={logs.data} />
        ) : (
          <p className="p-6 text-sm text-muted-foreground">No audit logs yet.</p>
        )}
      </section>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium">{label}</span>
      <input
        type={type} value={value} required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/20"
      />
    </label>
  );
}
