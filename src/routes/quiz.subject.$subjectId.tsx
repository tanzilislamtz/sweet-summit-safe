import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  FileText,
  ListChecks,
  PenLine,
  Target,
  TrendingUp,
} from "lucide-react";
import { subjects } from "@/data/quiz";
import { getSubjectStats, practiceModes } from "@/data/practice";

export const Route = createFileRoute("/quiz/subject/$subjectId")({
  component: SubjectOverview,
});

function SubjectOverview() {
  const { subjectId } = Route.useParams();
  const subject = subjects.find((s) => s.id === subjectId);

  if (!subject) {
    return (
      <section className="pt-10 text-center">
        <p className="text-sm text-muted-foreground">Subject not found.</p>
        <Link to="/quiz" className="mt-4 inline-block text-sm text-primary underline">
          Back to practice
        </Link>
      </section>
    );
  }

  const st = getSubjectStats(subject);

  const modeCards = [
    {
      mode: practiceModes[0],
      Icon: ListChecks,
      badge: "MCQ",
      cta: "Start MCQ Practice",
      tone: "primary" as const,
      stats: [
        { Icon: FileText, value: st.mcq, label: "Questions" },
        { Icon: Target, value: st.mcqAttempted, label: "Attempted" },
        { Icon: TrendingUp, value: `${st.accuracy}%`, label: "Accuracy" },
      ],
    },
    {
      mode: practiceModes[1],
      Icon: PenLine,
      badge: "CQ",
      cta: "Start CQ Practice",
      tone: "secondary" as const,
      stats: [
        { Icon: FileText, value: st.cq, label: "Questions" },
        { Icon: Target, value: st.cqAttempted, label: "Attempted" },
        { Icon: TrendingUp, value: `${st.cqAvg}%`, label: "Avg. Score" },
      ],
    },
    {
      mode: practiceModes[2],
      Icon: BookOpen,
      badge: "Board",
      cta: "Explore Board Questions",
      tone: "primary" as const,
      stats: [
        { Icon: FileText, value: st.boardPapers, label: "Papers" },
        { Icon: Target, value: st.boardAttempted, label: "Attempted" },
        { Icon: TrendingUp, value: `${st.boardAvg}%`, label: "Avg. Score" },
      ],
    },
  ];

  return (
    <section className="space-y-5 pb-4">
      <Crumbs subjectId={subjectId} current={subject.name} />

      {/* ── Subject hero ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-primary p-4 text-primary-foreground shadow-brand sm:p-6"
      >
        <span className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary-foreground/10 blur-3xl" />
        <span className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-foreground/12 text-2xl ring-1 ring-primary-foreground/20 sm:h-16 sm:w-16 sm:text-3xl">
              {subject.emoji}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-3xl">
                {subject.name}
              </h1>
              <p className="mt-1 max-w-md text-[13px] leading-relaxed text-primary-foreground/75 sm:text-sm">
                {subject.nameBn} · chapter-wise practice, board patterns and instant AI
                explanations.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] sm:mt-4 sm:gap-2">
                {[
                  `${st.chapters} Chapters`,
                  `${st.mcq} MCQ`,
                  `${st.cq} CQ`,
                  `${st.boardPapers} Board Qs`,
                ].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-lg bg-primary-foreground/10 px-2 py-1 font-medium ring-1 ring-primary-foreground/15 sm:px-2.5 sm:py-1.5"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

      </motion.div>

      {/* ── Mode cards ───────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        {modeCards.map(({ mode, Icon, badge, cta, stats, tone }, i) => {
          const accentText = tone === "secondary" ? "text-secondary" : "text-primary";
          const accentBg = tone === "secondary" ? "bg-secondary" : "bg-primary";
          const accentSoft = tone === "secondary" ? "bg-secondary/10" : "bg-primary/10";
          const hoverBorder =
            tone === "secondary" ? "hover:border-secondary/45" : "hover:border-primary/45";
          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${hoverBorder}`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-1 ${accentBg} opacity-70 transition group-hover:opacity-100`}
              />
              <div className="flex items-start justify-between">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${accentBg} text-primary-foreground shadow-sm`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span
                  className={`rounded-full ${accentSoft} px-2.5 py-1 text-[11px] font-semibold ${accentText}`}
                >
                  {badge}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-foreground">{mode.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{mode.desc}</p>

              <div className="mb-5 mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-muted/60 p-3">
                {stats.map((s) => (
                  <div key={s.label} className="min-w-0">
                    <p className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
                      <s.Icon className={`h-3.5 w-3.5 ${accentText}`} />
                      {s.value}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <Link
                to="/quiz/subject/$subjectId/$category"
                params={{ subjectId, category: mode.id }}
                className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl ${accentBg} px-3 py-2.5 text-center text-[13px] font-semibold leading-tight text-primary-foreground shadow-sm transition hover:opacity-95 sm:text-sm`}
              >
                <span className="min-w-0 truncate">{cta}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function Crumbs({ subjectId, current }: { subjectId: string; current: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Link
        to="/quiz"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border transition hover:border-primary/40 hover:text-primary"
        aria-label="Back to practice"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <Link to="/quiz" className="hover:text-primary">
        Practice
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="truncate font-medium text-foreground">{current}</span>
      <span className="sr-only">{subjectId}</span>
    </div>
  );
}

function HeroStat({ top, label, pct }: { top: string; label: string; pct: number }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold tabular-nums">{top}</p>
      <p className="text-[11px] text-primary-foreground/65">{label}</p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
        <div
          className="h-full rounded-full bg-primary-foreground"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const size = 96;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative hidden shrink-0 sm:block" style={{ width: size, height: size }}>
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
          animate={{ strokeDashoffset: c - (c * value) / 100 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="stroke-primary-foreground"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-lg font-bold tabular-nums">{value}%</p>
          <p className="text-[10px] text-primary-foreground/65">Completed</p>
        </div>
      </div>
    </div>
  );
}
