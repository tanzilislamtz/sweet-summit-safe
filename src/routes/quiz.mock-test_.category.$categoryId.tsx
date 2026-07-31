import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ListChecks,
  Timer,
  Users,
} from "lucide-react";
import { subjects } from "@/data/quiz";
import { listMockTests, mockCategories, type MockCategoryId, type MockTest } from "@/data/mock-tests";

export const Route = createFileRoute("/quiz/mock-test_/category/$categoryId")({
  head: () => ({
    meta: [
      { title: "Mock Test Category — Learns Academy" },
      {
        name: "description",
        content:
          "Browse timed mock tests in this category — filter by subject and start a full-length paper.",
      },
      { property: "og:title", content: "Mock Test Category — Learns Academy" },
      {
        property: "og:description",
        content: "Filter mock tests by subject and start a timed paper with instant solutions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoryTests,
});

function CategoryTests() {
  const { categoryId } = Route.useParams();
  const category = mockCategories.find((c) => c.id === (categoryId as MockCategoryId));
  const [subjectId, setSubjectId] = useState<string | "all">("all");

  const tests = useMemo(() => {
    if (!category) return [];
    return listMockTests(category.id, subjectId === "all" ? undefined : subjectId).slice(
      0,
      subjectId === "all" ? 12 : 8,
    );
  }, [category, subjectId]);

  if (!category) {
    return (
      <section className="pt-10 text-center">
        <p className="text-sm text-muted-foreground">Category not found.</p>
        <Link to="/quiz/mock-test" className="mt-4 inline-block text-sm text-primary underline">
          Back to mock tests
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-5 pb-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link
          to="/quiz/mock-test"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border transition hover:border-primary/40 hover:text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link to="/quiz/mock-test" className="hover:text-primary">
          Mock Test
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate font-medium text-foreground">{category.name}</span>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-brand sm:p-7"
      >
        <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />
        <span className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-foreground/12 text-2xl ring-1 ring-primary-foreground/20">
            {category.emoji}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/60">
              {category.nameBn}
            </p>
            <h1 className="text-xl font-bold tracking-tight sm:text-3xl">{category.name}</h1>
            <p className="mt-1.5 max-w-lg text-sm text-primary-foreground/75">{category.desc}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/12 px-3 py-1 text-[11px] font-semibold ring-1 ring-primary-foreground/20">
              <ListChecks className="h-3.5 w-3.5" /> {tests.length} tests available
            </p>
          </div>
        </div>
      </motion.div>

      {/* Subject filter */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip active={subjectId === "all"} onClick={() => setSubjectId("all")}>
          All subjects
        </Chip>
        {subjects.map((s) => (
          <Chip key={s.id} active={subjectId === s.id} onClick={() => setSubjectId(s.id)}>
            <span className="mr-1">{s.emoji}</span>
            {s.name}
          </Chip>
        ))}
      </div>

      {/* Tests */}
      {tests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No tests for this subject yet.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((t, i) => (
            <TestCard key={t.id} test={t} delay={0.03 * i} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- pieces ---------------- */

function TestCard({ test, delay }: { test: MockTest; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-primary opacity-60 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {test.isNew && (
              <span className="rounded-full bg-secondary/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                New
              </span>
            )}
            {test.free ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Free
              </span>
            ) : (
              <span className="rounded-full bg-accent/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                Premium
              </span>
            )}
            {test.board && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {test.board} {test.year}
              </span>
            )}
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold text-foreground">{test.title}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {test.chapterName ?? test.syllabus.length + " chapters covered"}
          </p>
        </div>
        {test.bestScore !== null && (
          <span className="shrink-0 rounded-2xl bg-secondary/10 px-2.5 py-1.5 text-center">
            <span className="block text-sm font-bold tabular-nums text-secondary">
              {test.bestScore}%
            </span>
            <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">
              best
            </span>
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-muted/60 p-2.5">
        <Meta Icon={ListChecks} value={String(test.questions)} label="Questions" />
        <Meta Icon={Timer} value={`${test.minutes}m`} label="Duration" />
        <Meta Icon={Users} value={`${(test.attempts / 1000).toFixed(1)}k`} label="Attempts" />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="inline-flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-secondary" />
          <span className="truncate">Class avg. {test.avgScore}%</span>
        </p>
        <Link
          to="/quiz/mock-test/$testId"
          params={{ testId: test.id }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
        >
          Start test <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

function Meta({ Icon, value, label }: { Icon: typeof ListChecks; value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {value}
      </p>
      <p className="truncate text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
