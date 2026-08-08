import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  FileText,
  Flag,
  UsersRound,
  HelpCircle,
  Timer,
  BadgeDollarSign,
  ClipboardList,
  Megaphone,
  EyeOff,
  Loader2,
} from "lucide-react";
import { adminStats } from "@/lib/admin.functions";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminAccess } from "@/lib/use-admin-access";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: DashboardPage,
});

const AnyLink = Link as unknown as React.ComponentType<Record<string, unknown>>;

function DashboardPage() {
  const access = useAdminAccess();
  const fetchStats = useServerFn(adminStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchStats(),
    staleTime: 30_000,
  });

  const t = data?.totals;
  const cards = [
    { label: "Total users", value: t?.users, icon: Users, to: "/admin/users", tone: "bg-primary/10 text-primary" },
    { label: "Tutors", value: t?.tutors, icon: GraduationCap, to: "/admin/tutors", tone: "bg-emerald-500/10 text-emerald-600" },
    { label: "Feed posts", value: t?.posts, icon: FileText, to: "/admin/posts", tone: "bg-sky-500/10 text-sky-600" },
    { label: "Open reports", value: t?.openReports, icon: Flag, to: "/admin/reports", tone: "bg-destructive/10 text-destructive" },
    { label: "Study groups", value: t?.groups, icon: UsersRound, to: "/admin/groups", tone: "bg-violet-500/10 text-violet-600" },
    { label: "Questions", value: t?.questions, icon: HelpCircle, to: "/admin/questions", tone: "bg-amber-500/10 text-amber-600" },
    { label: "Mock tests", value: t?.mockTests, icon: Timer, to: "/admin/mock-tests", tone: "bg-cyan-500/10 text-cyan-600" },
    { label: "Active ads", value: t?.ads, icon: BadgeDollarSign, to: "/admin/ads", tone: "bg-pink-500/10 text-pink-600" },
    {
      label: "Pending applications",
      value: t?.pendingApplications,
      icon: ClipboardList,
      to: "/admin/tutor-applications",
      tone: "bg-orange-500/10 text-orange-600",
    },
    { label: "Hidden posts", value: t?.hiddenPosts, icon: EyeOff, to: "/admin/posts", tone: "bg-muted text-muted-foreground" },
    {
      label: "Announcements",
      value: t?.announcements,
      icon: Megaphone,
      to: "/admin/announcements",
      tone: "bg-teal-500/10 text-teal-600",
    },
    { label: "Students", value: t?.students, icon: Users, to: "/admin/users", tone: "bg-indigo-500/10 text-indigo-600" },
  ];

  const maxSignup = Math.max(1, ...(data?.signupSeries ?? []).map((s) => s.count));

  return (
    <AdminShell
      title={`Welcome back, ${access.name?.split(" ")[0] ?? "Admin"}`}
      description="Everything happening across Learns Academy, at a glance."
      account={access}
    >
      {isLoading && (
        <div className="grid h-40 place-items-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {cards.map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <AnyLink
                  to={card.to}
                  className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm"
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${card.tone}`}>
                    <card.icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-2xl font-semibold tabular-nums">{card.value ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </AnyLink>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold">New sign-ups · last 14 days</h2>
              <div className="mt-5 flex h-40 items-end gap-1.5">
                {data.signupSeries.map((point) => (
                  <div key={point.day} className="flex flex-1 flex-col items-center gap-1.5">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(point.count / maxSignup) * 100}%` }}
                      className="w-full rounded-t-md bg-primary/80"
                      style={{ minHeight: 4 }}
                      title={`${point.count} sign-ups`}
                    />
                    <span className="text-[9px] text-muted-foreground">{point.day}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Newest members</h2>
              <ul className="mt-3 space-y-3">
                {data.recentUsers.length === 0 && <li className="text-xs text-muted-foreground">No members yet.</li>}
                {data.recentUsers.map((u) => (
                  <li key={String(u['id'])} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {String(u['full_name'] ?? u['email'] ?? "?").charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{String(u['full_name'] ?? "Unnamed")}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{String(u['email'] ?? "")}</span>
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                      {String(u['account_type'] ?? "")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Recent admin activity</h2>
            <ul className="mt-3 divide-y divide-border">
              {data.recentActivity.length === 0 && (
                <li className="py-2 text-xs text-muted-foreground">Nothing logged yet.</li>
              )}
              {data.recentActivity.map((a) => (
                <li key={String(a['id'])} className="flex items-center gap-3 py-2 text-sm">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    {String(a['action'])}
                  </span>
                  <span className="flex-1 truncate text-muted-foreground">
                    {String(a['entity'])} · {String(a['entity_id'] ?? "—")}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(String(a['created_at'])).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
