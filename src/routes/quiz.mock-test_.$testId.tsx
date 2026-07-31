import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  GraduationCap,
  ListChecks,
  Play,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { getMockTest } from "@/data/mock-tests";

export const Route = createFileRoute("/quiz/mock-test_/$testId")({
  head: () => ({
    meta: [
      { title: "Test instructions — Learns Academy" },
      {
        name: "description",
        content: "Read the exam rules, check the syllabus coverage and start your mock test.",
      },
      { property: "og:title", content: "Test instructions — Learns Academy" },
      {
        property: "og:description",
        content: "Timed mock test with instant scoring, solutions and national ranking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TestInstructions,
});

const rules = [
  "Once started, the timer will not pause — finish in one sitting.",
  "Every question carries 1 mark; wrong answers may carry negative marks.",
  "You can flag questions and revisit them before submitting.",
  "Use the question palette to jump to any question instantly.",
  "The test auto-submits when the timer reaches zero.",
  "Solutions and AI explanations unlock right after submission.",
];

function TestInstructions() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();
  const test = getMockTest(testId);
  const [mode, setMode] = useState<"practice" | "exam">("exam");
  const [agreed, setAgreed] = useState(false);

  if (!test) {
    return (
      <section className="pt-10 text-center">
        <p className="text-sm text-muted-foreground">Test not found.</p>
        <Link to="/quiz/mock-test" className="mt-4 inline-block text-sm text-primary underline">
          Back to mock tests
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-5 pb-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          to="/quiz/mock-test"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border transition hover:border-primary/40 hover:text-primary"
          aria-label="Back to mock tests"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link to="/quiz/mock-test" className="hover:text-primary">
          Mock Test
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate font-medium text-foreground">{test.title}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Left: test summary ─────────────────────────────── */}
        <div className="min-w-0 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-brand sm:p-6"
          >
            <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />
            <span className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="relative">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ring-primary-foreground/20">
                <GraduationCap className="h-3.5 w-3.5" /> {test.subjectName} · SSC
              </p>
              <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-3xl">{test.title}</h1>
              <p className="mt-1.5 max-w-md text-[13px] text-primary-foreground/75">
                {test.chapterName
                  ? `Chapter focus: ${test.chapterName}`
                  : "Full syllabus coverage with board-standard question patterns."}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat value={String(test.questions)} label="Questions" />
                <Stat value={String(test.marks)} label="Marks" />
                <Stat value={`${test.minutes}m`} label="Duration" />
                <Stat value={test.negative ? `-${test.negative}` : "0"} label="Negative" />
              </div>
            </div>
          </motion.div>

          {/* Syllabus */}
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-primary" /> Syllabus coverage
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {test.syllabus.map((s) => (
                <span
                  key={s}
                  className="rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="h-4 w-4 text-primary" /> Test mode
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ModeCard
                active={mode === "practice"}
                onClick={() => setMode("practice")}
                title="Practice mode"
                desc="Answer at your own pace. Solutions after each question."
                Icon={ClipboardList}
              />
              <ModeCard
                active={mode === "exam"}
                onClick={() => setMode("exam")}
                title="Exam mode"
                desc="Strict timer, no hints — the real board experience."
                Icon={ShieldCheck}
              />
            </div>
          </div>
        </div>

        {/* ── Right: instructions ────────────────────────────── */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-secondary" /> Read the instructions carefully
            </h2>
            <ul className="mt-3 space-y-2.5">
              {rules.map((r) => (
                <li key={r} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>

            <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-2xl bg-muted/60 p-3 text-xs text-foreground">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[oklch(0.286_0.148_279)]"
              />
              <span>I have read and understood all the instructions.</span>
            </label>

            <button
              disabled={!agreed}
              onClick={() =>
                navigate({
                  to: "/quiz/mock-test/$testId/run",
                  params: { testId: test.id },
                  search: { mode },
                })
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-brand transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="h-4 w-4" /> I'm ready — start test
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat Icon={Users} value={`${(test.attempts / 1000).toFixed(1)}k`} label="Attempts" />
            <MiniStat Icon={ListChecks} value={`${test.avgScore}%`} label="Class avg." />
            <MiniStat
              Icon={Clock}
              value={test.bestScore ? `${test.bestScore}%` : "—"}
              label="Your best"
            />
            <MiniStat Icon={Target} value={test.free ? "Free" : "Premium"} label="Access" />
          </div>
        </aside>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 px-3 py-2 ring-1 ring-primary-foreground/15">
      <p className="text-base font-bold tabular-nums">{value}</p>
      <p className="truncate text-[11px] text-primary-foreground/70">{label}</p>
    </div>
  );
}

function MiniStat({
  Icon,
  value,
  label,
}: {
  Icon: typeof Users;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {value}
      </p>
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  desc,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  Icon: typeof Target;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/25"
          : "border-border bg-surface hover:border-primary/40"
      }`}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl ${
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2.5 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </button>
  );
}
