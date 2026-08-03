import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  X,
  Timer,
  FileText,
  Play,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Printer,
} from "lucide-react";
import { z } from "zod";
import { boards, getExamQuestions, subjects, type Question } from "@/data/quiz";
import { getChapters } from "@/data/practice";
import { getTopicQuestions } from "@/data/topic-questions";
import { explainAnswer } from "@/lib/ai-explain.functions";
import { QuestionFigure } from "@/components/QuestionFigure";
import { AiExplanation } from "@/components/AiExplanation";
import { FavoriteButton } from "@/components/FavoriteButton";
import { saveAttempt, summarise } from "@/lib/practice-results";
import { ResultModal } from "@/components/ResultModal";




const searchSchema = z.object({
  board: z.string().optional(),
  year: z.coerce.number().optional(),
  chapter: z.string().optional(),
  topic: z.string().optional(),
  mode: z.enum(["overview", "paper", "exam", "result"]).default("overview"),
});


export const Route = createFileRoute("/quiz/exam/$subjectId")({
  validateSearch: (s) => searchSchema.parse(s),
  component: ExamFlow,
});

function ExamFlow() {
  const { subjectId } = Route.useParams();
  const { board, year, chapter: chapterId, topic: topicId, mode } = Route.useSearch();
  const navigate = useNavigate();

  const subject = subjects.find((s) => s.id === subjectId);
  const boardMeta = board ? boards.find((b) => b.id === board) : undefined;

  // Topic-driven practice context (chapter + topic selected in Practice).
  const chapterMeta = chapterId
    ? getChapters(subjectId).find((c) => c.id === chapterId)
    : undefined;
  const topicMeta = chapterMeta?.topics.find((t) => t.id === topicId);

  const paper = useMemo(() => {
    if (chapterMeta && topicMeta) {
      return getTopicQuestions({
        subjectId,
        chapterId: chapterMeta.id,
        chapterName: chapterMeta.name,
        topicId: topicMeta.id,
        topicName: topicMeta.name,
        count: 25,
      });
    }
    return board ? getExamQuestions(subjectId, board, String(year ?? 2024)) : [];
  }, [subjectId, board, year, chapterMeta, topicMeta]);



  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(paper.length).fill(null));
  const [current, setCurrent] = useState(0);
  const [time, setTime] = useState(25 * 60); // 25 minutes
  const [result, setResult] = useState<{
    correct: number;
    wrongIds: string[];
  } | null>(null);

  // reset when navigating between modes/board
  useEffect(() => {
    if (mode === "exam") {
      setAnswers(Array(paper.length).fill(null));
      setCurrent(0);
      setTime(25 * 60);
      setResult(null);
    }
  }, [mode, paper.length]);

  // exam timer
  useEffect(() => {
    if (mode !== "exam") return;
    const t = setInterval(() => {
      setTime((v) => {
        if (v <= 1) {
          finishExam();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function goto(nextMode: "overview" | "paper" | "exam" | "result") {
    navigate({
      to: "/quiz/exam/$subjectId",
      params: { subjectId },
      search: { board, year, chapter: chapterId, topic: topicId, mode: nextMode },
    });
  }

  function finishExam() {
    let correct = 0;
    const wrongIds: string[] = [];
    paper.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
      else wrongIds.push(q.id);
    });
    setResult({ correct, wrongIds });
    // Feed the MCQ score into the shared progress store.
    if (subject && paper.length > 0) {
      saveAttempt({
        mode: "mcq",
        subjectId,
        subjectName: subject.name,
        chapterName: chapterMeta?.name,
        topicName: topicMeta?.name,
        correct,
        partial: 0,
        total: paper.length,
        seconds: Math.max(0, 25 * 60 - time),
      });
    }
    goto("result");
  }


  const isTopicRun = Boolean(chapterMeta && topicMeta);

  if (!subject || (!boardMeta && !isTopicRun)) {
    return (
      <main className="min-h-screen bg-background pb-28 text-foreground">
        <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
          <p className="text-sm text-muted-foreground">Not found.</p>
          <Link to="/quiz" className="mt-4 inline-block text-sm underline">Back to quiz</Link>
        </div>
      </main>
    );
  }

  // Headline = the topic the learner came from; fallback = board paper.
  const headline = isTopicRun ? topicMeta!.name : subject.name;
  const contextLabel = isTopicRun
    ? `${subject.name} · Chapter ${chapterMeta!.index}: ${chapterMeta!.name}`
    : `${boardMeta!.name}${year ? ` · ${year}` : ""}`;
  const paperEyebrow = isTopicRun
    ? "Topic Practice · Learns Academy"
    : "Board of Intermediate and Secondary Education";

  const backToSource = () =>
    isTopicRun
      ? navigate({
          to: "/quiz/subject/$subjectId/$category/$chapterId",
          params: { subjectId, category: "mcq", chapterId: chapterMeta!.id },
        })
      : navigate({ to: "/quiz/subject/$subjectId", params: { subjectId } });

  if (mode === "overview") {
    return (
      <OverviewScreen
        subjectName={headline}
        subjectEmoji={subject.emoji}
        subjectColor={subject.color}
        contextLabel={contextLabel}
        onViewPaper={() => goto("paper")}
        onStartExam={() => goto("exam")}
        onBack={backToSource}
        count={paper.length}
      />
    );
  }

  if (mode === "paper") {
    return (
      <PaperPreview
        subjectName={headline}
        contextLabel={contextLabel}
        paperEyebrow={paperEyebrow}
        subjectLine={subject.name}
        questions={paper}
        onBack={() => goto("overview")}
        onStart={() => goto("exam")}
      />
    );
  }

  if (mode === "exam") {
    return (
      <ExamRunner
        subjectIdForFav={subjectId}
        subjectName={headline}
        contextLabel={contextLabel}
        questions={paper}
        current={current}
        setCurrent={setCurrent}
        answers={answers}
        setAnswers={setAnswers}
        time={time}
        onSubmit={finishExam}
      />
    );
  }

  // Next chapter in the same subject (topic-driven runs only).
  const allChapters = getChapters(subjectId);
  const chapterPos = chapterMeta ? allChapters.findIndex((c) => c.id === chapterMeta.id) : -1;
  const nextChapter =
    chapterPos >= 0 && chapterPos < allChapters.length - 1 ? allChapters[chapterPos + 1] : undefined;

  // result
  return (
    <ResultScreen
      subjectId={subjectId}
      subjectName={headline}
      contextLabel={contextLabel}
      questions={paper}
      answers={answers}
      result={result}
      seconds={Math.max(0, 25 * 60 - time)}
      nextChapter={
        nextChapter
          ? {
              label: nextChapter.name,
              go: () =>
                navigate({
                  to: "/quiz/subject/$subjectId/$category/$chapterId",
                  params: { subjectId, category: "mcq", chapterId: nextChapter.id },
                }),
            }
          : undefined
      }
      onRetry={() => goto("exam")}
      onHome={() => navigate({ to: "/quiz" })}
    />
  );
}



/* ---------------- Overview ---------------- */

function OverviewScreen({
  subjectName,
  subjectEmoji,
  subjectColor,
  contextLabel,
  onViewPaper,
  onStartExam,
  onBack,
  count,
}: {
  subjectName: string;
  subjectEmoji: string;
  subjectColor: string;
  contextLabel: string;
  onViewPaper: () => void;
  onStartExam: () => void;
  onBack: () => void;
  count: number;
}) {
  return (
    <main className="min-h-screen bg-background pb-28 text-foreground">
      <div className="mx-auto max-w-2xl px-5 pt-6">
        <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full border border-border">
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="mt-6 flex items-center gap-4">
          <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${subjectColor} text-2xl text-white shadow-sm`}>
            <span>{subjectEmoji}</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{contextLabel}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{subjectName}</h1>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Meta label="Questions" value={String(count)} />
          <Meta label="Duration" value="25 min" />
          <Meta label="Marks" value={String(count)} />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Read the question paper first, or jump straight into the exam. Once you submit,
            you'll see which questions you got wrong and get an AI explanation for each of them.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={onViewPaper}
            className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 text-left transition hover:border-foreground/40"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" /> View question paper
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Read all 25 in exam-paper format.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
          </button>

          <button
            onClick={onStartExam}
            className="group flex items-center justify-between rounded-2xl bg-primary p-5 text-left text-primary-foreground shadow-brand transition hover:opacity-90"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Play className="h-4 w-4" /> Start exam
              </div>
              <p className="mt-1 text-xs opacity-80">Answer one by one within 25 minutes.</p>
            </div>
            <ChevronRight className="h-4 w-4 opacity-80 transition group-hover:translate-x-0.5" />
          </button>

        </div>
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/* ---------------- Paper preview (realistic) ---------------- */

function PaperPreview({
  subjectName,
  contextLabel,
  paperEyebrow,
  subjectLine,
  questions,
  onBack,
  onStart,
}: {
  subjectIdForFav: string;
  subjectName: string;
  contextLabel: string;
  paperEyebrow: string;
  subjectLine: string;
  questions: Question[];
  onBack: () => void;
  onStart: () => void;
}) {

  return (
    <main className="min-h-screen bg-muted/30 pb-28 text-foreground print:bg-white">
      <div className="mx-auto max-w-3xl px-5 pt-6">
        <div className="flex items-center justify-between print:hidden">
          <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              onClick={onStart}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-brand"
            >
              <Play className="h-3.5 w-3.5" /> Start exam
            </button>
          </div>

        </div>

        {/* Paper sheet */}
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-md border border-border bg-white text-black shadow-lg [background-image:linear-gradient(to_bottom,transparent_31px,rgba(0,0,0,0.05)_32px)] [background-size:100%_32px]"
          style={{ fontFamily: '"Times New Roman", Georgia, serif' }}
        >
          <div className="px-8 pt-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-600">{paperEyebrow}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">{subjectName}</h1>
              <p className="mt-1 text-sm">{contextLabel}</p>
              <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                <span><b>Subject:</b> {subjectLine}</span>

                <span>·</span>
                <span><b>Time:</b> 25 minutes</span>
                <span>·</span>
                <span><b>Marks:</b> {questions.length}</span>
              </div>
              <div className="mx-auto mt-3 h-px w-24 bg-neutral-400" />
            </div>

            <p className="mt-6 text-sm italic text-neutral-700">
              Instructions: Answer <b>all</b> {questions.length} questions. Each question carries 1 mark.
              Choose the most appropriate option (a), (b), (c), or (d).
            </p>
          </div>

          <ol className="space-y-5 px-8 py-8 text-[15px] leading-relaxed">
            {questions.map((q, i) => (
              <li key={q.id} className="flex gap-3">
                <span className="min-w-8 font-semibold">{i + 1}.</span>
                <div className="flex-1">
                  <p>{q.text}</p>
                  {q.figure && <QuestionFigure spec={q.figure} compact />}
                  <div className="mt-2 grid gap-y-1 sm:grid-cols-2">
                    {q.options.map((opt, oi) => (
                      <p key={oi} className="pl-3">
                        <span className="font-medium">({String.fromCharCode(97 + oi)})</span> {opt}
                      </p>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="border-t border-neutral-300 px-8 py-4 text-center text-xs text-neutral-500">
            — End of Question Paper —
          </div>
        </motion.article>

        <div className="mt-6 flex justify-center print:hidden">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-brand transition hover:opacity-90"
          >
            <Play className="h-4 w-4" /> I'm ready — start exam
          </button>

        </div>
      </div>
    </main>
  );
}

/* ---------------- Exam runner ---------------- */

function ExamRunner({
  subjectIdForFav,
  subjectName,
  contextLabel,
  questions,
  current: _current,
  setCurrent,
  answers,
  setAnswers,
  time,
  onSubmit,
}: {
  subjectName: string;
  contextLabel: string;
  questions: Question[];
  current: number;
  setCurrent: (n: number) => void;
  answers: (number | null)[];
  setAnswers: (fn: (prev: (number | null)[]) => (number | null)[]) => void;
  time: number;
  onSubmit: () => void;
}) {
  const mm = String(Math.floor(time / 60)).padStart(2, "0");
  const ss = String(time % 60).padStart(2, "0");
  const answered = answers.filter((a) => a !== null).length;

  function pick(qi: number, i: number) {
    setCurrent(qi);
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = i;
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-background pb-32 text-foreground">
      <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{contextLabel}</p>
            <p className="truncate text-sm font-medium">{subjectName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border px-3 py-1 text-xs tabular-nums text-muted-foreground">
              {answered}/{questions.length}
            </span>
            <span className={`flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs tabular-nums ${time < 60 ? "text-rose-600" : ""}`}>
              <Timer className="h-3.5 w-3.5" /> {mm}:{ss}
            </span>
          </div>
        </div>
        <div className="h-0.5 bg-muted">
          <motion.div
            animate={{ width: `${(answered / questions.length) * 100}%` }}
            transition={{ ease: "easeOut", duration: 0.3 }}
            className="h-full bg-primary"
          />
        </div>

      </div>

      <div className="mx-auto max-w-3xl px-5 pt-6">
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <motion.article
              key={q.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(qi * 0.015, 0.25) }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="capitalize">{q.difficulty}</span>
                <span>· {q.topic}</span>
                {answers[qi] !== null && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                    <Check className="h-3 w-3" /> answered
                  </span>
                )}
              </div>
              <p className="mt-2 text-base font-medium leading-snug">
                <span className="mr-1 text-muted-foreground">{qi + 1}.</span>
                {q.text}
              </p>
              {q.figure && <QuestionFigure spec={q.figure} />}

              <div className="mt-3 flex justify-end">
                <FavoriteButton
                  item={{
                    questionId: q.id,
                    text: q.text,
                    options: q.options,
                    answer: q.answer,
                    explanation: q.explanation,
                    figure: q.figure,
                    subjectId: subjectIdForFav,
                    subjectName,
                    topic: q.topic,
                    source: "mcq",
                  }}
                />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, i) => {
                  const selected = answers[qi] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => pick(qi, i)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-medium ${
                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1 text-sm">{opt}</span>
                    </button>

                  );
                })}
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="pointer-events-none sticky bottom-3 left-0 right-0 z-40 mt-6 flex justify-center px-4">
        <button
          onClick={onSubmit}
          className="pointer-events-auto flex w-[90%] max-w-lg items-center justify-between gap-3 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl transition hover:opacity-95"
        >
          <span className="flex items-center gap-2">
            <Timer className={`h-4 w-4 ${time < 60 ? "text-rose-200" : ""}`} />
            <span className="tabular-nums">{mm}:{ss}</span>
          </span>
          <span>Submit exam</span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs tabular-nums">
            {answered}/{questions.length}
          </span>
        </button>
      </div>
    </main>
  );
}

/* ---------------- Result + AI explanations ---------------- */

function ResultScreen({
  subjectId,
  subjectName,
  contextLabel,
  questions,
  answers,
  result,
  seconds,
  nextChapter,
  onRetry,
  onHome,
}: {
  subjectId: string;
  subjectName: string;
  contextLabel: string;
  questions: Question[];
  answers: (number | null)[];
  result: { correct: number; wrongIds: string[] } | null;
  seconds: number;
  nextChapter?: { label: string; go: () => void };
  onRetry: () => void;
  onHome: () => void;
}) {
  const correct = result?.correct ?? 0;
  const total = questions.length;
  const wrong = total - correct;
  const skipped = answers.filter((a) => a === null).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Celebration modal opens automatically once, right after submitting.
  const [showModal, setShowModal] = useState(true);
  const average = useMemo(() => summarise().accuracy, []);

  const scrollToReview = () => {
    setShowModal(false);
    // Let the modal unmount before scrolling to the review list.
    setTimeout(() => {
      document.getElementById("answer-review")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 220);
  };

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground">
      <ResultModal
        open={showModal}
        onClose={() => setShowModal(false)}
        contextLabel={contextLabel}
        title={subjectName}
        percent={pct}
        correct={correct}
        wrong={Math.max(0, wrong - skipped)}
        skipped={skipped}
        total={total}
        seconds={seconds}
        averagePercent={average}
        onRetake={onRetry}
        nextChapterLabel={nextChapter?.label}
        onNextChapter={nextChapter?.go}
        onReviewWrong={scrollToReview}
      />
      <div className="mx-auto max-w-2xl px-5 pt-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{contextLabel} · {subjectName}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Exam submitted.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's how you did.</p>
        <button
          onClick={() => setShowModal(true)}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" /> View result summary
        </button>


        {/* Scorecard */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <ScoreStat label="Correct" value={String(correct)} tone="pos" />
          <ScoreStat label="Wrong" value={String(wrong)} tone="neg" />
          <ScoreStat label="Score" value={`${pct}%`} />
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Accuracy</span>
            <span>{correct}/{total}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Answer review */}
        <section id="answer-review" className="mt-8 scroll-mt-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-medium">AI review of your answers</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Explanations are generated for the questions you got wrong.
          </p>

          <div className="mt-4 space-y-3">
            {questions.map((q, i) => {
              const user = answers[i];
              const isCorrect = user === q.answer;
              return (
                <ReviewCard
                  key={q.id}
                  index={i}
                  question={q}
                  userIndex={user}
                  isCorrect={isCorrect}
                  subjectId={subjectId}
                />
              );
            })}
          </div>
        </section>

        <div className="mt-8 grid grid-cols-2 gap-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium transition hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" /> Retake
          </button>
          <button
            onClick={onHome}
            className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-brand transition hover:opacity-90"
          >
            Back to quiz home
          </button>

        </div>
      </div>
    </main>
  );
}

function ScoreStat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p
        className={`text-2xl font-semibold tabular-nums ${
          tone === "pos" ? "text-emerald-600 dark:text-emerald-400" : tone === "neg" ? "text-rose-600 dark:text-rose-400" : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ReviewCard({
  index,
  question,
  userIndex,
  isCorrect,
  subjectId,
}: {
  index: number;
  question: Question;
  userIndex: number | null;
  isCorrect: boolean;
  subjectId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        isCorrect
          ? "border-emerald-500/30 bg-emerald-500/5"
          : userIndex === null
          ? "border-border bg-muted/40"
          : "border-rose-500/30 bg-rose-500/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <button onClick={() => setOpen((v) => !v)} className="flex flex-1 items-start gap-3 text-left">
          <span
            className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-medium ${
              isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            }`}
          >
            {isCorrect ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Q{index + 1} · {question.topic}</p>
            <p className="mt-0.5 text-sm font-medium">{question.text}</p>
            {question.figure && <QuestionFigure spec={question.figure} compact />}
          </div>
          <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open ? "rotate-90" : ""}`} />
        </button>
      </div>

      <div className="mt-2 flex justify-end">
        <FavoriteButton
          item={{
            questionId: question.id,
            text: question.text,
            options: question.options,
            answer: question.answer,
            explanation: question.explanation,
            figure: question.figure,
            subjectId,
            topic: question.topic,
            source: "mcq",
          }}
        />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 text-sm">
              <div className="grid gap-1.5">
                {question.options.map((opt, i) => {
                  const isCorrectOpt = i === question.answer;
                  const isUserOpt = i === userIndex;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                        isCorrectOpt
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : isUserOpt
                          ? "border-rose-500/40 bg-rose-500/10"
                          : "border-border"
                      }`}
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1 text-sm">{opt}</span>
                      {isCorrectOpt && <span className="text-xs text-emerald-600 dark:text-emerald-400">Correct</span>}
                      {isUserOpt && !isCorrectOpt && <span className="text-xs text-rose-600 dark:text-rose-400">Your pick</span>}
                    </div>
                  );
                })}
              </div>

              {/* AI explanation is now generated for every question — right, wrong or skipped. */}
              <AiExplanation
                question={question.text}
                options={question.options}
                correctIndex={question.answer}
                userIndex={userIndex ?? -1}
                subject={subjectId}
                topic={question.topic}
                fallback={question.explanation}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

