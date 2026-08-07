import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const MODES: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Day mode", icon: Sun },
  { id: "dark", label: "Night mode", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export interface ThemeToggleProps {
  /** "icon" = single tap toggle (topbar), "menu" = full picker (side menus). */
  variant?: "icon" | "menu";
  className?: string;
}

/** Day/night switcher with an animated sun ⇄ moon transition. */
export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { mode, resolved, ready, setMode, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (variant === "menu") {
    return (
      <div className={cn("flex items-center gap-1 rounded-full bg-muted/30 p-1 border border-border/50", className)}>
        {MODES.map((m) => {
          const active = ready && mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={active}
              className={cn(
                "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-all duration-200",
                active 
                  ? "text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="theme-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 -z-10 rounded-full bg-primary"
                />
              )}
              <m.icon className={cn("h-3.5 w-3.5 transition-transform duration-200", active && "scale-110")} />
              <span className="relative z-10">
                {m.id === "light" ? "Day" : m.id === "dark" ? "Night" : "Auto"}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={toggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        aria-label={resolved === "dark" ? "Switch to day mode" : "Switch to night mode"}
        title={resolved === "dark" ? "Day mode" : "Night mode"}
        className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full text-foreground/70 transition hover:bg-muted hover:text-foreground"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={resolved}
            initial={{ y: 12, opacity: 0, rotate: -60, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
            exit={{ y: -12, opacity: 0, rotate: 60, scale: 0.7 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="grid place-items-center"
          >
            {resolved === "dark" ? (
              <Moon className="h-5 w-5 text-accent" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-40 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-popover-foreground transition hover:bg-muted"
              >
                <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                {m.label}
                {ready && mode === m.id && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
