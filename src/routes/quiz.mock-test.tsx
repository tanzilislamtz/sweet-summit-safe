import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  ListChecks,
  Play,
  Sparkles,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { subjects } from "@/data/quiz";
import {
  getMockStats,
  listMockTests,
  mockCategories,
  type MockCategoryId,
  type MockTest,
} from "@/data/mock-tests";

export const Route = createFileRoute("/quiz/mock-test")({
  head: () => ({
    meta: [
      { title: "Mock Tests — Learns Academy" },
      {
        name: "description",
        content:
          "Full-length model tests, chapter-wise tests and previous board papers with live ranking and instant solutions.",
      },
      { property: "og:title", content: "Mock Tests — Learns Academy" },
      {
        property: "og:description",
        content: "Challenge yourself with timed model tests and compare your rank nationwide.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MockTestHub,
});

function MockTestHub() {
  const stats = getMockStats();
  const [category, setCategory] = useState<MockCategoryId>("model");
  const [subjectId, setSubjectId] = useState<string | "all">("all");

  const tests = useMemo(() => {
    const all = listMockTests(category, subjectId === "all" ? undefined : subjectId);
    return all.slice(0, subjectId === "all" ? 12 : 8);
  }, [category, subjectId]);

  const recommended = useMemo(() => listMockTests("model").slice(0, 2), []);
  const lastTest = recommended[0];

  return (
    <section className="space-y-6 pb-6">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-brand sm:p-8"
      >
        <span className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-secondary/30 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <span className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ring-primary-foreground/20">
              <Sparkles className="h-3.5 w-3.5" /> Welcome back, Arafat
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
              Challenge yourself. Excel in real exams.
            </h1>
            <p className="mt-2 max-w-lg text-sm text-primary-foreground/75">
              Timed papers, national ranking and question-by-question solutions — everything you
              need before the board exam.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <HeroStat Icon={ListChecks} value={String(stats.taken)} label="Tests taken" />
              <HeroStat Icon={BarChart3} value={`${stats.avgScore}%`} label="Avg. score" />
              <HeroStat Icon={Trophy} value={`#${stats.rank}`} label="National rank" />
              <HeroStat Icon={Flame} value={`${stats.streak}d`} label="Streak" />
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-primary-foreground/10 p-4 ring-1 ring-primary-foreground/15 backdrop-blur-sm">
            <HeroRing value={stats.accuracy} />
            <div className="min-w-0 space-y-1">
              <p className="text-xs uppercase tracking-wider text-primary-foreground/60">Accuracy</p>
              <p className="text-lg font-semibold tabular-nums">{stats.accuracy}%</p>
              <p className="text-[11px] text-primary-foreground/70">
                <Clock className="mr-1 inline h-3 w-3" />
                {stats.hoursSpent} practised
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Categories ───────────────────────────────────────── */}
      <div>
        <SectionHead title="Mock test categories" sub="Pick a category to see its tests." />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {mockCategories.map((c, i) => {
            const bg =
              c.tone === "primary"
                ? "bg-primary text-primary-foreground"
                : c.tone === "secondary"
                  ? "bg-secondary text-primary-foreground"
                  : c.tone === "accent"
                    ? "bg-accent text-foreground"
                    : "bg-surface text-foreground";
            const count = listMockTests(c.id).length;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
              >
                <Link
                  to="/quiz/mock-test/category/$categoryId"
                  params={{ categoryId: c.id }}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${bg}`}
                >
                  <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-current opacity-[0.08] blur-2xl" />
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-current/10 text-xl ring-1 ring-current/15">
                      {c.emoji}
                    </span>
                    {c.badge && (
                      <span className="rounded-full bg-current/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {c.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{c.name}</h3>
                  <p className="text-[11px] opacity-70">{c.nameBn}</p>
                  <p className="mt-1.5 text-xs leading-relaxed opacity-75">{c.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
                    {count} tests
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Side rail ──────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        {lastTest && (
          <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Continue your last test
            </p>
            <h3 className="mt-2 text-sm font-semibold text-foreground">{lastTest.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {lastTest.questions} questions · {lastTest.minutes} min
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/5 rounded-full bg-secondary" />
            </div>
            <Link
              to="/quiz/mock-test/$testId"
              params={{ testId: lastTest.id }}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
            >
              <Play className="h-4 w-4" /> Resume
            </Link>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recommended for you
          </p>
          <ul className="mt-2 space-y-2">
            {recommended.map((t) => (
              <li key={t.id}>
                <Link
                  to="/quiz/mock-test/$testId"
                  params={{ testId: t.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 p-2.5 transition hover:border-primary/40 hover:bg-muted/50"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Award className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-foreground">
                      {t.title}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {t.questions} Q · {t.minutes} min
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-primary p-4 text-primary-foreground shadow-brand">
          <Trophy className="h-5 w-5" />
          <p className="mt-2 text-sm font-semibold">Weekly national ranking</p>
          <p className="mt-1 text-xs text-primary-foreground/75">
            Finish 3 model tests this week to enter the leaderboard.
          </p>
          <Link
            to="/quiz/leaderboard"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline-offset-4 hover:underline"
          >
            View leaderboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}


/* ---------------- pieces ---------------- */

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h2>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function HeroStat({
  Icon,
  value,
  label,
}: {
  Icon: typeof ListChecks;
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-primary-foreground/10 px-3 py-2 ring-1 ring-primary-foreground/15">
      <p className="inline-flex items-center gap-1.5 text-base font-bold tabular-nums">
        <Icon className="h-4 w-4 opacity-80" />
        {value}
      </p>
      <p className="truncate text-[11px] text-primary-foreground/70">{label}</p>
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
        <span className="text-sm font-bold tabular-nums">{value}%</span>
      </div>
    </div>
  );
}
