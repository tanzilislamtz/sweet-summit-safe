import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bookmark,
  Check,
  CheckCircle2,
  Clock,
  Flag,
  ListChecks,
  RefreshCw,
  Target,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { z } from "zod";
import { getLeaderboard, getMockTest, getMockTestPaper } from "@/data/mock-tests";
import { ResultModal } from "@/components/ResultModal";
import { summarise } from "@/lib/practice-results";
import type { Question } from "@/data/quiz";

const searchSchema = z.object({
  mode: z.enum(["practice", "exam"]).default("exam"),
});

export const Route = createFileRoute("/quiz/mock-test_/$testId_/run")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Mock test in progress — Learns Academy" },
      {
        name: "description",
        content: "Timed mock test interface with question palette, instant scoring and solutions.",
      },
      { property: "og:title", content: "Mock test in progress — Learns Academy" },
      {
        property: "og:description",
        content: "Answer, flag and review questions, then get your score and rank instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MockTestRun,
});

type View = "exam" | "result" | "review" | "leaderboard";

function MockTestRun() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();
  const test = getMockTest(testId);

  const paper = useMemo<Question[]>(() => (test ? getMockTestPaper(test) : []), [test]);

  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(paper.length).fill(null),
  );
  const [flags, setFlags] = useState<boolean[]>(() => Array(paper.length).fill(false));
  const [current, setCurrent] = useState(0);
  const [time, setTime] = useState((test?.minutes ?? 25) * 60);
  const [view, setView] = useState<View>("exam");
  const [confirm, setConfirm] = useState(false);
  const [resultModal, setResultModal] = useState(false);

  useEffect(() => {
    if (view !== "exam") return;
    const t = setInterval(() => {
      setTime((v) => {
        if (v <= 1) {
          setView("result");
          setResultModal(true);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [view]);

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

  const answered = answers.filter((a) => a !== null).length;
  const correct = paper.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0);
  const wrong = answered - correct;
  const skipped = paper.length - answered;
  const score = Math.max(
    0,
    Math.round(((correct - wrong * test.negative) / Math.max(1, paper.length)) * 100),
  );

  function pick(i: number, option: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = option;
      return next;
    });
  }

  /* ---------------- result / review / leaderboard ---------------- */

  if (view !== "exam") {
    return (
      <section className="space-y-5 pb-6">
        <ResultModal
          open={resultModal}
          onClose={() => setResultModal(false)}
          contextLabel={test.subjectName}
          title={test.title}
          percent={score}
          correct={correct}
          wrong={wrong}
          skipped={skipped}
          total={paper.length}
          seconds={test.minutes * 60 - time}
          averagePercent={summarise().accuracy}
          onRetake={() => {
            setResultModal(false);
            setAnswers(Array(paper.length).fill(null));
            setFlags(Array(paper.length).fill(false));
            setCurrent(0);
            setTime(test.minutes * 60);
            setView("exam");
          }}
          onReviewWrong={() => {
            setResultModal(false);
            setView("review");
          }}
        />
        <ResultHeader
          test={test.title}
          view={view}
          onView={setView}
          onExit={() => navigate({ to: "/quiz/mock-test" })}
        />

        {view === "result" && (
          <ResultDashboard
            score={score}
            correct={correct}
            wrong={wrong}
            skipped={skipped}
            total={paper.length}
            timeUsed={test.minutes * 60 - time}
            paper={paper}
            answers={answers}
            onReview={() => setView("review")}
            onLeaderboard={() => setView("leaderboard")}
            onRetake={() => {
              setAnswers(Array(paper.length).fill(null));
              setFlags(Array(paper.length).fill(false));
              setCurrent(0);
              setTime(test.minutes * 60);
              setView("exam");
            }}
          />
        )}

        {view === "review" && <Solutions paper={paper} answers={answers} />}

        {view === "leaderboard" && <Leaderboard testId={test.id} />}
      </section>
    );
  }

  /* ---------------- exam ---------------- */

  const q = paper[current];
  const mm = String(Math.floor(time / 60)).padStart(2, "0");
  const ss = String(time % 60).padStart(2, "0");
  const lowTime = time < 60;

  return (
    <section className="pb-6">
      {/* header */}
      <div className="sticky top-0 z-20 -mx-1 rounded-b-3xl border-b border-border bg-background/90 px-1 py-3 backdrop-blur-xl">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => setConfirm(true)}
              aria-label="Exit test"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border transition hover:border-primary/40"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-widest text-muted-foreground">
                {test.subjectName} · MCQ mode
              </p>
              <p className="truncate text-sm font-semibold text-foreground">{test.title}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full border border-border px-3 py-1.5 text-xs tabular-nums text-muted-foreground sm:inline">
              {answered}/{paper.length}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums ${
                lowTime
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <Timer className="h-3.5 w-3.5" />
              {mm}:{ss}
            </span>
          </div>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-secondary"
            animate={{ width: `${(answered / paper.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* question */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="rounded-3xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                  Question {current + 1} of {paper.length}
                </span>
                <button
                  onClick={() =>
                    setFlags((f) => f.map((v, i) => (i === current ? !v : v)))
                  }
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    flags[current]
                      ? "border-accent bg-accent/25 text-foreground"
                      : "border-border text-muted-foreground hover:border-accent"
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" /> {flags[current] ? "Flagged" : "Flag"}
                </button>
              </div>

              <p className="mt-4 text-base font-medium leading-relaxed text-foreground">{q.text}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{q.topic}</p>

              <div className="mt-4 space-y-2.5">
                {q.options.map((opt, oi) => {
                  const active = answers[current] === oi;
                  return (
                    <motion.button
                      key={oi}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => pick(current, oi)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        active
                          ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                          : "border-border bg-surface hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="min-w-0 flex-1 text-foreground">{opt}</span>
                      {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between gap-2">
                <button
                  disabled={current === 0}
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:border-primary/40 disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" /> Prev
                </button>
                {current === paper.length - 1 ? (
                  <button
                    onClick={() => setConfirm(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                  >
                    Submit test <CheckCircle2 className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrent((c) => Math.min(paper.length - 1, c + 1))}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* palette */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Question palette
            </p>
            <div className="mt-3 grid grid-cols-6 gap-1.5 lg:grid-cols-5">
              {paper.map((_, i) => {
                const state =
                  i === current
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : flags[i]
                      ? "bg-accent/40 text-foreground"
                      : answers[i] !== null
                        ? "bg-secondary/15 text-secondary"
                        : "bg-muted text-muted-foreground";
                return (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`grid h-8 place-items-center rounded-lg text-xs font-semibold tabular-nums transition hover:opacity-80 ${state}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
              <Legend className="bg-secondary/15" label={`Answered · ${answered}`} />
              <Legend className="bg-accent/40" label={`Flagged · ${flags.filter(Boolean).length}`} />
              <Legend className="bg-muted" label={`Not answered · ${skipped}`} />
            </div>
            <button
              onClick={() => setConfirm(true)}
              className="mt-4 w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
            >
              Submit test
            </button>
          </div>
        </aside>
      </div>

      {/* submit confirmation */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
            onClick={() => setConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 text-center shadow-xl"
            >
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/30 text-2xl">
                ⚠️
              </span>
              <h2 className="mt-3 text-lg font-bold text-foreground">Submit test?</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                You can't change answers after submitting.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniBox value={answered} label="Answered" tone="secondary" />
                <MiniBox value={skipped} label="Skipped" tone="muted" />
                <MiniBox value={flags.filter(Boolean).length} label="Flagged" tone="accent" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirm(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:border-primary/40"
                >
                  Go back
                </button>
                <button
                  onClick={() => {
                    setConfirm(false);
                    setView("result");
                    setResultModal(true);
                  }}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                >
                  Yes, submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ---------------- result ---------------- */

function ResultHeader({
  test,
  view,
  onView,
  onExit,
}: {
  test: string;
  view: View;
  onView: (v: View) => void;
  onExit: () => void;
}) {
  const tabs: { id: View; label: string }[] = [
    { id: "result", label: "Result" },
    { id: "review", label: "Solutions" },
    { id: "leaderboard", label: "Leaderboard" },
  ];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          onClick={onExit}
          aria-label="Back to mock tests"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border transition hover:border-primary/40"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="truncate text-sm font-semibold text-foreground">{test}</p>
      </div>
      <div className="flex shrink-0 gap-1 rounded-full border border-border bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onView(t.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              view === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultDashboard({
  score,
  correct,
  wrong,
  skipped,
  total,
  timeUsed,
  paper,
  answers,
  onReview,
  onLeaderboard,
  onRetake,
}: {
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  timeUsed: number;
  paper: Question[];
  answers: (number | null)[];
  onReview: () => void;
  onLeaderboard: () => void;
  onRetake: () => void;
}) {
  const byTopic = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    paper.forEach((q, i) => {
      const e = map.get(q.topic) ?? { correct: 0, total: 0 };
      e.total++;
      if (answers[i] === q.answer) e.correct++;
      map.set(q.topic, e);
    });
    return [...map.entries()].slice(0, 6);
  }, [paper, answers]);

  const mm = Math.floor(timeUsed / 60);
  const ss = timeUsed % 60;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-brand sm:p-7"
      >
        <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />
        <span className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <ScoreRing value={score} />
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl">
              {score >= 80 ? "Great job! 🎉" : score >= 50 ? "Good effort 👏" : "Keep pushing 💪"}
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/75">
              You scored <b>{correct}</b> out of <b>{total}</b> in {mm}m {ss}s.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ResultChip Icon={CheckCircle2} value={correct} label="Correct" />
              <ResultChip Icon={X} value={wrong} label="Wrong" />
              <ResultChip Icon={Bookmark} value={skipped} label="Skipped" />
              <ResultChip Icon={Clock} value={`${mm}m`} label="Time used" />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-primary" /> Performance by chapter
          </h2>
          <div className="mt-4 space-y-3">
            {byTopic.map(([topic, v]) => {
              const pct = Math.round((v.correct / v.total) * 100);
              return (
                <div key={topic}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-xs font-medium text-foreground">{topic}</p>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {v.correct}/{v.total}
                    </p>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7 }}
                      className={`h-full rounded-full ${
                        pct >= 70 ? "bg-secondary" : pct >= 40 ? "bg-accent" : "bg-destructive"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="h-4 w-4 text-primary" /> What to do next
          </h2>
          <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
              Review every wrong answer with the AI explanation.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
              Re-practise the weakest chapter above before the next test.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
              Retake this paper in 3 days to lock the concepts.
            </li>
          </ul>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={onReview}
              className="rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
            >
              View solutions
            </button>
            <button
              onClick={onLeaderboard}
              className="rounded-xl bg-secondary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
            >
              Leaderboard
            </button>
            <button
              onClick={onRetake}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold transition hover:border-primary/40"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retake
            </button>
            <Link
              to="/quiz/mock-test"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold transition hover:border-primary/40"
            >
              <ListChecks className="h-3.5 w-3.5" /> More tests
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Solutions({ paper, answers }: { paper: Question[]; answers: (number | null)[] }) {
  return (
    <div className="space-y-3">
      {paper.map((q, i) => {
        const picked = answers[i];
        const ok = picked === q.answer;
        return (
          <motion.article
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.015, 0.3) }}
            className="rounded-3xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Question {i + 1} · {q.topic}
              </p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  picked === null
                    ? "bg-muted text-muted-foreground"
                    : ok
                      ? "bg-secondary/12 text-secondary"
                      : "bg-destructive/10 text-destructive"
                }`}
              >
                {picked === null ? "Skipped" : ok ? "Correct" : "Wrong"}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">{q.text}</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, oi) => {
                const isAnswer = oi === q.answer;
                const isPicked = oi === picked;
                return (
                  <div
                    key={oi}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                      isAnswer
                        ? "border-secondary/50 bg-secondary/8 text-foreground"
                        : isPicked
                          ? "border-destructive/40 bg-destructive/5 text-foreground"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    <span className="font-semibold">{String.fromCharCode(65 + oi)}.</span>
                    <span className="min-w-0 flex-1">{opt}</span>
                    {isAnswer && <Check className="h-3.5 w-3.5 shrink-0 text-secondary" />}
                    {isPicked && !isAnswer && <X className="h-3.5 w-3.5 shrink-0 text-destructive" />}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded-2xl bg-muted/60 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Explanation
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{q.explanation}</p>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

function Leaderboard({ testId }: { testId: string }) {
  const rows = getLeaderboard(testId);
  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
        <Trophy className="h-4 w-4 text-accent" /> Test leaderboard
      </h2>
      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li
            key={r.rank}
            className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3 ${
              r.you ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold tabular-nums ${
                r.rank === 1
                  ? "bg-accent text-foreground"
                  : r.rank <= 3
                    ? "bg-secondary/15 text-secondary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {r.rank}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{r.name}</span>
              <span className="block text-[11px] text-muted-foreground">Time {r.time}</span>
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-primary">{r.score}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- small pieces ---------------- */

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <p className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded ${className}`} />
      {label}
    </p>
  );
}

function MiniBox({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "secondary" | "muted" | "accent";
}) {
  const bg =
    tone === "secondary"
      ? "bg-secondary/12 text-secondary"
      : tone === "accent"
        ? "bg-accent/30 text-foreground"
        : "bg-muted text-muted-foreground";
  return (
    <div className={`rounded-2xl p-2.5 ${bg}`}>
      <p className="text-base font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}

function ResultChip({
  Icon,
  value,
  label,
}: {
  Icon: typeof Clock;
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 px-3 py-2 ring-1 ring-primary-foreground/15">
      <p className="inline-flex items-center gap-1.5 text-base font-bold tabular-nums">
        <Icon className="h-4 w-4 opacity-80" />
        {value}
      </p>
      <p className="truncate text-[11px] text-primary-foreground/70">{label}</p>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const size = 150;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto shrink-0" style={{ width: size, height: size }}>
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
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="stroke-primary-foreground"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-3xl font-bold tabular-nums">{value}%</p>
          <p className="text-[11px] uppercase tracking-wider text-primary-foreground/70">
            Your score
          </p>
        </div>
      </div>
    </div>
  );
}
