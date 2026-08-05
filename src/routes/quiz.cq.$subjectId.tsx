import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  ListChecks,
  PenLine,
  RotateCcw,
  Send,
  Sparkles,
  Timer as TimerIcon,
  XCircle,
} from "lucide-react";
import { z } from "zod";
import { subjects } from "@/data/quiz";
import { getChapters } from "@/data/practice";
import { getTopicCqQuestions, type CqPart, type CqQuestion } from "@/data/topic-cq";
import { QuestionFigure } from "@/components/QuestionFigure";
import { saveAttempt, summarise } from "@/lib/practice-results";
import { ResultModal } from "@/components/ResultModal";

import { cn } from "@/lib/utils";

const searchSchema = z.object({
  chapter: z.string(),
  topic: z.string(),
  mode: z.enum(["cq", "board"]).default("cq"),
});

export const Route = createFileRoute("/quiz/cq/$subjectId")({
  validateSearch: (s) => searchSchema.parse(s),
  component: CqPractice,
});

type Draft = Record<string, string>;

/** Verdict for a single written part after submission. */
type PartVerdict = "correct" | "partial" | "wrong";

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

const keywordHits = (part: CqPart, value: string) =>
  part.keywords.filter((k) => value.toLowerCase().includes(k.toLowerCase()));

/**
 * CQ answers are free text, so grading is heuristic: an answer counts as
 * correct when it is long enough AND covers at least ~60% of the expected
 * keywords; anything that shows partial understanding counts as partial.
 */
function gradePart(part: CqPart, value: string): PartVerdict {
  const words = wordCount(value);
  if (words === 0) return "wrong";
  const ratio = part.keywords.length ? keywordHits(part, value).length / part.keywords.length : 0;
  const longEnough = words >= part.minWords;
  if (ratio >= 0.6 && longEnough) return "correct";
  if (ratio >= 0.3 || longEnough) return "partial";
  return "wrong";
}

const fmtClock = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function CqPractice() {
  const { subjectId } = Route.useParams();
  const { chapter: chapterId, topic: topicId, mode } = Route.useSearch();
  const navigate = useNavigate();

  const subject = subjects.find((s) => s.id === subjectId);
  const chapter = getChapters(subjectId).find((c) => c.id === chapterId);
  const topic = chapter?.topics.find((t) => t.id === topicId);

  const paper = useMemo<CqQuestion[]>(() => {
    if (!chapter || !topic) return [];
    return getTopicCqQuestions({
      subjectId,
      chapterId: chapter.id,
      chapterName: chapter.name,
      topicId: topic.id,
      topicName: topic.name,
      count: mode === "board" ? 8 : 6,
    });
  }, [subjectId, chapter, topic, mode]);

  const [drafts, setDrafts] = useState<Draft>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const savedRef = useRef(false);

  // Timer keeps running until the paper is submitted.
  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [submitted]);

  const totalParts = paper.length * 4;
  const writtenParts = Object.values(drafts).filter((v) => wordCount(v) > 0).length;
  const progress = totalParts ? Math.round((writtenParts / totalParts) * 100) : 0;

  const verdicts = useMemo(() => {
    const map: Record<string, PartVerdict> = {};
    for (const q of paper) {
      for (const p of q.parts) {
        const key = `${q.id}-${p.label}`;
        map[key] = gradePart(p, drafts[key] ?? "");
      }
    }
    return map;
  }, [paper, drafts]);

  const score = useMemo(() => {
    const values = Object.values(verdicts);
    const correct = values.filter((v) => v === "correct").length;
    const partial = values.filter((v) => v === "partial").length;
    const wrong = values.filter((v) => v === "wrong").length;
    const total = values.length || 1;
    return {
      correct,
      partial,
      wrong,
      total: values.length,
      percent: Math.round(((correct + partial * 0.5) / total) * 100),
    };
  }, [verdicts]);

  // Persist once, right after submit, so the progress screens pick it up.
  useEffect(() => {
    if (!submitted || savedRef.current || !subject || !chapter || !topic) return;
    savedRef.current = true;
    saveAttempt({
      mode,
      subjectId,
      subjectName: subject.name,
      chapterName: chapter.name,
      topicName: topic.name,
      correct: score.correct,
      partial: score.partial,
      total: score.total,
      seconds: elapsed,
    });
  }, [submitted, subject, chapter, topic, mode, subjectId, score, elapsed]);

  if (!subject || !chapter || !topic || paper.length === 0) {
    return (
      <section className="pt-10 text-center">
        <p className="text-sm text-muted-foreground">This CQ set is not available.</p>
        <Link to="/quiz" className="mt-4 inline-block text-sm text-primary underline">
          Back to practice
        </Link>
      </section>
    );
  }

  const setDraft = (key: string, value: string) => setDrafts((d) => ({ ...d, [key]: value }));

  const retry = () => {
    setDrafts({});
    setRevealed({});
    setSubmitted(false);
    setModalOpen(false);
    setElapsed(0);
    savedRef.current = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Next chapter in this subject, when one exists.
  const allChapters = getChapters(subjectId);
  const chapterPos = allChapters.findIndex((c) => c.id === chapter.id);
  const nextChapter =
    chapterPos >= 0 && chapterPos < allChapters.length - 1 ? allChapters[chapterPos + 1] : undefined;

  return (
    <section className="space-y-5 pb-32">
      <ResultModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contextLabel={`${subject.name} · Chapter ${chapter.index}: ${chapter.name}`}
        title={topic.name}
        percent={score.percent}
        correct={score.correct}
        partial={score.partial}
        wrong={score.wrong}
        total={score.total}
        seconds={elapsed}
        averagePercent={summarise().accuracy}
        onRetake={retry}
        nextChapterLabel={nextChapter?.name}
        onNextChapter={
          nextChapter
            ? () =>
                navigate({
                  to: "/quiz/subject/$subjectId/$category/$chapterId",
                  params: { subjectId, category: mode, chapterId: nextChapter.id },
                })
            : undefined
        }
        onReviewWrong={() => {
          setModalOpen(false);
          setTimeout(
            () =>
              document
                .getElementById("cq-review")
                ?.scrollIntoView({ behavior: "smooth", block: "start" }),
            220,
          );
        }}
      />

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">

        <button
          onClick={() =>
            navigate({
              to: "/quiz/subject/$subjectId/$category/$chapterId",
              params: { subjectId, category: mode, chapterId: chapter.id },
            })
          }
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border transition hover:border-primary/40 hover:text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Link to="/quiz" className="hover:text-primary">
          Practice
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{subject.name}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate font-medium text-foreground">{topic.name}</span>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-brand sm:p-6"
      >
        <span className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/60">
              {mode === "board" ? "Board Question" : "CQ Practice"} · সৃজনশীল · লিখিত
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{topic.name}</h1>
            <p className="mt-1 truncate text-xs text-primary-foreground/70">
              {subject.name} · Chapter {chapter.index}: {chapter.name}
            </p>
          </div>
          <div className="rounded-2xl bg-primary-foreground/10 px-4 py-3 ring-1 ring-primary-foreground/15">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums">
              <TimerIcon className="h-4 w-4 opacity-80" /> {fmtClock(elapsed)}
            </p>
            <p className="text-[11px] text-primary-foreground/65">
              {paper.length} × 10 marks · {writtenParts}/{totalParts} written
            </p>
            <div className="mt-1.5 h-1.5 w-36 overflow-hidden rounded-full bg-primary-foreground/20">
              <motion.div
                className="h-full rounded-full bg-primary-foreground"
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Result summary */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-5">
              <ScoreRing value={score.percent} />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {score.percent >= 70
                    ? "দারুণ লিখেছো! 🎉"
                    : score.percent >= 40
                      ? "ভালো চেষ্টা — আরও গুছিয়ে লেখো"
                      : "আরেকবার প্র্যাকটিস করা দরকার"}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {score.total} parts · {fmtClock(elapsed)} spent · saved to your progress
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Tally label="Correct" value={score.correct} tone="pos" />
                  <Tally label="Partial" value={score.partial} tone="mid" />
                  <Tally label="Wrong" value={score.wrong} tone="neg" />
                </div>
              </div>
              <div className="flex w-full gap-2 sm:w-auto sm:flex-col">
                <button
                  onClick={retry}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Retry
                </button>
                <Link
                  to="/quiz/progress"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-95"
                >
                  View progress
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All questions on one page */}
      <div id="cq-review" className="space-y-4 scroll-mt-6">
        {paper.map((q, index) => (
          <motion.article
            key={q.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(0.04 * index, 0.24) }}
            className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
          >
            {/* Stimulus */}
            <div className="border-b border-border bg-primary/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  উদ্দীপক · Stimulus
                </p>
                <div className="ml-auto flex items-center gap-3">
                  <FavoriteButton
                    item={{
                      id: q.id,
                      type: "question",
                      title: q.stem,
                      questionData: {
                        text: q.stem,
                        options: q.parts.map(p => `${p.label}: ${p.question}`),
                        answer: -1,
                        explanation: "Written CQ practice",
                        figure: q.figure,
                        subjectId,
                        subjectName: subject.name,
                        topic: topic.name,
                        chapterName: chapter.name,
                        source: mode === "board" ? "board" : "cq",
                      }
                    }}
                    compact
                  />
                  <span className="rounded-full bg-secondary/15 px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                    {q.totalMarks} marks
                  </span>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line font-bangla text-[15px] leading-relaxed text-foreground">
                {q.stem}
              </p>
              {q.figure && <QuestionFigure spec={q.figure} />}
            </div>

            {/* Written parts */}
            <div className="divide-y divide-border">
              {q.parts.map((part) => {
                const key = `${q.id}-${part.label}`;
                return (
                  <PartEditor
                    key={part.label}
                    part={part}
                    value={drafts[key] ?? ""}
                    onChange={(v) => setDraft(key, v)}
                    submitted={submitted}
                    verdict={verdicts[key]}
                    revealed={submitted || !!revealed[key]}
                    onToggleReveal={() => setRevealed((r) => ({ ...r, [key]: !r[key] }))}
                  />
                );
              })}
            </div>
          </motion.article>
        ))}
      </div>

      {!submitted && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <PenLine className="h-3.5 w-3.5" />
          সব প্রশ্নের উত্তর লিখে একবারেই সাবমিট করো — তারপর ফলাফল ও মডেল উত্তর দেখতে পাবে।
        </p>
      )}

      {/* Sticky submit bar */}
      {!submitted && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur lg:left-[264px]">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {writtenParts}/{totalParts} answers written
              </p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-semibold tabular-nums text-foreground">
              <TimerIcon className="h-3.5 w-3.5 text-primary" /> {fmtClock(elapsed)}
            </span>
            <button
              onClick={() => setConfirming(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition hover:-translate-y-0.5"
            >
              <Send className="h-4 w-4" /> Submit
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-4 backdrop-blur-sm"
            onClick={() => setConfirming(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-lg"
            >
              <h3 className="text-base font-semibold text-foreground">Submit this paper?</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalParts - writtenParts > 0
                  ? `${totalParts - writtenParts} টি উত্তর এখনো লেখা হয়নি।`
                  : "সব উত্তর লেখা হয়েছে।"}{" "}
                সাবমিট করলে ফলাফল ও মডেল উত্তর দেখানো হবে।
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold transition hover:border-primary/40"
                >
                  Keep writing
                </button>
                <button
                  onClick={() => {
                    setConfirming(false);
                    setSubmitted(true);
                    setModalOpen(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}

                  className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                >
                  Submit now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------- part editor */

function PartEditor({
  part,
  value,
  onChange,
  submitted,
  verdict,
  revealed,
  onToggleReveal,
}: {
  part: CqPart;
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
  verdict: PartVerdict;
  revealed: boolean;
  onToggleReveal: () => void;
}) {
  const words = wordCount(value);
  const enough = words >= part.minWords;
  const hits = keywordHits(part, value);

  return (
    <div
      className={cn(
        "px-5 py-4 transition",
        submitted && verdict === "correct" && "bg-secondary/5",
        submitted && verdict === "partial" && "bg-accent/10",
        submitted && verdict === "wrong" && "bg-destructive/5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 font-bangla text-sm font-bold text-primary">
          {part.label}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {part.level}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">
          {part.marks} mark{part.marks > 1 ? "s" : ""}
        </span>
        {submitted && (
          <span
            className={cn(
              "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              verdict === "correct"
                ? "bg-secondary/20 text-secondary-foreground"
                : verdict === "partial"
                  ? "bg-accent/30 text-foreground"
                  : "bg-destructive/10 text-destructive",
            )}
          >
            {verdict === "wrong" ? (
              <XCircle className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {verdict}
          </span>
        )}
      </div>

      <p className="mt-2 font-bangla text-sm font-medium leading-relaxed text-foreground">
        {part.prompt}
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 2000))}
        rows={part.marks + 2}
        readOnly={submitted}
        placeholder="এখানে তোমার উত্তর লিখো..."
        className={cn(
          "mt-2.5 w-full resize-y rounded-2xl border border-border bg-background px-3.5 py-3 font-bangla text-sm leading-relaxed outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15",
          submitted && "cursor-default opacity-90",
        )}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span
          className={cn(
            "tabular-nums",
            enough ? "text-secondary-foreground" : "text-muted-foreground",
          )}
        >
          {words} words {enough ? "✓" : `· suggested ${part.minWords}+`}
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <ListChecks className="h-3.5 w-3.5" /> keywords {hits.length}/{part.keywords.length}
        </span>
        {!submitted && (
          <button
            onClick={onToggleReveal}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary transition hover:bg-primary/15"
          >
            {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {revealed ? "Hide model answer" : "Model answer"}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {revealed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-2xl border border-secondary/25 bg-secondary/8 p-3.5">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground">
                <BookOpenCheck className="h-3.5 w-3.5" /> Model answer
              </p>
              <p className="mt-1.5 font-bangla text-sm leading-relaxed text-foreground">
                {part.modelAnswer}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {part.keywords.map((k) => (
                  <span
                    key={k}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      hits.includes(k)
                        ? "bg-secondary/20 text-secondary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Sparkles className="h-2.5 w-2.5" /> {k}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------- result bits */

function Tally({ label, value, tone }: { label: string; value: number; tone: "pos" | "mid" | "neg" }) {
  return (
    <div
      className={cn(
        "rounded-2xl px-3 py-2 text-center",
        tone === "pos" && "bg-secondary/12",
        tone === "mid" && "bg-accent/25",
        tone === "neg" && "bg-destructive/10",
      )}
    >
      <p
        className={cn(
          "text-lg font-bold tabular-nums",
          tone === "pos" && "text-secondary",
          tone === "mid" && "text-foreground",
          tone === "neg" && "text-destructive",
        )}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const size = 96;
  const stroke = 9;
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
          className="stroke-muted"
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
          className="stroke-primary"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <p className="text-xl font-bold tabular-nums text-foreground">{value}%</p>
      </div>
    </div>
  );
}
