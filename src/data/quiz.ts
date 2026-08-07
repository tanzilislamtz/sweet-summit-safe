import type { FigureSpec } from "./figures";

export type Subject = {
  id: string;
  name: string;
  nameBn: string;
  emoji: string;
  color: string;
  questions: number;
};

// SSC · Science group (profile-driven; hardcoded for the demo UI)
export const subjects: Subject[] = [
  { id: "math", name: "Mathematics", nameBn: "Math", emoji: "📐", color: "from-indigo-500 to-purple-500", questions: 12400 },
  { id: "hmath", name: "Higher Math", nameBn: "Higher Math", emoji: "∑", color: "from-violet-500 to-fuchsia-500", questions: 8100 },
  { id: "physics", name: "Physics", nameBn: "Physics", emoji: "⚛️", color: "from-blue-500 to-cyan-500", questions: 9800 },
  { id: "chem", name: "Chemistry", nameBn: "Chemistry", emoji: "🧪", color: "from-emerald-500 to-teal-500", questions: 8600 },
  { id: "bio", name: "Biology", nameBn: "Biology", emoji: "🧬", color: "from-rose-500 to-pink-500", questions: 7200 },
  { id: "english", name: "English", nameBn: "English", emoji: "🔤", color: "from-amber-500 to-orange-500", questions: 6500 },
  { id: "bangla", name: "Bangla", nameBn: "Bangla", emoji: "📖", color: "from-fuchsia-500 to-pink-500", questions: 5400 },
  { id: "ict", name: "ICT", nameBn: "ICT", emoji: "💻", color: "from-sky-500 to-indigo-500", questions: 3200 },
];

export type Board = {
  id: string;
  name: string;
  short: string;
  region: string;
};

export const boards: Board[] = [
  { id: "dhaka", name: "Dhaka Board", short: "DHA", region: "Central" },
  { id: "rajshahi", name: "Rajshahi Board", short: "RAJ", region: "North" },
  { id: "chattogram", name: "Chattogram Board", short: "CTG", region: "South-East" },
  { id: "sylhet", name: "Sylhet Board", short: "SYL", region: "North-East" },
  { id: "khulna", name: "Khulna Board", short: "KHU", region: "South-West" },
  { id: "barisal", name: "Barisal Board", short: "BAR", region: "South" },
  { id: "jashore", name: "Jashore Board", short: "JAS", region: "West" },
  { id: "cumilla", name: "Cumilla Board", short: "CUM", region: "East" },
  { id: "dinajpur", name: "Dinajpur Board", short: "DIN", region: "North-West" },
  { id: "mymensingh", name: "Mymensingh Board", short: "MYM", region: "North-Central" },
];

export type Question = {
  id: string;
  subject: string;
  topic: string;
  text: string;
  options: string[];
  answer: number; // index
  explanation: string;
  year?: string;
  board?: string;
  /** Optional diagram/screenshot the learner must read to answer. */
  figure?: FigureSpec;
  difficulty: "easy" | "medium" | "hard";
};

// Seed pool. Real questions will come from admin; this shape is what the UI expects.
const seed: Question[] = [
  { id: "math-1", subject: "math", topic: "Algebra", text: "If x + 1/x = 3, then x² + 1/x² = ?", options: ["7", "9", "11", "5"], answer: 0, explanation: "(x + 1/x)² = x² + 2 + 1/x² → 9 = x² + 1/x² + 2 → x² + 1/x² = 7", difficulty: "easy" },
  { id: "math-2", subject: "math", topic: "Trigonometry", text: "sin 30° + cos 60° = ?", options: ["0", "1", "1/2", "√3/2"], answer: 1, explanation: "sin 30° = 1/2, cos 60° = 1/2 → sum = 1.", difficulty: "medium" },
  { id: "math-3", subject: "math", topic: "Geometry", text: "The sum of interior angles of a hexagon is:", options: ["540°", "720°", "900°", "1080°"], answer: 1, explanation: "(n-2)·180° with n=6 gives 720°.", difficulty: "easy" },
  { id: "math-4", subject: "math", topic: "Number Theory", text: "The LCM of 12 and 18 is:", options: ["36", "72", "24", "48"], answer: 0, explanation: "12 = 2²·3, 18 = 2·3² → LCM = 2²·3² = 36.", difficulty: "easy" },
  { id: "math-5", subject: "math", topic: "Statistics", text: "The median of 3, 5, 7, 9, 11 is:", options: ["5", "7", "9", "6"], answer: 1, explanation: "Middle value of the sorted list is 7.", difficulty: "easy" },

  { id: "hmath-1", subject: "hmath", topic: "Vectors", text: "The magnitude of vector (3, 4) is:", options: ["5", "7", "12", "1"], answer: 0, explanation: "√(3² + 4²) = √25 = 5.", difficulty: "easy" },
  { id: "hmath-2", subject: "hmath", topic: "Calculus", text: "d/dx (x³) = ?", options: ["x²", "3x²", "3x", "x⁴/4"], answer: 1, explanation: "Power rule: d/dx xⁿ = n·x^(n-1).", difficulty: "easy" },
  { id: "hmath-3", subject: "hmath", topic: "Matrices", text: "Determinant of [[1,2],[3,4]] is:", options: ["-2", "2", "10", "-10"], answer: 0, explanation: "1·4 − 2·3 = 4 − 6 = −2.", difficulty: "medium" },
  { id: "hmath-4", subject: "hmath", topic: "Complex", text: "i² equals:", options: ["1", "-1", "i", "0"], answer: 1, explanation: "By definition, i² = −1.", difficulty: "easy" },
  { id: "hmath-5", subject: "hmath", topic: "Sequences", text: "Sum of first 10 natural numbers is:", options: ["45", "50", "55", "100"], answer: 2, explanation: "n(n+1)/2 = 10·11/2 = 55.", difficulty: "easy" },

  { id: "physics-1", subject: "physics", topic: "Mechanics", text: "A body of mass 5 kg under 10 N force. Acceleration is:", options: ["0.5 m/s²", "2 m/s²", "5 m/s²", "50 m/s²"], answer: 1, explanation: "F = ma → a = 10/5 = 2 m/s².", difficulty: "easy" },
  { id: "physics-2", subject: "physics", topic: "Optics", text: "Speed of light in vacuum is approximately:", options: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10¹⁰ m/s", "3×10⁴ m/s"], answer: 0, explanation: "c ≈ 3×10⁸ m/s.", difficulty: "easy" },
  { id: "physics-3", subject: "physics", topic: "Heat", text: "SI unit of temperature is:", options: ["Celsius", "Kelvin", "Fahrenheit", "Rankine"], answer: 1, explanation: "Kelvin (K) is the SI base unit.", difficulty: "easy" },
  { id: "physics-4", subject: "physics", topic: "Electricity", text: "Ohm's law: V = ?", options: ["IR", "I/R", "R/I", "I²R"], answer: 0, explanation: "Voltage equals current times resistance.", difficulty: "easy" },
  { id: "physics-5", subject: "physics", topic: "Waves", text: "Sound cannot travel through:", options: ["Water", "Air", "Vacuum", "Steel"], answer: 2, explanation: "Sound needs a medium; vacuum has none.", difficulty: "easy" },

  { id: "chem-1", subject: "chem", topic: "Periodic Table", text: "Which of these is a noble gas?", options: ["Cl", "Ar", "O", "N"], answer: 1, explanation: "Argon (Ar) belongs to group 18 — noble gases.", difficulty: "easy" },
  { id: "chem-2", subject: "chem", topic: "Bonds", text: "Water molecule has how many hydrogen atoms?", options: ["1", "2", "3", "4"], answer: 1, explanation: "H₂O has two hydrogen atoms.", difficulty: "easy" },
  { id: "chem-3", subject: "chem", topic: "Acids", text: "pH of pure water at 25°C is:", options: ["0", "7", "14", "1"], answer: 1, explanation: "Neutral water has pH ≈ 7.", difficulty: "easy" },
  { id: "chem-4", subject: "chem", topic: "Reactions", text: "Which is an oxidising agent?", options: ["H₂", "O₂", "Na", "CH₄"], answer: 1, explanation: "Oxygen typically accepts electrons.", difficulty: "medium" },
  { id: "chem-5", subject: "chem", topic: "Organic", text: "Simplest alkane is:", options: ["Methane", "Ethane", "Propane", "Butane"], answer: 0, explanation: "CH₄ is the simplest alkane.", difficulty: "easy" },

  { id: "bio-1", subject: "bio", topic: "Cell", text: "Mitosis produces how many daughter cells?", options: ["2", "4", "8", "1"], answer: 0, explanation: "Mitosis yields 2 identical daughter cells.", difficulty: "easy" },
  { id: "bio-2", subject: "bio", topic: "Genetics", text: "DNA is made up of nucleotides containing:", options: ["Sugar, phosphate, base", "Only bases", "Only sugars", "Only phosphates"], answer: 0, explanation: "Each nucleotide = sugar + phosphate + nitrogen base.", difficulty: "medium" },
  { id: "bio-3", subject: "bio", topic: "Human Body", text: "The largest organ of human body is:", options: ["Liver", "Skin", "Lung", "Heart"], answer: 1, explanation: "Skin is the largest organ by area and mass.", difficulty: "easy" },
  { id: "bio-4", subject: "bio", topic: "Plants", text: "Photosynthesis produces:", options: ["CO₂", "O₂", "N₂", "H₂"], answer: 1, explanation: "Plants release oxygen as a by-product.", difficulty: "easy" },
  { id: "bio-5", subject: "bio", topic: "Ecology", text: "Producers in an ecosystem are:", options: ["Herbivores", "Green plants", "Carnivores", "Decomposers"], answer: 1, explanation: "Green plants make their own food via photosynthesis.", difficulty: "easy" },

  { id: "english-1", subject: "english", topic: "Grammar", text: "Choose the correct passive form: 'He writes a letter.'", options: ["A letter was written by him.", "A letter is written by him.", "A letter has been written by him.", "A letter is being written by him."], answer: 1, explanation: "Simple present active → 'is/are + past participle' passive.", difficulty: "medium" },
  { id: "english-2", subject: "english", topic: "Vocabulary", text: "Synonym of 'benevolent' is:", options: ["Cruel", "Kind", "Angry", "Rude"], answer: 1, explanation: "Benevolent means kind/generous.", difficulty: "medium" },
  { id: "english-3", subject: "english", topic: "Tense", text: "'She ___ to school every day.'", options: ["go", "goes", "gone", "going"], answer: 1, explanation: "Third person singular present takes -s/-es.", difficulty: "easy" },
  { id: "english-4", subject: "english", topic: "Preposition", text: "'He is fond ___ music.'", options: ["of", "in", "at", "on"], answer: 0, explanation: "Idiomatic collocation: fond of.", difficulty: "easy" },
  { id: "english-5", subject: "english", topic: "Article", text: "'He is ___ honest man.'", options: ["a", "an", "the", "no article"], answer: 1, explanation: "'Honest' begins with a vowel sound, use 'an'.", difficulty: "easy" },

  { id: "bangla-1", subject: "bangla", topic: "Synonym", text: "Which word is a synonym of 'moon'?", options: ["Sun", "Moon (synonym)", "Sun (radiance)", "Sun (day-maker)"], answer: 1, explanation: "The second option means 'moon'; the rest are synonyms of the sun.", difficulty: "easy" },
  { id: "bangla-2", subject: "bangla", topic: "Grammar", text: "What part of speech is the word 'book'?", options: ["Pronoun", "Noun", "Verb", "Adjective"], answer: 1, explanation: "'Book' is a noun.", difficulty: "easy" },
  { id: "bangla-3", subject: "bangla", topic: "Vocabulary", text: "Which word is a synonym of 'ocean'?", options: ["Wind", "Sea", "Water", "Cloud"], answer: 1, explanation: "'Sea' means ocean.", difficulty: "easy" },
  { id: "bangla-4", subject: "bangla", topic: "Idiom", text: "The idiom 'trial by fire' means:", options: ["An easy task", "A difficult test", "Cooking", "A festival"], answer: 1, explanation: "'Trial by fire' means a difficult test.", difficulty: "medium" },
  { id: "bangla-5", subject: "bangla", topic: "Author", text: "Who is the author of 'Pather Panchali'?", options: ["Rabindranath", "Bibhutibhushan", "Sharatchandra", "Nazrul"], answer: 1, explanation: "It is a work by Bibhutibhushan Bandyopadhyay.", difficulty: "medium" },

  { id: "ict-1", subject: "ict", topic: "Networking", text: "Full form of HTTP?", options: ["HyperText Transfer Protocol", "HyperText Transmission Protocol", "HighText Transfer Protocol", "HyperTool Transfer Protocol"], answer: 0, explanation: "HTTP = HyperText Transfer Protocol.", difficulty: "easy" },
  { id: "ict-2", subject: "ict", topic: "Hardware", text: "The 'brain' of the computer is the:", options: ["RAM", "CPU", "SSD", "GPU"], answer: 1, explanation: "The CPU executes instructions — the brain.", difficulty: "easy" },
  { id: "ict-3", subject: "ict", topic: "Software", text: "Which is an operating system?", options: ["MS Word", "Chrome", "Linux", "Excel"], answer: 2, explanation: "Linux is an operating system; the rest are apps.", difficulty: "easy" },
  { id: "ict-4", subject: "ict", topic: "Web", text: "HTML stands for:", options: ["HyperText Markup Language", "Home Tool Markup Language", "Hyperlinks Text Marking Language", "None"], answer: 0, explanation: "HTML = HyperText Markup Language.", difficulty: "easy" },
  { id: "ict-5", subject: "ict", topic: "Security", text: "Which is a strong password practice?", options: ["Using birthdate", "Using 'password'", "Long, mixed characters", "Using only letters"], answer: 2, explanation: "Length and variety make passwords strong.", difficulty: "easy" },
];

export const questions: Question[] = seed;

/** Years a learner can pick board papers from (newest first). */
export const boardYears: number[] = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019];

/** Learner's current group — board papers are filtered to these subjects. */
export const learnerGroup = { level: "SSC", group: "Science" } as const;

/** Subject ids that belong to the learner's group (demo: SSC Science). */
export const groupSubjectIds: string[] = [
  "bangla",
  "english",
  "math",
  "hmath",
  "physics",
  "chem",
  "bio",
  "ict",
];

export function getGroupSubjects(): Subject[] {
  return subjects.filter((s) => groupSubjectIds.includes(s.id));
}

/** Deterministic per board × year × subject paper metadata (demo data). */
export function getBoardPaperMeta(boardId: string, year: number, subjectId: string) {
  const key = `${boardId}-${year}-${subjectId}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return {
    questions: 25,
    marks: 25,
    minutes: 25,
    attempted: h % 3 === 0,
    solvedBy: 400 + (h % 2600),
  };
}

// Build a realistic 25-question paper for a subject × board.

export function getExamQuestions(subjectId: string, boardId: string, year = "2024"): Question[] {
  const pool = seed.filter((q) => q.subject === subjectId);
  const source = pool.length ? pool : seed;
  const boardName = boards.find((b) => b.id === boardId)?.name ?? boardId;
  const out: Question[] = [];
  for (let i = 0; i < 25; i++) {
    const base = source[i % source.length];
    out.push({
      ...base,
      id: `${subjectId}-${boardId}-${i + 1}`,
      board: boardName,
      year,
      // vary difficulty a bit through the paper
      difficulty: i < 10 ? "easy" : i < 20 ? "medium" : "hard",
    });
  }
  return out;
}

// Categories a subject can be practiced under (matches admin taxonomy).
export type CategoryId = "mcq" | "cq" | "ka" | "kha" | "short";
export type Category = {
  id: CategoryId;
  name: string;
  nameBn: string;
  tagline: string;
  emoji: string;
  color: string; // tailwind gradient
  perPaper: number;
};

export const categories: Category[] = [
  { id: "mcq",   name: "MCQ",              nameBn: "MCQ",           tagline: "25 multiple-choice questions", emoji: "📝", color: "from-blue-500 to-indigo-500",     perPaper: 25 },
  { id: "cq",    name: "Creative Question",nameBn: "CQ",            tagline: "Structured 4-part questions",  emoji: "🖋️", color: "from-amber-400 to-orange-500",    perPaper: 6  },
  { id: "ka",    name: "Ka Bhandar",       nameBn: "Ka Bhandar",     tagline: "Knowledge-based questions",    emoji: "📚", color: "from-sky-500 to-blue-600",        perPaper: 15 },
  { id: "kha",   name: "Kha Bhandar",      nameBn: "Kha Bhandar",     tagline: "Comprehension questions",      emoji: "📗", color: "from-emerald-500 to-green-600",   perPaper: 15 },
  { id: "short", name: "Short Question",   nameBn: "Short Question", tagline: "Quick 1-line answers",     emoji: "⏱️", color: "from-fuchsia-500 to-purple-600",  perPaper: 20 },
];

// Written-style prompts derived from the MCQ seed (topic + text) so the UI
// has real-feeling content until admin data lands.
export type WrittenQuestion = {
  id: string;
  n: number;
  topic: string;
  prompt: string;
  answer: string;
  marks: number;
};

export function getWrittenQuestions(
  subjectId: string,
  boardId: string,
  category: Exclude<CategoryId, "mcq">,
): WrittenQuestion[] {
  const cat = categories.find((c) => c.id === category)!;
  const pool = seed.filter((q) => q.subject === subjectId);
  const source = pool.length ? pool : seed;
  const marks = category === "cq" ? 10 : category === "short" ? 2 : 3;
  const shape = (base: Question, i: number): WrittenQuestion => {
    const topic = base.topic;
    if (category === "cq") {
      return {
        id: `${subjectId}-${boardId}-cq-${i + 1}`,
        n: i + 1,
        topic,
        prompt:
          `Scenario: A concept from ${topic} is being studied.\n` +
          `(a) Define the key term used in "${base.text}". [1]\n` +
          `(b) Explain the underlying principle. [2]\n` +
          `(c) Apply it to the given problem and solve. [3]\n` +
          `(d) Justify whether the result "${base.options[base.answer]}" is unique. [4]`,
        answer: base.explanation,
        marks,
      };
    }
    if (category === "short") {
      return {
        id: `${subjectId}-${boardId}-sh-${i + 1}`,
        n: i + 1,
        topic,
        prompt: base.text,
        answer: base.options[base.answer],
        marks,
      };
    }
    // ka / kha bhandar
    const lead = category === "ka" ? "Define / state" : "Explain briefly";
    return {
      id: `${subjectId}-${boardId}-${category}-${i + 1}`,
      n: i + 1,
      topic,
      prompt: `${lead}: ${base.text}`,
      answer: `${base.options[base.answer]} — ${base.explanation}`,
      marks,
    };
  };
  const out: WrittenQuestion[] = [];
  for (let i = 0; i < cat.perPaper; i++) out.push(shape(source[i % source.length], i));
  return out;
}

export type LeaderboardEntry = {
  rank: number;
  name: string;
  institute: string;
  xp: number;
  streak: number;
  avatar: string;
};

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "Sadia Rahman", institute: "Notre Dame College", xp: 12480, streak: 62, avatar: "🥇" },
  { rank: 2, name: "Rayhan Hossain", institute: "Dhaka College", xp: 11930, streak: 48, avatar: "🥈" },
  { rank: 3, name: "Tanvir Ahmed", institute: "RAJUK Uttara", xp: 11240, streak: 55, avatar: "🥉" },
  { rank: 4, name: "Nafisa Islam", institute: "Viqarunnisa", xp: 10820, streak: 41, avatar: "🎓" },
  { rank: 5, name: "Imran Khan", institute: "Holy Cross", xp: 10450, streak: 39, avatar: "🎓" },
  { rank: 6, name: "Mousumi Sultana", institute: "Wills Little Flower", xp: 9980, streak: 34, avatar: "🎓" },
  { rank: 7, name: "Arif Chowdhury", institute: "St. Joseph", xp: 9540, streak: 30, avatar: "🎓" },
  { rank: 8, name: "Tamanna Begum", institute: "Ideal School", xp: 9210, streak: 28, avatar: "🎓" },
  { rank: 9, name: "Saif Uddin", institute: "Mirpur Cantt.", xp: 8890, streak: 26, avatar: "🎓" },
  { rank: 10, name: "Rubaiya Haque", institute: "Motijheel Ideal", xp: 8620, streak: 24, avatar: "🎓" },
];

export const badges = [
  { id: "streak7", name: "7-day streak", emoji: "🔥", desc: "Practise 7 days in a row" },
  { id: "streak30", name: "30-day streak", emoji: "⚡", desc: "Practise 30 days in a row" },
  { id: "correct50", name: "50 correct", emoji: "🎯", desc: "50 correct answers" },
  { id: "mock10", name: "10 mock tests", emoji: "🏆", desc: "Finish 10 mock tests" },
  { id: "topper", name: "Topper", emoji: "👑", desc: "Break into top 10" },
  { id: "scholar", name: "Scholar", emoji: "📚", desc: "Solve 500 questions" },
];
