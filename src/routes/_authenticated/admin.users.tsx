import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, Loader2, ShieldCheck, Shield, UserCog, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminAccess } from "./admin";
import { adminListUsers, adminSetRole, adminSave } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

const STATUSES = ["active", "suspended", "banned"] as const;
const TYPES = ["student", "tutor", "parent"] as const;

function UsersPage() {
  const access = useAdminAccess();
  const queryClient = useQueryClient();
  const listUsers = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetRole);
  const save = useServerFn(adminSave);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [accountType, setAccountType] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "profiles", search, status, accountType],
    queryFn: () => listUsers({ data: { search, status, accountType } }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
  };

  const roleMutation = useMutation({
    mutationFn: (input: { userId: string; role: "admin" | "moderator"; grant: boolean }) => setRole({ data: input }),
    onSuccess: () => {
      toast.success("Role updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: string }) =>
      save({ data: { table: "profiles", id: input.id, values: { status: input.status } } }),
    onSuccess: () => {
      toast.success("Account updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const users = data ?? [];

  return (
    <AdminShell
      title="Users & roles"
      description="Every member of Learns Academy, their account type, status and staff permissions."
      account={access}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              maxLength={80}
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {isLoading ? (
            <div className="grid h-40 place-items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="grid h-40 place-items-center text-sm text-muted-foreground">No users match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Points</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Roles</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => {
                    const id = String(u['id']);
                    const roles: string[] = (u['roles'] as string[]) ?? [];
                    const userStatus = String(u['status'] ?? "active");
                    return (
                      <tr key={id} className="transition hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {String(u['full_name'] ?? u['email'] ?? "?").charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{String(u['full_name'] ?? "Unnamed")}</span>
                              <span className="block truncate text-[11px] text-muted-foreground">{String(u['email'] ?? "")}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{String(u['account_type'] ?? "—")}</td>
                        <td className="px-4 py-3 tabular-nums">{Number(u['points'] ?? 0)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              userStatus === "active"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : userStatus === "suspended"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {userStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {roles.length === 0 && <span className="text-xs text-muted-foreground">member</span>}
                            {roles.map((r) => (
                              <span
                                key={r}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary"
                              >
                                {r === "admin" ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {access.isAdmin && (
                              <>
                                <button
                                  onClick={() =>
                                    roleMutation.mutate({ userId: id, role: "admin", grant: !roles.includes("admin") })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] hover:bg-muted"
                                >
                                  <ShieldCheck className="h-3 w-3" />
                                  {roles.includes("admin") ? "Revoke admin" : "Make admin"}
                                </button>
                                <button
                                  onClick={() =>
                                    roleMutation.mutate({
                                      userId: id,
                                      role: "moderator",
                                      grant: !roles.includes("moderator"),
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] hover:bg-muted"
                                >
                                  <UserCog className="h-3 w-3" />
                                  {roles.includes("moderator") ? "Revoke mod" : "Make mod"}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() =>
                                statusMutation.mutate({ id, status: userStatus === "active" ? "suspended" : "active" })
                              }
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] hover:bg-muted",
                                userStatus !== "active" && "text-emerald-600",
                              )}
                            >
                              {userStatus === "active" ? <Ban className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                              {userStatus === "active" ? "Suspend" : "Reactivate"}
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
      </div>
    </AdminShell>
  );
}
