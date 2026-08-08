import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Menu, X, ShieldCheck, Home } from "lucide-react";
import { NAV_GROUPS, STATIC_NAV } from "@/lib/admin-resources";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  account: { name: string | null; email: string | null; isAdmin: boolean };
};

export function AdminShell({ children, title, description, actions, account }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin-login", replace: true });
  }

  const nav = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="h-4.5 w-4.5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold">Learns Academy</span>
          <span className="block text-[11px] text-muted-foreground">Admin panel</span>
        </span>
      </Link>

      <NavItem to="/admin" label="Dashboard" icon={LayoutDashboard} active={pathname === "/admin"} onClick={() => setOpen(false)} />

      <Section label="People">
        <NavItem
          to="/admin/users"
          label={STATIC_NAV.users.label}
          icon={STATIC_NAV.users.icon}
          active={pathname === "/admin/users"}
          onClick={() => setOpen(false)}
        />
        {NAV_GROUPS.find((g) => g.group === "People")?.items.map((item) => (
          <NavItem
            key={item.slug}
            to={`/admin/${item.slug}`}
            label={item.label}
            icon={item.icon}
            active={pathname === `/admin/${item.slug}`}
            onClick={() => setOpen(false)}
          />
        ))}
      </Section>

      {NAV_GROUPS.filter((g) => g.group !== "People" && g.items.length > 0).map((group) => (
        <Section key={group.group} label={group.group}>
          {group.items.map((item) => (
            <NavItem
              key={item.slug}
              to={`/admin/${item.slug}`}
              label={item.label}
              icon={item.icon}
              active={pathname === `/admin/${item.slug}`}
              onClick={() => setOpen(false)}
            />
          ))}
          {group.group === "System" && (
            <NavItem
              to="/admin/settings"
              label={STATIC_NAV.settings.label}
              icon={STATIC_NAV.settings.icon}
              active={pathname === "/admin/settings"}
              onClick={() => setOpen(false)}
            />
          )}
        </Section>
      ))}

      <div className="mt-auto space-y-2 border-t border-border pt-3">
        <div className="rounded-xl border border-border bg-background p-2.5">
          <p className="truncate text-sm font-semibold">{account.name ?? "Administrator"}</p>
          <p className="truncate text-[11px] text-muted-foreground">{account.email}</p>
          <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {account.isAdmin ? "Admin" : "Moderator"}
          </span>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Home className="h-4 w-4" /> View site
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] border-r border-border bg-card lg:block">{nav}</aside>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs border-r border-border bg-card lg:hidden">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close admin menu"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
            {nav}
          </aside>
        </>
      )}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:px-6">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">{title}</h1>
            {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <ThemeToggle />
          </div>
        </header>
        <main className="px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/75 hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
