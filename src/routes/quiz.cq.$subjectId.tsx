import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  ListChecks,
  PenLine,
  Save,
  Sparkles,
} from "lucide-react";
import { z } from "zod";
import { subjects } from "@/data/quiz";
import { getChapters } from "@/data/practice";
import { getTopicCqQuestions, type CqPart, type CqQuestion } from "@/data/topic-cq";
import { QuestionFigure } from "@/components/QuestionFigure";
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
type Checked = Record<string, boolean>;

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

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

  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Draft>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [selfChecked, setSelfChecked] = useState<Checked>({});

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

  const q = paper[index];
  const totalParts = paper.length * 4;
  const writtenParts = Object.values(drafts).filter((v) => wordCount(v) > 0).length;
  const progress = Math.round((writtenParts / totalParts) * 100);

  const setDraft = (key: string, value: string) =>
    setDrafts((d) => ({ ...d, [key]: value }));

  return (
    <section className="space-y-5 pb-6">
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
        <span className="hover:text-primary">{subject.name}</span>
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
          <div className="flex items-center gap-3 rounded-2xl bg-primary-foreground/10 px-4 py-3 ring-1 ring-primary-foreground/15">
            <div>
              <p className="text-sm font-semibold tabular-nums">
                {paper.length} × 10 marks
              </p>
              <p className="text-[11px] text-primary-foreground/65">
                {writtenParts}/{totalParts} answers written
              </p>
              <div className="mt-1.5 h-1.5 w-36 overflow-hidden rounded-full bg-primary-foreground/20">
                <motion.div
                  className="h-full rounded-full bg-primary-foreground"
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Question navigator */}
      <div className="flex flex-wrap items-center gap-2">
        {paper.map((item, i) => {
          const done = item.parts.every((p) => wordCount(drafts[`${item.id}-${p.label}`] ?? "") > 0);
          return (
            <button
              key={item.id}
              onClick={() => setIndex(i)}
              className={cn(
                "h-9 w-9 rounded-xl text-xs font-semibold ring-1 transition",
                i === index
                  ? "bg-primary text-primary-foreground ring-primary"
                  : done
                    ? "bg-secondary/15 text-secondary-foreground ring-secondary/30"
                    : "bg-surface text-muted-foreground ring-border hover:text-primary",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.article
          key={q.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
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
              <span className="ml-auto rounded-full bg-secondary/15 px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                {q.totalMarks} marks
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground font-bangla">
              {q.stem}
            </p>
            {q.figure && <QuestionFigure spec={q.figure} />}
          </div>

          {/* Written parts */}
          <div className="divide-y divide-border">
            {q.parts.map((part) => (
              <PartEditor
                key={part.label}
                part={part}
                value={drafts[`${q.id}-${part.label}`] ?? ""}
                onChange={(v) => setDraft(`${q.id}-${part.label}`, v)}
                revealed={!!revealed[`${q.id}-${part.label}`]}
                onToggleReveal={() =>
                  setRevealed((r) => ({
                    ...r,
                    [`${q.id}-${part.label}`]: !r[`${q.id}-${part.label}`],
                  }))
                }
                selfChecked={!!selfChecked[`${q.id}-${part.label}`]}
                onSelfCheck={() =>
                  setSelfChecked((c) => ({
                    ...c,
                    [`${q.id}-${part.label}`]: !c[`${q.id}-${part.label}`],
                  }))
                }
              />
            ))}
          </div>

          {/* Footer nav */}
          <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3.5">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold transition disabled:opacity-40 enabled:hover:border-primary/40 enabled:hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="text-[11px] text-muted-foreground">
              Question {index + 1} of {paper.length}
            </span>
            {index === paper.length - 1 ? (
              <Link
                to="/quiz/subject/$subjectId/$category/$chapterId"
                params={{ subjectId, category: mode, chapterId: chapter.id }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition hover:-translate-y-0.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Finish
              </Link>
            ) : (
              <button
                onClick={() => setIndex((i) => Math.min(paper.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:-translate-y-0.5"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </motion.article>
      </AnimatePresence>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <PenLine className="h-3.5 w-3.5" />
        CQ-তে অপশন নেই — নিজে লিখে উত্তর দাও, তারপর মডেল উত্তরের সাথে মিলিয়ে নাও।
      </p>
    </section>
  );
}

/* ------------------------------------------------------------- part editor */

function PartEditor({
  part,
  value,
  onChange,
  revealed,
  onToggleReveal,
  selfChecked,
  onSelfCheck,
}: {
  part: CqPart;
  value: string;
  onChange: (v: string) => void;
  revealed: boolean;
  onToggleReveal: () => void;
  selfChecked: boolean;
  onSelfCheck: () => void;
}) {
  const words = wordCount(value);
  const enough = words >= part.minWords;
  const hits = part.keywords.filter((k) =>
    value.toLowerCase().includes(k.toLowerCase()),
  );

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary font-bangla">
          {part.label}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {part.level}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">{part.marks} mark{part.marks > 1 ? "s" : ""}</span>
        {selfChecked && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
            <CheckCircle2 className="h-3 w-3" /> self-checked
          </span>
        )}
      </div>

      <p className="mt-2 text-sm font-medium leading-relaxed text-foreground font-bangla">
        {part.prompt}
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 2000))}
        rows={part.marks + 2}
        placeholder="এখানে তোমার উত্তর লিখো..."
        className="mt-2.5 w-full resize-y rounded-2xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15 font-bangla"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span className={cn("tabular-nums", enough ? "text-secondary-foreground" : "text-muted-foreground")}>
          {words} words {enough ? "✓" : `· suggested ${part.minWords}+`}
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <ListChecks className="h-3.5 w-3.5" /> keywords {hits.length}/{part.keywords.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onSelfCheck}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-semibold transition hover:border-secondary/50 hover:text-secondary-foreground"
          >
            <Save className="h-3 w-3" /> {selfChecked ? "Unmark" : "Mark done"}
          </button>
          <button
            onClick={onToggleReveal}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary transition hover:bg-primary/15"
          >
            {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {revealed ? "Hide model answer" : "Model answer"}
          </button>
        </div>
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
              <p className="mt-1.5 text-sm leading-relaxed text-foreground font-bangla">
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
