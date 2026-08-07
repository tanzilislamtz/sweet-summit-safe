import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, UserCheck, MessagesSquare, Timer, Star, Users, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getSession, type Session } from "@/lib/session";
import { ThemeToggle } from "@/components/ThemeToggle";

const items = [
  { icon: Home, label: "Home", to: "/" as const, match: "home" as const },
  { icon: BookOpen, label: "Practice", to: "/quiz" as const, match: "practice" as const },
  { icon: Timer, label: "Mock Test", to: "/quiz/mock-test" as const, match: "mock" as const },
  { icon: Users, label: "Group Study", to: "/group-study" as const, match: "group" as const },
  { icon: Star, label: "Favorite", to: "/favorites" as const, match: "favorite" as const },
  { icon: MessagesSquare, label: "Messages", to: "/message" as const, match: "message" as const },
  { icon: UserCheck, label: "Available Tutor", to: "/available-tutor" as const, match: "available" as const },
];


export function LeftNav({ stickyClass = "sticky top-24" }: { stickyClass?: string } = {}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("la:auth", sync);
    return () => window.removeEventListener("la:auth", sync);
  }, []);

  const name = session?.name || session?.email?.split("@")[0] || "Guest";
  const initial = name.charAt(0).toUpperCase();

  const isMock = pathname.startsWith("/quiz/mock-test");
  const isFav = pathname.startsWith("/favorites");
  return (
    <aside className="hidden lg:block lg:h-full">
      <nav className={`${stickyClass} flex h-full flex-col`}>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">


        {items.map(({ icon: Icon, label, to, match }) => {
          const active =
            match === "home"
              ? pathname === "/"
              : match === "practice"
                ? pathname.startsWith("/quiz") && !isMock && !isFav
                : match === "favorite"
                  ? isFav
                : match === "mock"
                  ? isMock
                : match === "group"
                  ? pathname.startsWith("/group-study")
                  : match === "message"
                    ? pathname.startsWith("/message")
                    : match === "available"
                      ? pathname.startsWith("/available-tutor")
                      : false;
          return (
            <Link
              key={label}
              to={to}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/75 hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
        </div>

        {/* Menu footer — appearance + profile */}
        <div className="mt-3 shrink-0 space-y-2.5 border-t border-border pt-3">
          <ThemeToggle variant="menu" />
          <Link
            to="/profile"
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 transition hover:border-primary/40 hover:bg-muted"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {session?.email ?? "View profile"}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </div>
      </nav>


    </aside>
  );
}
