import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, PenLine, Sparkles, Target } from "lucide-react";
import { listAttempts, summarise, type PracticeAttempt } from "@/lib/practice-results";

export const Route = createFileRoute("/quiz/progress")({
  head: () => ({
    meta: [
      { title: "Your Progress — Learns Academy" },
      {
        name: "description",
        content:
          "Track your MCQ and CQ practice accuracy, weekly consistency and subject-wise performance.",
      },
      { property: "og:title", content: "Your Progress — Learns Academy" },
      {
        property: "og:description",
        content: "See how your practice scores add up, subject by subject.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressPage,
});

const days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

function ProgressPage() {
  // localStorage is browser-only: read after hydration to avoid SSR mismatch.
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  useEffect(() => {
    const read = () => setAttempts(listAttempts());
    read();
    window.addEventListener("la:practice-updated", read);
    return () => window.removeEventListener("la:practice-updated", read);
  }, []);

  const s = summarise(attempts);
  const max = Math.max(1, ...s.weekly);

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground">
      <div className="mx-auto max-w-2xl px-5 pt-6">
        <div className="flex items-center gap-3">
          <Link
            to="/quiz"
            className="grid h-10 w-10 place-items-center rounded-full border border-border"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your progress</h1>
            <p className="text-sm text-muted-foreground">
              Built from every practice paper you submit.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Metric label="Accuracy" value={`${s.accuracy}%`} />
          <Metric label="Questions" value={String(s.questions)} />
          <Metric label="Papers" value={String(s.attempts)} />
        </div>

        {s.attempts === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
            <Target className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No papers submitted yet — finish an MCQ or CQ practice and your percentage will show up here.
            </p>
            <Link
              to="/quiz"
              className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Start practising
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Metric label="Correct" value={String(s.correct)} />
              <Metric label="Wrong" value={String(s.wrong)} />
              <Metric label="Time" value={`${s.minutes}m`} />
            </div>

            <section className="mt-8">
              <p className="text-sm font-medium text-muted-foreground">This week</p>
              <div className="mt-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex h-40 items-end gap-2">
                  {s.weekly.map((v, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(v / max) * 100}%` }}
                        transition={{ delay: 0.04 * i, duration: 0.5, ease: "easeOut" }}
                        className="w-full rounded-md bg-primary"
                      />
                      <span className="text-[10px] text-muted-foreground">{days[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-8">
              <p className="text-sm font-medium text-muted-foreground">By subject</p>
              <div className="mt-4 space-y-4">
                {s.bySubject.map((row, i) => (
                  <div key={row.subjectId}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span>{row.subjectName}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {row.accuracy}% · {row.questions} Q
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${row.accuracy}%` }}
                        transition={{ delay: 0.04 * i, duration: 0.6 }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <p className="text-sm font-medium text-muted-foreground">Recent papers</p>
              <div className="mt-3 space-y-2">
                {attempts.slice(0, 8).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      {a.mode === "mcq" ? (
                        <Sparkles className="h-4 w-4" />
                      ) : (
                        <PenLine className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {a.topicName ?? a.chapterName ?? a.subjectName}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {a.mode.toUpperCase()} · {a.correct}/{a.total} correct ·{" "}
                        {new Date(a.at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                      {a.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
