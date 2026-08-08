import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  SlidersHorizontal,
  Sparkles,
  Flame,
  MessageCircleQuestion,
  GraduationCap,
  MapPin,
  ArrowDownWideNarrow,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "For You", Icon: Sparkles },
  { label: "Popular", Icon: Flame },
  { label: "Q&A", Icon: MessageCircleQuestion },
  { label: "Trending Tutors", Icon: GraduationCap },
  { label: "Nearby", Icon: MapPin },
];
const SORTS = ["Latest", "Top", "Rising"];

const POST_TYPES = ["Questions", "Notes", "Tutor posts", "Study groups"];
const TIME_RANGES = ["Today", "This week", "This month", "All time"];

export function FeedToolbar() {
  const [active, setActive] = useState(0);
  const [sort, setSort] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [types, setTypes] = useState<string[]>([]);
  const [range, setRange] = useState(1);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filterOpen]);

  const toggleType = (t: string) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  
  // count active filters (excluding default sort)
  const activeCount = types.length + (verifiedOnly ? 1 : 0) + (range !== 1 ? 1 : 0);

  return (
    <div className="group relative rounded-2xl border border-border bg-gradient-to-br from-surface via-background to-surface p-2 shadow-sm">
      {/* Decorative gradient blob */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-accent/40 blur-3xl" />
      </div>

      <div className="relative flex items-center gap-2">
        {/* Tab chips — occupies full width after removing sorts */}
        <div className="relative flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t, i) => {
            const isActive = i === active;
            const Icon = t.Icon;
            return (
              <button
                key={t.label}
                onClick={() => setActive(i)}
                className={cn(
                  "relative shrink-0 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? "text-background"
                    : "text-foreground/60 hover:text-foreground hover:bg-muted/50"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="feed-tab-pill"
                    className="absolute inset-0 rounded-full bg-foreground shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "text-background" : "text-foreground/40")} strokeWidth={2.2} />
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Trigger — Now containing Sort + Filters */}
        <div ref={filterRef} className="relative shrink-0">
          <button
            aria-label="Filter and Sort"
            onClick={() => setFilterOpen((o) => !o)}
            className={cn(
              "relative grid h-10 w-10 place-items-center rounded-full border transition-all active:scale-95",
              filterOpen || activeCount > 0
                ? "border-primary/40 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "border-border bg-surface text-foreground/70 hover:border-primary/40 hover:text-primary"
            )}
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
            {activeCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-black text-white ring-2 ring-background">
                {activeCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-12 z-50 w-72 origin-top-right rounded-3xl border border-border bg-surface p-4 shadow-2xl backdrop-blur-xl"
              >
                <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Preferences</p>
                  <button
                    onClick={() => {
                      setTypes([]);
                      setRange(1);
                      setVerifiedOnly(false);
                      setSort(0);
                    }}
                    className="text-xs font-bold text-primary transition hover:opacity-80"
                  >
                    Reset all
                  </button>
                </div>

                {/* Sort Section */}
                <div className="mb-5">
                  <p className="mb-2 text-xs font-bold text-foreground">Sort Feed by</p>
                  <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-muted/40 p-1">
                    {SORTS.map((s, i) => (
                      <button
                        key={s}
                        onClick={() => setSort(i)}
                        className={cn(
                          "relative rounded-xl py-2 text-[11px] font-black uppercase tracking-tight transition-all",
                          sort === i
                            ? "bg-background text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Section */}
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-bold text-foreground">Content Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {POST_TYPES.map((t) => {
                        const on = types.includes(t);
                        return (
                          <button
                            key={t}
                            onClick={() => toggleType(t)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all",
                              on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold text-foreground">Time Range</p>
                    <div className="grid grid-cols-2 gap-2">
                      {TIME_RANGES.map((r, i) => (
                        <button
                          key={r}
                          onClick={() => setRange(i)}
                          className={cn(
                            "flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-all",
                            range === i
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          {r}
                          {range === i && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 transition hover:border-primary/30">
                    <div className="flex items-center gap-2">
                      <div className="grid h-5 w-5 place-items-center rounded bg-tutor/10 text-tutor">
                        <GraduationCap className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-bold text-foreground">Verified tutors</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="h-4 w-4 rounded-md border-border bg-surface text-primary accent-primary outline-none ring-offset-background focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                </div>

                <button
                  onClick={() => setFilterOpen(false)}
                  className="mt-6 w-full rounded-2xl bg-foreground py-3 text-xs font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Apply Settings
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Meta row — single responsive line */}
      <div className="relative mt-3 flex min-w-0 items-center gap-1.5 overflow-x-auto border-t border-dashed border-border/70 pt-2.5 text-[11px] text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ArrowDownWideNarrow className="h-3.5 w-3.5 shrink-0" />
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium">
          Showing <span className="font-bold text-foreground">{TABS[active].label}</span>
          <span className="opacity-30">·</span>
          sorted by <span className="font-bold text-foreground">{SORTS[sort]}</span>
        </span>
      </div>
    </div>
  );
}
