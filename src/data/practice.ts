import { subjects, type Subject } from "./quiz";

// ---------------------------------------------------------------------------
// Deterministic pseudo-random helpers so the demo UI stays stable per subject.
// (Real numbers will come from the admin panel / backend later.)
// ---------------------------------------------------------------------------
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

export type PracticeMode = "mcq" | "cq" | "board";

export const practiceModes: {
  id: PracticeMode;
  name: string;
  nameBn: string;
  desc: string;
}[] = [
  { id: "mcq", name: "MCQ Practice", nameBn: "MCQ", desc: "Practice topic-wise MCQs and strengthen your concepts." },
  { id: "cq", name: "CQ Practice", nameBn: "Creative", desc: "Improve your writing skills with creative questions." },
  { id: "board", name: "Board Questions", nameBn: "Board Questions", desc: "Practice past board questions to understand exam patterns." },
];

// --- Chapter / topic taxonomy -------------------------------------------------

const chapterNames: Record<string, string[]> = {
  physics: [
    "Physical Quantities", "Motion", "Force", "Work, Power & Energy", "State of Matter & Pressure",
    "Effect of Heat", "Waves & Sound", "Reflection of Light", "Refraction of Light", "Static Electricity",
    "Current Electricity", "Magnetic Effect of Current", "Modern Physics", "Nuclear Physics",
    "Electronics", "Physics in Daily Life", "Light & Optics Lab", "Measurement Lab",
  ],
  math: [
    "Real Numbers", "Sets & Functions", "Algebraic Expressions", "Exponents & Logarithms",
    "Equations of One Variable", "Lines, Angles & Triangles", "Practical Geometry", "Circles",
    "Trigonometric Ratios", "Distance & Height", "Mensuration", "Statistics", "Ratio & Proportion",
    "Simultaneous Equations",
  ],
  hmath: [
    "Sets & Functions", "Algebraic Expressions", "Geometry", "Geometric Construction", "Equations",
    "Infinite Series", "Trigonometry", "Exponential & Log Functions", "Binomial Expansion",
    "Coordinate Geometry", "Vectors in a Plane", "Solid Geometry", "Probability", "Statistics",
  ],
  chem: [
    "Concept of Chemistry", "States of Matter", "Structure of Matter", "Periodic Table",
    "Chemical Bond", "Concept of Mole", "Chemical Reaction", "Chemistry & Energy",
    "Acid–Base Balance", "Mineral Resources: Metals", "Mineral Resources: Fossils",
    "Chemistry in Daily Life",
  ],
  bio: [
    "Life & Its Diversity", "Cell & Tissue", "Cell Division", "Bioenergetics", "Food & Nutrition",
    "Transport in Organisms", "Gaseous Exchange", "Excretion", "Movement & Locomotion",
    "Coordination", "Reproduction", "Heredity & Evolution", "Environment & Ecosystem",
  ],
  english: [
    "Parts of Speech", "Tense", "Right Form of Verbs", "Preposition", "Voice Change",
    "Narration", "Transformation", "Completing Sentences", "Vocabulary", "Comprehension",
    "Paragraph Writing", "Letter & Email",
  ],
  bangla: [
    "Introduction to Grammar", "Sounds & Letters", "Sandhi (Euphonic Combination)", "Samas (Compounding)", "Roots & Suffixes", "Case & Inflection",
    "Idioms", "Synonyms", "Antonyms", "Prose", "Poetry", "Composition",
  ],
  ict: [
    "ICT in Daily Life", "Communication Systems", "Number Systems", "Digital Devices",
    "HTML & Web Design", "Programming Basics", "Database Management", "Cyber Security",
    "Multimedia", "E-Commerce", "Networking", "Computer Ethics",
  ],
};

const topicSuffix = [
  "Basics", "Core Concept", "Formulas", "Applications", "Problem Solving", "Advanced", "Exam Focus",
];

export type PracticeTopic = {
  id: string;
  name: string;
  questions: number;
  minutes: number;
  progress: number; // 0-100
  locked: boolean;
  classAvg: number;
};

export type PracticeChapter = {
  id: string;
  index: number;
  name: string;
  questions: number;
  progress: number;
  topics: PracticeTopic[];
};

export function getChapters(subjectId: string): PracticeChapter[] {
  const names = chapterNames[subjectId] ?? chapterNames.physics;
  return names.map((name, i) => {
    const id = `ch-${i + 1}`;
    const topicCount = pick(`${subjectId}${id}t`, 4, 7);
    const topics: PracticeTopic[] = Array.from({ length: topicCount }, (_, t) => {
      const tid = `${id}-t${t + 1}`;
      const p = pick(`${subjectId}${tid}p`, 0, 100);
      return {
        id: tid,
        name: t === 0 ? `What is ${name}?` : `${name} · ${topicSuffix[(t + i) % topicSuffix.length]}`,
        questions: pick(`${subjectId}${tid}q`, 6, 24),
        minutes: pick(`${subjectId}${tid}m`, 3, 9),
        progress: t > 0 && p < 12 ? 0 : p,
        locked: false,
        classAvg: pick(`${subjectId}${tid}c`, 55, 92),
      };
    });
    const questions = topics.reduce((a, t) => a + t.questions, 0);
    const progress = Math.round(topics.reduce((a, t) => a + t.progress, 0) / topics.length);
    return { id, index: i + 1, name, questions, progress, topics };
  });
}

export type SubjectStats = {
  chapters: number;
  mcq: number;
  cq: number;
  boardPapers: number;
  mcqAttempted: number;
  chaptersDone: number;
  progress: number; // MCQ-driven completion
  accuracy: number;
  cqAttempted: number;
  cqAvg: number;
  boardAttempted: number;
  boardAvg: number;
  timeSpent: string;
};

export function getSubjectStats(subject: Subject): SubjectStats {
  const chapters = getChapters(subject.id);
  const mcq = pick(`${subject.id}mcq`, 120, 420);
  const cq = pick(`${subject.id}cq`, 18, 60);
  const progress = Math.round(chapters.reduce((a, c) => a + c.progress, 0) / chapters.length);
  return {
    chapters: chapters.length,
    mcq,
    cq,
    boardPapers: pick(`${subject.id}bp`, 24, 96),
    mcqAttempted: Math.round((mcq * progress) / 100),
    chaptersDone: Math.round((chapters.length * progress) / 100),
    progress,
    accuracy: pick(`${subject.id}acc`, 52, 88),
    cqAttempted: pick(`${subject.id}cqa`, 4, cq),
    cqAvg: pick(`${subject.id}cqv`, 55, 85),
    boardAttempted: pick(`${subject.id}ba`, 5, 40),
    boardAvg: pick(`${subject.id}bav`, 50, 82),
    timeSpent: `${pick(`${subject.id}h`, 2, 18)}h ${pick(`${subject.id}mi`, 5, 55)}m`,
  };
}

export const allSubjectStats = () =>
  subjects.map((s) => ({ subject: s, stats: getSubjectStats(s) }));
