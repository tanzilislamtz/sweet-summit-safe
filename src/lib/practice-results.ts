/**
 * Local practice-result store.
 *
 * Every finished practice session (MCQ exam or CQ written paper) is appended
 * here so the progress / profile screens can show real percentages instead of
 * demo numbers. Storage is intentionally local-only for now — when the backend
 * lands, only the read/write helpers below need to change.
 */

export type PracticeMode = "mcq" | "cq" | "board";

export type PracticeAttempt = {
  id: string;
  mode: PracticeMode;
  subjectId: string;
  subjectName: string;
  chapterName?: string;
  topicName?: string;
  /** number of questions / parts judged correct */
  correct: number;
  /** partially-correct answers (CQ only) */
  partial: number;
  total: number;
  /** 0–100 */
  percent: number;
  /** seconds spent */
  seconds: number;
  at: number;
};

const KEY = "la_practice_results_v1";
const MAX = 200;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function listAttempts(): PracticeAttempt[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PracticeAttempt[];
  } catch {
    return [];
  }
}

export function saveAttempt(a: Omit<PracticeAttempt, "id" | "at" | "percent">): PracticeAttempt {
  const percent = a.total > 0 ? Math.round(((a.correct + a.partial * 0.5) / a.total) * 100) : 0;
  const attempt: PracticeAttempt = {
    ...a,
    percent,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
  };
  if (!isBrowser()) return attempt;
  try {
    const next = [attempt, ...listAttempts()].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("la:practice-updated"));
  } catch {
    /* storage full or blocked — the session still shows its own result */
  }
  return attempt;
}

export type PracticeSummary = {
  attempts: number;
  questions: number;
  correct: number;
  wrong: number;
  accuracy: number;
  minutes: number;
  bySubject: { subjectId: string; subjectName: string; accuracy: number; questions: number }[];
  byMode: { mode: PracticeMode; accuracy: number; attempts: number }[];
  /** accuracy per weekday, Sat→Fri, 0 when no data */
  weekly: number[];
};

export function summarise(attempts: PracticeAttempt[] = listAttempts()): PracticeSummary {
  const questions = attempts.reduce((n, a) => n + a.total, 0);
  const correct = attempts.reduce((n, a) => n + a.correct + a.partial * 0.5, 0);
  const minutes = Math.round(attempts.reduce((n, a) => n + a.seconds, 0) / 60);

  const subjectMap = new Map<string, { name: string; correct: number; total: number }>();
  for (const a of attempts) {
    const cur = subjectMap.get(a.subjectId) ?? { name: a.subjectName, correct: 0, total: 0 };
    cur.correct += a.correct + a.partial * 0.5;
    cur.total += a.total;
    subjectMap.set(a.subjectId, cur);
  }

  const modeMap = new Map<PracticeMode, { pct: number; n: number }>();
  for (const a of attempts) {
    const cur = modeMap.get(a.mode) ?? { pct: 0, n: 0 };
    cur.pct += a.percent;
    cur.n += 1;
    modeMap.set(a.mode, cur);
  }

  // JS getDay(): 0=Sun … 6=Sat. Board weeks start on Saturday.
  const order = [6, 0, 1, 2, 3, 4, 5];
  const weekly = order.map((day) => {
    const dayAttempts = attempts.filter((a) => new Date(a.at).getDay() === day);
    if (dayAttempts.length === 0) return 0;
    return Math.round(dayAttempts.reduce((n, a) => n + a.percent, 0) / dayAttempts.length);
  });

  return {
    attempts: attempts.length,
    questions,
    correct: Math.round(correct),
    wrong: Math.max(0, questions - Math.round(correct)),
    accuracy: questions > 0 ? Math.round((correct / questions) * 100) : 0,
    minutes,
    bySubject: [...subjectMap.entries()]
      .map(([subjectId, v]) => ({
        subjectId,
        subjectName: v.name,
        questions: v.total,
        accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.questions - a.questions),
    byMode: [...modeMap.entries()].map(([mode, v]) => ({
      mode,
      attempts: v.n,
      accuracy: v.n > 0 ? Math.round(v.pct / v.n) : 0,
    })),
    weekly,
  };
}
