import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Users,
} from "lucide-react";
import { subjects } from "@/data/quiz";
import { getChapters, practiceModes, type PracticeMode } from "@/data/practice";

export const Route = createFileRoute("/quiz/subject/$subjectId_/$category_/$chapterId")({
  component: ChapterTopics,
});

function ChapterTopics() {
  const { subjectId, category, chapterId } = Route.useParams();
  const subject = subjects.find((s) => s.id === subjectId);
  const mode = practiceModes.find((m) => m.id === (category as PracticeMode));
  const chapter = getChapters(subjectId).find((c) => c.id === chapterId);
  const [activeId, setActiveId] = useState<string | null>(chapter?.topics[0]?.id ?? null);

  if (!subject || !mode || !chapter) {
    return (
      <section className="pt-10 text-center">
        <p className="text-sm text-muted-foreground">Chapter not found.</p>
        <Link to="/quiz" className="mt-4 inline-block text-sm text-primary underline">
          Back to practice
        </Link>
      </section>
    );
  }

  const isWritten = category === "cq" || category === "board";

  /**
   * MCQ topics open the click-based exam runner; CQ / Board topics open the
   * written (সৃজনশীল) practice page where the learner types the answers.
   */
  const startLinkProps = (topicId: string) =>
    isWritten
      ? ({
          to: "/quiz/cq/$subjectId",
          params: { subjectId },
          search: { chapter: chapter.id, topic: topicId, mode: category as "cq" | "board" },
        } as const)
      : ({
          to: "/quiz/exam/$subjectId",
          params: { subjectId },
          search: { chapter: chapter.id, topic: topicId, mode: "overview" as const },
        } as const);

  const active = chapter.topics.find((t) => t.id === activeId) ?? chapter.topics[0];
  const attempted = Math.round((chapter.questions * chapter.progress) / 100);

  return (
    <section className="space-y-5 pb-4">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link
          to="/quiz/subject/$subjectId/$category"
          params={{ subjectId, category }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border transition hover:border-primary/40 hover:text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link to="/quiz" className="hover:text-primary">
          Practice
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/quiz/subject/$subjectId" params={{ subjectId }} className="hover:text-primary">
          {subject.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to="/quiz/subject/$subjectId/$category"
          params={{ subjectId, category }}
          className="hover:text-primary"
        >
          {mode.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate font-medium text-foreground">{chapter.name}</span>
      </div>

      {/* ── Chapter hero ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-brand"
      >
        <span className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary-foreground/10 blur-3xl" />
        <span className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-foreground/12 text-2xl ring-1 ring-primary-foreground/20">
              {subject.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/60">
                Chapter {chapter.index} · {mode.name}
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                {chapter.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <Chip Icon={FileText} label={`${chapter.questions} Questions`} />
                <Chip Icon={Clock} label={`${chapter.topics.length * 5} min`} />
                <Chip Icon={Users} label={`${chapter.topics.length} topics`} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-2xl bg-primary-foreground/10 p-4 ring-1 ring-primary-foreground/15">
            <Ring value={chapter.progress} />
            <div className="min-w-[150px]">
              <p className="text-sm font-semibold tabular-nums">
                {attempted} / {chapter.questions}
              </p>
              <p className="text-[11px] text-primary-foreground/65">Questions attempted</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary-foreground/20">
                <div
                  className="h-full rounded-full bg-primary-foreground"
                  style={{ width: `${chapter.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Topics + detail ──────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <div className="flex items-baseline justify-between border-b border-border px-5 py-3.5">
            <p className="text-sm font-semibold text-foreground">Topics</p>
            <span className="text-[11px] text-muted-foreground">
              {chapter.topics.length} in this chapter
            </span>
          </div>
          <div className="divide-y divide-border">
            {chapter.topics.map((t, i) => {
              const isActive = t.id === active?.id;
              const done = t.progress >= 100;
              return (
                <motion.div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveId(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setActiveId(t.id);
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  className={`relative grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3.5 pl-5 pr-4 text-left transition ${
                    isActive ? "bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="topic-active"
                      className="absolute inset-y-0 left-0 w-1 bg-primary"
                    />
                  )}
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 ${
                      done
                        ? "bg-secondary text-secondary-foreground ring-secondary/30"
                        : "bg-primary/8 text-primary ring-primary/12"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {t.questions} Questions · {t.minutes} min
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {t.progress}%
                      </span>
                    </div>
                  </div>
                  <Link
                    {...startLinkProps(t.id)}
                    onClick={(e) => e.stopPropagation()}

                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
                      done
                        ? "border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                        : "bg-primary text-primary-foreground hover:opacity-95"
                    }`}
                  >
                    {done ? "Review" : t.progress > 0 ? "Continue" : "Start"}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.aside
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm lg:sticky lg:top-4"
            >
              <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5" />
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-2xl text-primary-foreground shadow-brand">
                {subject.emoji}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{active.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Understand the core idea of this topic and practice questions built from real board
                patterns.
              </p>

              <div className="mt-4 space-y-2">
                <DetailRow Icon={FileText} label="Questions" value={`${active.questions}`} />
                <DetailRow Icon={Clock} label="Estimated time" value={`${active.minutes} min`} />
                <DetailRow Icon={Users} label="Class average" value={`${active.classAvg}%`} />
              </div>

              <Link
                {...startLinkProps(active.id)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition hover:-translate-y-0.5"

              >
                {isWritten ? "Start Writing" : "Start Practice"} <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Chip({ Icon, label }: { Icon: typeof FileText; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-foreground/10 px-2.5 py-1.5 font-medium ring-1 ring-primary-foreground/15">
      <Icon className="h-3.5 w-3.5 opacity-70" /> {label}
    </span>
  );
}

function DetailRow({
  Icon,
  label,
  value,
}: {
  Icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </span>
      <span className="text-xs font-semibold tabular-nums text-foreground">{value}</span>
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
