import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  Timer,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResultModalProps {
  open: boolean;
  onClose: () => void;
  /** e.g. "Mathematics · Chapter 3: Algebraic Expressions" */
  contextLabel: string;
  /** e.g. topic / test name */
  title: string;
  /** 0-100 */
  percent: number;
  correct: number;
  wrong: number;
  /** partially correct answers (CQ) — omit for MCQ */
  partial?: number;
  /** unanswered */
  skipped?: number;
  total: number;
  /** seconds spent */
  seconds?: number;
  /** overall average across all past attempts, 0-100 */
  averagePercent?: number;
  onRetake: () => void;
  /** shown only when a next chapter exists */
  nextChapterLabel?: string;
  onNextChapter?: () => void;
  /** jumps to the wrong / missing answer review */
  onReviewWrong?: () => void;
  className?: string;
}

interface Grade {
  letter: string;
  award: string;
  message: string;
  tone: "pos" | "mid" | "neg";
}

/** Board-style grading with an encouraging, never-harsh message. */
function gradeFor(percent: number): Grade {
  if (percent >= 80)
    return { letter: "A+", award: "🏆 Champion", message: "Outstanding! You've mastered this topic — keep going!", tone: "pos" };
  if (percent >= 70)
    return { letter: "A", award: "🥇 Achiever", message: "Excellent work! A little polish and you're at the top.", tone: "pos" };
  if (percent >= 60)
    return { letter: "A-", award: "🥈 Riser", message: "Great effort! You're very close to the top band.", tone: "pos" };
  if (percent >= 50)
    return { letter: "B", award: "🥉 Steady", message: "Good going! Revise the weak parts and you'll jump fast.", tone: "mid" };
  if (percent >= 40)
    return { letter: "C", award: "🌱 Growing", message: "Nice try! Focus on the missed questions — you'll improve.", tone: "mid" };
  if (percent >= 33)
    return { letter: "D", award: "💪 Fighter", message: "You passed! Now build the basics and push higher.", tone: "mid" };
  return { letter: "F", award: "🔁 Restart", message: "Don't worry — review the answers and retake. Progress starts now.", tone: "neg" };
}

/** Practical, score-aware guidance the learner can act on right away. */
function suggestionsFor(percent: number, wrong: number, skipped: number): string[] {
  const list: string[] = [];
  if (percent >= 80) {
    list.push("Move to the next chapter and keep this pace.");
    list.push("Attempt a timed mock test to lock in the speed.");
  } else if (percent >= 50) {
    list.push("Re-read the concepts behind the questions you missed.");
    list.push("Retake this set after revision — target 80%+.");
  } else {
    list.push("Go through the chapter notes once before retaking.");
    list.push("Practice slowly first; speed comes after accuracy.");
  }
  if (wrong > 0) list.push(`Review all ${wrong} wrong answer${wrong > 1 ? "s" : ""} with the explanations.`);
  if (skipped > 0) list.push(`You skipped ${skipped} question${skipped > 1 ? "s" : ""} — attempt every question next time.`);
  return list.slice(0, 4);
}

const fmtClock = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Celebration + analysis modal shown right after any exam or mock test.
 * Purely presentational — the caller owns scoring and navigation.
 */
export function ResultModal({
  open,
  onClose,
  contextLabel,
  title,
  percent,
  correct,
  wrong,
  partial = 0,
  skipped = 0,
  total,
  seconds,
  averagePercent,
  onRetake,
  nextChapterLabel,
  onNextChapter,
  onReviewWrong,
  className,
}: ResultModalProps) {
  const grade = useMemo(() => gradeFor(percent), [percent]);
  const tips = useMemo(() => suggestionsFor(percent, wrong, skipped), [percent, wrong, skipped]);

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-foreground/50 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Exam result"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl",
              className,
            )}
          >
            <button
              onClick={onClose}
              aria-label="Close result"
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-primary-foreground/15 text-primary-foreground transition hover:bg-primary-foreground/25"
            >
              <X className="h-4 w-4" />
            </button>

            {/* ── Score header ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-primary px-5 py-6 text-primary-foreground">
              <span className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary-foreground/10 blur-3xl" />
              <span className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]" />
              <Sparkle count={12} />

              <div className="relative flex items-center gap-4">
                <ScoreRing value={percent} />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/60">
                    {contextLabel}
                  </p>
                  <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-primary-foreground/12 px-2 py-1 ring-1 ring-primary-foreground/20">
                      <Award className="h-3.5 w-3.5" /> Grade {grade.letter}
                    </span>
                    <span className="rounded-lg bg-primary-foreground/12 px-2 py-1 ring-1 ring-primary-foreground/20">
                      {grade.award}
                    </span>
                    {typeof seconds === "number" && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-primary-foreground/12 px-2 py-1 ring-1 ring-primary-foreground/20 tabular-nums">
                        <Timer className="h-3.5 w-3.5" /> {fmtClock(seconds)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="relative mt-4 rounded-2xl bg-primary-foreground/10 px-3.5 py-2.5 text-sm font-medium ring-1 ring-primary-foreground/15">
                {grade.message}
              </p>
            </div>

            {/* ── Breakdown ────────────────────────────────── */}
            <div className="space-y-4 px-5 py-5">
              <div className={cn("grid gap-2", partial > 0 ? "grid-cols-4" : "grid-cols-3")}>
                <Tally Icon={CheckCircle2} label="Correct" value={correct} tone="pos" />
                {partial > 0 && <Tally Icon={Target} label="Partial" value={partial} tone="mid" />}
                <Tally Icon={XCircle} label="Wrong" value={wrong} tone="neg" />
                <Tally Icon={BarChart3} label="Total" value={total} />
              </div>

              <div className="rounded-2xl border border-border bg-muted/40 p-3.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>This attempt</span>
                  <span className="tabular-nums text-foreground">{percent}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  />
                </div>
                {typeof averagePercent === "number" && (
                  <>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>Your overall average</span>
                      <span className="tabular-nums text-foreground">{averagePercent}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${averagePercent}%` }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        className="h-full rounded-full bg-secondary"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {percent >= averagePercent
                        ? `You scored ${percent - averagePercent}% above your average — great momentum.`
                        : `You're ${averagePercent - percent}% below your average — a quick revision will fix it.`}
                    </p>
                  </>
                )}
              </div>

              {/* Guidance */}
              <div className="rounded-2xl border border-border bg-surface p-3.5">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Lightbulb className="h-4 w-4 text-accent-foreground" /> What to do next
                </p>
                <ul className="mt-2 space-y-1.5">
                  {tips.map((t) => (
                    <li key={t} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── Actions ────────────────────────────────── */}
              <div className="space-y-2">
                {onReviewWrong && (
                  <button
                    onClick={onReviewWrong}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    <ListIcon /> View missing / wrong answers
                    {wrong + skipped > 0 && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
                        {wrong + skipped}
                      </span>
                    )}
                  </button>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={onRetake}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"
                  >
                    <RefreshCw className="h-4 w-4" /> Retake exam
                  </button>
                  {onNextChapter ? (
                    <button
                      onClick={onNextChapter}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition hover:opacity-95"
                    >
                      Next chapter
                      <span className="max-w-[90px] truncate text-[11px] font-medium opacity-80">
                        {nextChapterLabel}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition hover:opacity-95"
                    >
                      See full analysis
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ListIcon() {
  return <Sparkles className="h-4 w-4 text-primary" />;
}

function Tally({
  Icon,
  label,
  value,
  tone,
}: {
  Icon: typeof CheckCircle2;
  label: string;
  value: number;
  tone?: "pos" | "mid" | "neg";
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-2.5 text-center">
      <Icon
        className={cn(
          "mx-auto h-4 w-4",
          tone === "pos" && "text-secondary",
          tone === "mid" && "text-accent-foreground",
          tone === "neg" && "text-destructive",
          !tone && "text-muted-foreground",
        )}
      />
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const size = 84;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-primary-foreground/20"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * Math.min(100, Math.max(0, value))) / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="stroke-primary-foreground"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <p className="text-xl font-bold tabular-nums">{value}%</p>
      </div>
    </div>
  );
}

/** Lightweight confetti — no extra dependency. */
function Sparkle({ count }: { count: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i * 97) % 100,
        delay: (i % 6) * 0.12,
        size: 4 + (i % 3) * 2,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 160, opacity: [0, 1, 0], rotate: 180 }}
          transition={{ duration: 2.4, delay: b.delay, repeat: Infinity, repeatDelay: 1.6 }}
          className="absolute rounded-[2px] bg-primary-foreground/50"
          style={{ left: `${b.left}%`, width: b.size, height: b.size }}
        />
      ))}
    </div>
  );
}
