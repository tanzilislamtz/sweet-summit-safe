import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  Users,
} from "lucide-react";
import { z } from "zod";
import {
  boardYears,
  boards,
  getBoardPaperMeta,
  getGroupSubjects,
  learnerGroup,
} from "@/data/quiz";

const searchSchema = z.object({
  year: z.coerce.number().optional(),
  subject: z.string().optional(),
});

export const Route = createFileRoute("/quiz/board/$boardId")({
  validateSearch: (s) => searchSchema.parse(s),
  component: BoardYearFlow,
});

function BoardYearFlow() {
  const { boardId } = Route.useParams();
  const { year, subject } = Route.useSearch();
  const navigate = useNavigate();
  const board = boards.find((b) => b.id === boardId);

  const goBackOneStep = () => {
    if (year && !subject) {
      navigate({ to: "/quiz/board/$boardId", params: { boardId }, search: {} });
      return;
    }

    if (subject) {
      navigate({
        to: "/quiz/subject/$subjectId/$category",
        params: { subjectId: subject, category: "board" },
      });
      return;
    }

    navigate({ to: "/quiz" });
  };

  if (!board) {
    return (
      <section className="pt-10 text-center">
        <p className="text-sm text-muted-foreground">Board not found.</p>
        <Link to="/quiz" className="mt-4 inline-block text-sm text-primary underline">
          Back to practice
        </Link>
      </section>
    );
  }

  const subjects = getGroupSubjects();

  return (
    <section className="space-y-5 pb-4">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <button
          onClick={goBackOneStep}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border transition hover:border-primary/40 hover:text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Link to="/quiz" className="hover:text-primary">
          Practice
        </Link>
        <ChevronRight className="h-3 w-3" />
        {year && !subject ? (
          <>
            <Link
              to="/quiz/board/$boardId"
              params={{ boardId }}
              search={{}}
              className="hover:text-primary"
            >
              {board.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">{year}</span>
          </>
        ) : (
          <span className="font-medium text-foreground">{board.name}</span>
        )}
      </div>

      {/* Header band */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-brand"
      >
        <span className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary-foreground/10 blur-3xl" />
        <span className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative flex min-w-0 items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-foreground/12 text-sm font-bold tracking-wider ring-1 ring-primary-foreground/20">
            {board.short}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/60">
              Board Questions
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{board.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-primary-foreground/75">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2.5 py-1 ring-1 ring-primary-foreground/15">
                <MapPin className="h-3 w-3" /> {board.region}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2.5 py-1 ring-1 ring-primary-foreground/15">
                <Users className="h-3 w-3" /> {learnerGroup.level} · {learnerGroup.group}
              </span>
              {year && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2.5 py-1 ring-1 ring-primary-foreground/15">
                  <CalendarDays className="h-3 w-3" /> {year}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {!year || subject ? (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-foreground">Select a year</h2>
            <span className="text-xs text-muted-foreground">{boardYears.length} years</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {boardYears.map((y, i) => {
              const cardClass =
                "group flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md";
              const meta = subject ? getBoardPaperMeta(boardId, y, subject) : null;
              const inner = (
                <>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/12">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold tabular-nums text-foreground">{y}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {meta ? (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {meta.questions} MCQ · {meta.minutes} min
                        </span>
                      ) : (
                        `${subjects.length} subjects`
                      )}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                </>
              );
              return (
                <motion.div
                  key={y}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * i }}
                >
                  {subject ? (
                    <Link
                      to="/quiz/exam/$subjectId"
                      params={{ subjectId: subject }}
                      search={{ board: boardId, year: y, mode: "overview" as const }}
                      className={cardClass}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <Link
                      to="/quiz/board/$boardId"
                      params={{ boardId }}
                      search={{ year: y }}
                      className={cardClass}
                    >
                      {inner}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {year} papers · {learnerGroup.group}
            </h2>
            <span className="text-xs text-muted-foreground">{subjects.length} subjects</span>
          </div>

          {/* quick year switcher */}
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {boardYears.map((y) => (
              <Link
                key={y}
                to="/quiz/board/$boardId"
                params={{ boardId }}
                search={{ year: y }}
                className={
                  y === year
                    ? "shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
                    : "shrink-0 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                }
              >
                {y}
              </Link>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {subjects.map((s, i) => {
              const meta = getBoardPaperMeta(boardId, year, s.id);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * i }}
                >
                  <Link
                    to="/quiz/exam/$subjectId"
                    params={{ subjectId: s.id }}
                    search={{ board: boardId, year, mode: "overview" as const }}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/8 text-lg ring-1 ring-primary/12">
                      {s.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {meta.questions} MCQ
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {meta.minutes} min
                        </span>
                        {meta.attempted && (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <CheckCircle2 className="h-3 w-3" /> Attempted
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
