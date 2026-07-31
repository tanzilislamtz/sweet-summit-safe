import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Layers,
  PenLine,
  Sparkles,
  Timer,
} from "lucide-react";
import { subjects } from "@/data/quiz";
import { getSubjectStats } from "@/data/practice";

export const Route = createFileRoute("/quiz/")({
  head: () => ({
    meta: [
      { title: "Practice — Learns Academy" },
      {
        name: "description",
        content:
          "Chapter-wise MCQ, CQ and board question practice with live progress tracking.",
      },
      { property: "og:title", content: "Practice — Learns Academy" },
      {
        property: "og:description",
        content: "Pick a subject, choose a chapter and practice at your own pace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PracticeHub,
});

function PracticeHub() {
  const list = subjects.map((s) => ({ s, st: getSubjectStats(s) }));
  const cont = list[2] ?? list[0];

  const overall = Math.round(
    list.reduce((a, x) => a + x.st.progress, 0) / Math.max(1, list.length),
  );
  const totalMcq = list.reduce((a, x) => a + x.st.mcq, 0);
  const totalCq = list.reduce((a, x) => a + x.st.cq, 0);

  return (
    <section className="space-y-6 pb-4">
      {/* ── Hero band ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-brand sm:p-8"
      >
        <span className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-secondary/30 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-primary-foreground/10 blur-3xl" />
        <span className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ring-primary-foreground/20">
              <GraduationCap className="h-3.5 w-3.5" /> Class 10 · SSC Science
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Practice</h1>
            <p className="mt-2 max-w-md text-sm text-primary-foreground/75">
              Chapter-wise MCQ, creative questions and real board papers — with instant AI
              explanations.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <HeroChip Icon={Layers} label={`${subjects.length} Subjects`} />
              <HeroChip Icon={BookOpen} label={`${totalMcq} MCQ`} />
              <HeroChip Icon={PenLine} label={`${totalCq} CQ`} />
            </div>
          </div>

          {/* Overall ring */}
          <div className="flex items-center gap-4 rounded-2xl bg-primary-foreground/10 p-4 ring-1 ring-primary-foreground/15 backdrop-blur-sm">
            <HeroRing value={overall} />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-primary-foreground/60">
                Overall
              </p>
              <p className="text-lg font-semibold">Keep going</p>
              <Link
                to="/quiz/progress"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-foreground/80 underline-offset-4 hover:underline"
              >
                View analytics <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Continue learning ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm"
      >
        <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary to-secondary" />
        <div className="grid gap-5 pl-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
              <Sparkles className="h-3.5 w-3.5" /> Continue learning
            </p>
            <h2 className="mt-2 truncate text-xl font-semibold text-foreground">
              {cont.s.name}
              <span className="text-muted-foreground"> · Chapter 1</span>
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-primary">
                MCQ
              </span>
            </h2>
            <div className="mt-4 max-w-sm">
              <Bar value={cont.st.progress} />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {cont.st.progress}% completed
              </p>
            </div>
          </div>
          <Link
            to="/quiz/subject/$subjectId"
            params={{ subjectId: cont.s.id }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition hover:-translate-y-0.5"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {/* ── Subjects ──────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">All Subjects</h2>
          <span className="text-xs text-muted-foreground">{subjects.length} subjects</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {list.map(({ s, st }, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i }}
            >
              <Link
                to="/quiz/subject/$subjectId"
                params={{ subjectId: s.id }}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 transition group-hover:bg-primary/10" />
                <div className="relative flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/8 text-xl ring-1 ring-primary/10">
                    {s.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{s.nameBn}</p>
                  </div>
                </div>

                <div className="relative mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-muted/60 p-2 text-center">
                  <MiniCell value={st.chapters} label="Chapters" />
                  <MiniCell value={st.mcq} label="MCQ" />
                  <MiniCell value={st.cq} label="CQ" />
                </div>

                <div className="relative mt-auto pt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${st.progress}%` }}
                        transition={{ duration: 0.7, delay: 0.1 + 0.03 * i }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      />
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums text-foreground">
                      {st.progress}%
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Mock test entry ───────────────────────────────────── */}
      <Link
        to="/quiz/mock-test"
        className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-secondary/25 bg-gradient-to-r from-secondary/8 via-surface to-surface p-4 shadow-sm transition hover:border-secondary/50"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground shadow-tutor-glow">
          <Timer className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Ready for a full exam?</p>
          <p className="truncate text-xs text-muted-foreground">
            Build a timed mock test across subjects
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-secondary" />
      </Link>
    </section>
  );
}

function HeroChip({ Icon, label }: { Icon: typeof BookOpen; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium ring-1 ring-primary-foreground/15">
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function MiniCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold tabular-nums text-foreground">{value}</p>
      <p className="truncate text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function HeroRing({ value }: { value: number }) {
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
          animate={{ strokeDashoffset: c - (c * value) / 100 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="stroke-primary-foreground"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <p className="text-base font-bold tabular-nums">{value}%</p>
      </div>
    </div>
  );
}
