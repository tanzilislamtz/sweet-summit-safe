import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  Target,
  TrendingUp,
} from "lucide-react";
import { boards, subjects } from "@/data/quiz";
import { getChapters, getSubjectStats, practiceModes, type PracticeMode } from "@/data/practice";

export const Route = createFileRoute("/quiz/subject/$subjectId_/$category")({
  component: ChapterPicker,
});

function ChapterPicker() {
  const { subjectId, category } = Route.useParams();
  const subject = subjects.find((s) => s.id === subjectId);
  const mode = practiceModes.find((m) => m.id === (category as PracticeMode));

  if (!subject || !mode) {
    return (
      <section className="pt-10 text-center">
        <p className="text-sm text-muted-foreground">Not found.</p>
        <Link to="/quiz" className="mt-4 inline-block text-sm text-primary underline">
          Back to practice
        </Link>
      </section>
    );
  }

  const st = getSubjectStats(subject);
  const chapters = getChapters(subjectId);
  const isCq = category === "cq";

  return (
    <section className="space-y-5 pb-4">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link
          to="/quiz/subject/$subjectId"
          params={{ subjectId }}
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
        <span className="font-medium text-foreground">{mode.name}</span>
      </div>

      {/* ── Header band ──────────────────────────────────────── */}
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
                {subject.name}
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                {mode.name}
              </h1>
              <p className="mt-1 max-w-md text-sm text-primary-foreground/75">{mode.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <HeadStat Icon={FileText} value={isCq ? st.cq : st.mcq} label="Questions" />
            <HeadStat Icon={Target} value={isCq ? st.cqAttempted : st.mcqAttempted} label="Attempted" />
            <HeadStat Icon={TrendingUp} value={`${isCq ? st.cqAvg : st.accuracy}%`} label="Accuracy" />
            <HeadStat Icon={Clock} value={st.timeSpent} label="Time" />
          </div>
        </div>
      </motion.div>

      {category === "board" ? (
        <BoardList subjectId={subjectId} />
      ) : (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-foreground">Chapters</h2>
            <span className="text-xs text-muted-foreground">{chapters.length} chapters</span>
          </div>
          <div className="space-y-3">
            {chapters.map((c, i) => (
              <ChapterRow
                key={c.id}
                chapter={c}
                index={i}
                subjectId={subjectId}
                category={category}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ChapterRow({
  chapter,
  index,
  subjectId,
  category,
}: {
  chapter: ReturnType<typeof getChapters>[number];
  index: number;
  subjectId: string;
  category: string;
}) {
  const done = chapter.progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.02 * index }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 transition ${
          done ? "bg-secondary" : "bg-primary/25 group-hover:bg-primary"
        }`}
      />
      <Link
        to="/quiz/subject/$subjectId/$category/$chapterId"
        params={{ subjectId, category, chapterId: chapter.id }}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4 pl-5 pr-4 text-left sm:gap-4"
      >
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-bold ring-1 ${
            done
              ? "bg-secondary text-secondary-foreground ring-secondary/30"
              : "bg-primary/8 text-primary ring-primary/12"
          }`}
        >
          {done ? <CheckCircle2 className="h-5 w-5" /> : chapter.index}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{chapter.name}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <FileText className="h-3 w-3" /> {chapter.questions} Questions ·{" "}
            {chapter.topics.length} topics
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}


function HeadStat({
  Icon,
  value,
  label,
}: {
  Icon: typeof FileText;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-primary-foreground/10 px-3 py-2 ring-1 ring-primary-foreground/15">
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums">
        <Icon className="h-3.5 w-3.5 opacity-70" /> {value}
      </p>
      <p className="truncate text-[10px] text-primary-foreground/65">{label}</p>
    </div>
  );
}

function BoardList({ subjectId }: { subjectId: string }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-foreground">Choose a board</h2>
        <span className="text-xs text-muted-foreground">{boards.length} boards</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {boards.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 * i }}
          >
            <Link
              to="/quiz/exam/$subjectId"
              params={{ subjectId }}
              search={{ board: b.id, mode: "overview" as const }}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/8 text-xs font-bold tracking-wider text-primary ring-1 ring-primary/12">
                {b.short}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{b.name}</p>
                <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {b.region}
                </p>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
