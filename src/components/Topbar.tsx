import { Link } from "@tanstack/react-router";
import {
  Search,
  Bell,
  MessageCircle,
  Menu,
  Plus,
  ArrowLeft,
  Command,
} from "lucide-react";
import logoAsset from "@/assets/learns-academy-logo.png.asset.json";
import { toggleMessengerPopup } from "@/lib/messenger";
import { ThemeToggle } from "@/components/ThemeToggle";



type Variant = "app" | "auth";

export function Topbar({
  variant = "app",
  onMenu,
  showBack = false,
}: {
  variant?: Variant;
  onMenu?: () => void;
  showBack?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-3 lg:gap-3 lg:px-8">
        {variant === "app" && (
          <button
            onClick={onMenu}
            aria-label="Open menu"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground/70 hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {variant === "auth" && showBack && (
          <Link
            to="/"
            aria-label="Back"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground/70 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}

        <Link to="/" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="Learns Academy" className="h-10 w-auto" />
        </Link>


        {variant === "app" ? (
          <>
            <div className="relative ml-auto hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search topics, tutors, courses…"
                className="h-10 w-full rounded-full border border-border bg-muted/60 pl-10 pr-14 text-sm outline-none transition focus:border-primary/40 focus:bg-surface focus:ring-4 focus:ring-primary/10"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline-flex">
                <Command className="h-3 w-3" /> K
              </kbd>
            </div>

            <div className="ml-auto flex items-center gap-1 md:ml-0">
              <ThemeToggle />
              <IconBtn label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
              </IconBtn>
              <Link
                to="/message"
                aria-label="Messages"
                className="relative grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition hover:bg-muted hover:text-foreground lg:hidden"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background">
                  3
                </span>
              </Link>
              <button
                data-messenger-trigger
                onClick={() => toggleMessengerPopup()}
                aria-label="Messages"
                className="relative hidden h-10 w-10 place-items-center rounded-full text-foreground/70 transition hover:bg-muted hover:text-foreground lg:grid"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background">
                  3
                </span>
              </button>

              <button className="ml-1 hidden items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 sm:inline-flex">
                <Plus className="h-4 w-4" /> New Post
              </button>
              <div className="ml-2 h-9 w-9 overflow-hidden rounded-full border-2 border-accent bg-muted">
                <div className="grid h-full w-full place-items-center bg-primary text-sm font-bold text-primary-foreground">
                  A
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden items-center rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
            >
              <Plus className="h-4 w-4" /> Join
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="relative grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
