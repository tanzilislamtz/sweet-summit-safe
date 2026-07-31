import { subjects, type Question, type Subject } from "./quiz";
import { getChapters } from "./practice";
import { getTopicQuestions } from "./topic-questions";

/**
 * Mock-test catalogue.
 *
 * Everything here is deterministic demo data so the UI is stable between
 * visits. When the admin panel lands, only the accessor functions
 * (`listMockTests`, `getMockTest`, `getMockTestPaper`) need to change.
 */

// --- deterministic helpers ---------------------------------------------------

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick(seed: string, min: number, max: number): number {
  return min + (hash(seed) % (max - min + 1));
}

// --- types -------------------------------------------------------------------

export type MockCategoryId = "model" | "chapter" | "subject" | "previous";

export type MockCategory = {
  id: MockCategoryId;
  name: string;
  nameBn: string;
  desc: string;
  emoji: string;
  /** semantic tone used by the UI */
  tone: "primary" | "secondary" | "accent" | "muted";
  badge?: string;
};

export const mockCategories: MockCategory[] = [
  {
    id: "model",
    name: "Live Model Tests",
    nameBn: "মডেল টেস্ট",
    desc: "Full-length papers that mirror the real board exam.",
    emoji: "🎯",
    tone: "primary",
    badge: "Live",
  },
  {
    id: "chapter",
    name: "Chapter-wise Tests",
    nameBn: "অধ্যায়ভিত্তিক",
    desc: "Short tests to lock a single chapter before moving on.",
    emoji: "📚",
    tone: "secondary",
  },
  {
    id: "subject",
    name: "Subject-wise Tests",
    nameBn: "বিষয়ভিত্তিক",
    desc: "Full subject coverage in one sitting.",
    emoji: "🧠",
    tone: "accent",
  },
  {
    id: "previous",
    name: "Previous Year Papers",
    nameBn: "বিগত সালের প্রশ্ন",
    desc: "Real board questions from the last five years.",
    emoji: "🗂️",
    tone: "muted",
  },
];

export type MockTest = {
  id: string;
  category: MockCategoryId;
  index: number;
  title: string;
  subjectId: string;
  subjectName: string;
  chapterId?: string;
  chapterName?: string;
  questions: number;
  minutes: number;
  marks: number;
  negative: number;
  attempts: number;
  avgScore: number;
  /** null when never attempted */
  bestScore: number | null;
  isNew: boolean;
  free: boolean;
  syllabus: string[];
  year?: number;
  board?: string;
};

// --- catalogue ---------------------------------------------------------------

const boardsShort = ["Dhaka", "Rajshahi", "Cumilla", "Jashore", "Chattogram"];

function buildTest(
  category: MockCategoryId,
  subject: Subject,
  index: number,
): MockTest {
  const chapters = getChapters(subject.id);
  const seedBase = `${category}|${subject.id}|${index}`;
  const chapter = chapters[(index - 1) % chapters.length];

  const questions =
    category === "chapter" ? 15 : category === "model" ? 50 : category === "subject" ? 30 : 40;
  const minutes = category === "chapter" ? 12 : category === "model" ? 45 : category === "subject" ? 25 : 35;

  const attempted = pick(`${seedBase}att`, 0, 10) > 6;
  const syllabus =
    category === "chapter"
      ? [`Ch ${chapter.index}: ${chapter.name}`]
      : chapters.slice(0, category === "model" ? 5 : 3).map((c) => `Ch ${c.index}: ${c.name}`);

  const title =
    category === "model"
      ? `${subject.name} Full Test ${String(index).padStart(2, "0")}`
      : category === "chapter"
        ? `${subject.name} · Ch ${chapter.index} Test`
        : category === "subject"
          ? `${subject.name} Subject Test ${String(index).padStart(2, "0")}`
          : `${subject.name} Board ${2025 - index}`;

  return {
    id: `${category}-${subject.id}-${index}`,
    category,
    index,
    title,
    subjectId: subject.id,
    subjectName: subject.name,
    chapterId: category === "chapter" ? chapter.id : undefined,
    chapterName: category === "chapter" ? chapter.name : undefined,
    questions,
    minutes,
    marks: questions,
    negative: category === "model" || category === "previous" ? 0.25 : 0,
    attempts: pick(`${seedBase}n`, 240, 9800),
    avgScore: pick(`${seedBase}avg`, 48, 86),
    bestScore: attempted ? pick(`${seedBase}best`, 52, 96) : null,
    isNew: index === 1 && category !== "previous",
    free: index <= 2,
    syllabus,
    year: category === "previous" ? 2025 - index : undefined,
    board: category === "previous" ? boardsShort[(index - 1) % boardsShort.length] : undefined,
  };
}

export function listMockTests(
  category: MockCategoryId,
  subjectId?: string,
): MockTest[] {
  const pool = subjectId ? subjects.filter((s) => s.id === subjectId) : subjects;
  const perSubject = category === "previous" ? 5 : subjectId ? 8 : 3;
  return pool.flatMap((s) =>
    Array.from({ length: perSubject }, (_, i) => buildTest(category, s, i + 1)),
  );
}

export function getMockTest(id: string): MockTest | undefined {
  const [category, subjectId, idx] = id.split("-") as [MockCategoryId, string, string];
  const subject = subjects.find((s) => s.id === subjectId);
  if (!subject || !mockCategories.some((c) => c.id === category)) return undefined;
  const index = Number(idx);
  if (!Number.isFinite(index) || index < 1) return undefined;
  return buildTest(category, subject, index);
}

/** Deterministic paper for a mock test, mixing questions across chapters. */
export function getMockTestPaper(test: MockTest): Question[] {
  const chapters = getChapters(test.subjectId);
  const out: Question[] = [];
  const seen = new Set<string>();

  const source = test.chapterId
    ? chapters.filter((c) => c.id === test.chapterId)
    : chapters;

  let ci = 0;
  let guard = 0;
  while (out.length < test.questions && guard < 200) {
    guard++;
    const chapter = source[ci % source.length];
    ci++;
    const topic = chapter.topics[(guard + test.index) % chapter.topics.length];
    const batch = getTopicQuestions({
      subjectId: test.subjectId,
      chapterId: chapter.id,
      chapterName: chapter.name,
      topicId: `${topic.id}-mock${test.index}`,
      topicName: topic.name,
      count: 6,
    });
    for (const q of batch) {
      if (out.length >= test.questions) break;
      if (seen.has(q.text)) continue;
      seen.add(q.text);
      out.push({ ...q, id: `${test.id}-q${out.length + 1}`, topic: chapter.name });
    }
  }
  return out;
}

// --- learner stats (demo) ----------------------------------------------------

export type MockStats = {
  taken: number;
  avgScore: number;
  rank: number;
  streak: number;
  hoursSpent: string;
  accuracy: number;
};

export function getMockStats(): MockStats {
  return {
    taken: 28,
    avgScore: 76,
    rank: 57,
    streak: 7,
    hoursSpent: "14h 20m",
    accuracy: 81,
  };
}

export type LeaderRow = {
  rank: number;
  name: string;
  score: number;
  time: string;
  you?: boolean;
};

export function getLeaderboard(testId: string): LeaderRow[] {
  const names = [
    "Ayesha Rahman",
    "Tanvir Hasan",
    "Nusrat Jahan",
    "Rakib Islam",
    "Sadia Afrin",
    "Mahin Chowdhury",
    "Fahim Ahmed",
    "Jarin Tasnim",
  ];
  const rows = names.map((name, i) => ({
    rank: i + 1,
    name,
    score: 100 - i * 3 - (hash(`${testId}${name}`) % 3),
    time: `${pick(`${testId}${name}t`, 9, 24)}:${String(pick(`${testId}${name}s`, 10, 59))}`,
  }));
  rows.push({ rank: 12, name: "You", score: 86, time: "18:42" });
  return rows;
}
