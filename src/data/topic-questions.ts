import type { Question } from "./quiz";
import type { FigureSpec } from "./figures";

/**
 * Deterministic topic-aware question generator.
 *
 * Until the admin panel supplies real question banks, this module builds a
 * stable, *different* set of MCQs for every (subject, chapter, topic) triple.
 * The same triple always produces the same paper, so progress/review stays
 * consistent between visits.
 */

// --- deterministic RNG -------------------------------------------------------

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: string) {
  let s = hash(seed) || 1;
  return () => {
    // xorshift32
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

type Raw = {
  text: string;
  options: string[];
  answer: number;
  explanation: string;
  /** Optional diagram the learner must read before answering. */
  figure?: FigureSpec;
};

type Factory = (rnd: () => number, topic: string, chapter: string) => Raw;

const int = (rnd: () => number, min: number, max: number) =>
  min + Math.floor(rnd() * (max - min + 1));

/** Build 4 options from a correct numeric value + plausible distractors. */
function numeric(correct: number, distractors: number[], suffix = ""): Omit<Raw, "text" | "explanation"> {
  const uniq = [correct, ...distractors].filter(
    (v, i, a) => a.indexOf(v) === i && Number.isFinite(v),
  );
  while (uniq.length < 4) uniq.push(correct + uniq.length * 3 + 1);
  const four = uniq.slice(0, 4);
  // deterministic-ish rotation so the answer is not always first
  const shift = Math.abs(Math.round(correct)) % 4;
  const rotated = [...four.slice(shift), ...four.slice(0, shift)];
  return {
    options: rotated.map((v) => `${Number.isInteger(v) ? v : v.toFixed(2)}${suffix}`),
    answer: rotated.indexOf(correct),
  };
}

/** Build 4 text options with the correct one placed deterministically. */
function choice(correct: string, wrong: string[], slotSeed: number): Omit<Raw, "text" | "explanation"> {
  const opts = [...wrong.slice(0, 3)];
  const at = Math.abs(slotSeed) % 4;
  opts.splice(at, 0, correct);
  return { options: opts.slice(0, 4), answer: at };
}

// --- subject specific factories ---------------------------------------------

const mathFactories: Factory[] = [
  (r) => {
    const a = int(r, 2, 9);
    const b = int(r, 2, 9);
    const c = a * b;
    return {
      text: `If ${a}x = ${c}, what is the value of x?`,
      ...numeric(b, [b + 1, b - 1, c]),
      explanation: `x = ${c} ÷ ${a} = ${b}.`,
    };
  },
  (r) => {
    const a = int(r, 2, 12);
    const b = int(r, 2, 12);
    const l = (a * b) / gcd(a, b);
    return {
      text: `The LCM of ${a} and ${b} is:`,
      ...numeric(l, [a * b, gcd(a, b), l + a]),
      explanation: `LCM(${a}, ${b}) = (${a}×${b}) ÷ GCD = ${l}.`,
    };
  },
  (r) => {
    const n = int(r, 5, 12);
    const s = (n - 2) * 180;
    return {
      text: `The sum of the interior angles of a polygon with ${n} sides is:`,
      ...numeric(s, [s + 180, s - 180, n * 180], "°"),
      explanation: `(n − 2) × 180° with n = ${n} gives ${s}°.`,
    };
  },
  (r) => {
    const a = int(r, 3, 15);
    const b = int(r, 3, 15);
    return {
      text: `The average of ${a}, ${b} and ${a + b} is:`,
      ...numeric((2 * (a + b)) / 3, [a + b, (a + b) / 2, a + b + 3]),
      explanation: `Sum = ${2 * (a + b)}, divided by 3.`,
    };
  },
  (r) => {
    const a = int(r, 2, 10);
    return {
      text: `If x + 1/x = ${a}, then x² + 1/x² equals:`,
      ...numeric(a * a - 2, [a * a, a * a + 2, 2 * a]),
      explanation: `(x + 1/x)² = x² + 2 + 1/x² → x² + 1/x² = ${a}² − 2 = ${a * a - 2}.`,
    };
  },
];

const physicsFactories: Factory[] = [
  (r) => {
    const m = int(r, 2, 12);
    const f = m * int(r, 2, 9);
    return {
      text: `A body of mass ${m} kg experiences a net force of ${f} N. Its acceleration is:`,
      ...numeric(f / m, [f * m, m / f, f + m], " m/s²"),
      explanation: `F = ma → a = ${f}/${m} = ${f / m} m/s².`,
    };
  },
  (r) => {
    const v = int(r, 2, 24);
    const i = int(r, 1, 6);
    return {
      text: `A resistor carries ${i} A when ${v * i} V is applied. Its resistance is:`,
      ...numeric(v, [i, v * i, v / i], " Ω"),
      explanation: `V = IR → R = ${v * i}/${i} = ${v} Ω.`,
    };
  },
  (r) => {
    const w = int(r, 10, 90);
    const t = int(r, 2, 9);
    return {
      text: `${w} J of work is done in ${t} s. The power is:`,
      ...numeric(Number((w / t).toFixed(2)), [w * t, t / w, w + t], " W"),
      explanation: `P = W/t = ${w}/${t} W.`,
    };
  },
  (r, topic) => {
    const correct = "It needs a material medium to propagate";
    return {
      text: `Regarding ${topic}, which statement is true for sound waves?`,
      ...choice(
        correct,
        [
          "It travels fastest in vacuum",
          "It is an electromagnetic wave",
          "Its speed is independent of temperature",
        ],
        int(r, 0, 3),
      ),
      explanation: "Sound is a mechanical wave, so it cannot travel through vacuum.",
    };
  },
];

const chemFactories: Factory[] = [
  (r) => {
    const n = int(r, 1, 5);
    return {
      text: `How many molecules are there in ${n} mole of a substance (in units of 6.022×10²³)?`,
      ...numeric(n, [n * 2, n + 1, n / 2]),
      explanation: `1 mole = 6.022×10²³ particles, so ${n} mole = ${n} × 6.022×10²³.`,
    };
  },
  (r) => ({
    text: "Which of the following is a noble gas?",
    ...choice("Argon (Ar)", ["Chlorine (Cl)", "Oxygen (O)", "Nitrogen (N)"], int(r, 0, 3)),
    explanation: "Argon is in group 18 — the noble gases.",
  }),
  (r) => ({
    text: "The pH of a neutral aqueous solution at 25°C is:",
    ...numeric(7, [0, 14, 1]),
    explanation: "Neutral water has equal H⁺ and OH⁻ → pH 7.",
  }),
  (r, topic) => ({
    text: `In the context of ${topic}, an oxidising agent is a species that:`,
    ...choice(
      "Accepts electrons",
      ["Donates electrons", "Donates protons only", "Has no effect on electrons"],
      int(r, 0, 3),
    ),
    explanation: "Oxidising agents gain electrons and are themselves reduced.",
  }),
];

const bioFactories: Factory[] = [
  (r) => ({
    text: "Mitosis of one parent cell produces how many daughter cells?",
    ...numeric(2, [4, 8, 1]),
    explanation: "Mitosis yields 2 genetically identical daughter cells.",
  }),
  (r, topic) => ({
    text: `Which structure is most directly involved in ${topic}?`,
    ...choice(
      "The cell and its organelles",
      ["The atmosphere only", "Non-living crystals", "Magnetic fields"],
      int(r, 0, 3),
    ),
    explanation: "All biological processes are ultimately carried out at cellular level.",
  }),
  (r) => ({
    text: "Photosynthesis releases which gas as a by-product?",
    ...choice("Oxygen (O₂)", ["Carbon dioxide (CO₂)", "Nitrogen (N₂)", "Hydrogen (H₂)"], int(r, 0, 3)),
    explanation: "Water is split and oxygen is released.",
  }),
];

const englishFactories: Factory[] = [
  (r) => ({
    text: "Choose the correct passive voice: 'He writes a letter.'",
    ...choice(
      "A letter is written by him.",
      [
        "A letter was written by him.",
        "A letter has been written by him.",
        "A letter is being written by him.",
      ],
      int(r, 0, 3),
    ),
    explanation: "Simple present active → is/are + past participle.",
  }),
  (r) => ({
    text: "'He is fond ___ music.' — choose the right preposition.",
    ...choice("of", ["in", "at", "on"], int(r, 0, 3)),
    explanation: "Fixed collocation: fond of.",
  }),
  (r, topic) => ({
    text: `Which sentence best demonstrates correct use of ${topic}?`,
    ...choice(
      "She goes to school every day.",
      ["She go to school every day.", "She going to school every day.", "She gone school every day."],
      int(r, 0, 3),
    ),
    explanation: "Third person singular in the simple present takes -s/-es.",
  }),
];

const banglaFactories: Factory[] = [
  (r) => ({
    text: "'চন্দ্র' শব্দের সমার্থক শব্দ কোনটি?",
    ...choice("শশী", ["রবি", "ভানু", "দিবাকর"], int(r, 0, 3)),
    explanation: "শশী অর্থ চাঁদ; বাকিগুলো সূর্যের সমার্থক।",
  }),
  (r) => ({
    text: "'অগ্নিপরীক্ষা' বাগধারার অর্থ কী?",
    ...choice("কঠিন পরীক্ষা", ["সহজ কাজ", "উৎসব", "রান্নার কাজ"], int(r, 0, 3)),
    explanation: "'অগ্নিপরীক্ষা' মানে অত্যন্ত কঠিন পরীক্ষা।",
  }),
  (r, topic) => ({
    text: `${topic} — এই অংশে 'বই' শব্দটি কোন পদ?`,
    ...choice("বিশেষ্য", ["সর্বনাম", "ক্রিয়া", "বিশেষণ"], int(r, 0, 3)),
    explanation: "'বই' একটি বিশেষ্য পদ।",
  }),
];

const ictFactories: Factory[] = [
  (r) => {
    const n = int(r, 3, 15);
    return {
      text: `The decimal number ${n} in binary is:`,
      ...choice(
        n.toString(2),
        [(n + 1).toString(2), (n - 1).toString(2), (n * 2).toString(2)],
        int(r, 0, 3),
      ),
      explanation: `${n}₁₀ = ${n.toString(2)}₂.`,
    };
  },
  (r) => ({
    text: "HTTP stands for:",
    ...choice(
      "HyperText Transfer Protocol",
      ["HyperText Transmission Protocol", "HighText Transfer Protocol", "HyperTool Transfer Protocol"],
      int(r, 0, 3),
    ),
    explanation: "HTTP = HyperText Transfer Protocol.",
  }),
  (r, topic) => ({
    text: `Which practice best protects a user while working with ${topic}?`,
    ...choice(
      "Using long passwords with mixed characters",
      ["Using a birthdate as password", "Sharing passwords with friends", "Using 'password' as password"],
      int(r, 0, 3),
    ),
    explanation: "Length and character variety make a password hard to guess.",
  }),
];

/** Concept templates that work for ANY topic — keeps every paper full. */
const genericFactories: Factory[] = [
  (r, topic) => ({
    text: `Which of the following best defines "${topic}"?`,
    ...choice(
      `The core idea studied under ${topic} in this chapter`,
      [
        "An unrelated laboratory instrument",
        "A historical event with no syllabus link",
        "A grammatical rule of a foreign language",
      ],
      int(r, 0, 3),
    ),
    explanation: `${topic} is defined by the central concept introduced in this chapter.`,
  }),
  (r, topic, chapter) => ({
    text: `"${topic}" belongs to which chapter of the syllabus?`,
    ...choice(chapter, ["Practical Geometry", "Cyber Security", "Ecology"], int(r, 0, 3)),
    explanation: `${topic} is studied under the chapter "${chapter}".`,
  }),
  (r, topic) => ({
    text: `In an exam, which approach gives the best result for a "${topic}" question?`,
    ...choice(
      "Identify the given data, choose the right formula/rule, then solve step by step",
      ["Guess an option at random", "Copy from the previous question", "Skip the data given"],
      int(r, 0, 3),
    ),
    explanation: "Structured problem-solving avoids careless mistakes and earns full marks.",
  }),
  (r, topic) => ({
    text: `Which statement about ${topic} is FALSE?`,
    ...choice(
      "It has no relation to the rest of the chapter",
      [
        "It builds on earlier concepts of the chapter",
        "It appears frequently in board questions",
        "It can be applied to solve numerical or conceptual problems",
      ],
      int(r, 0, 3),
    ),
    explanation: `Every topic, including ${topic}, connects to the wider chapter.`,
  }),
];

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Figure-based MCQs — the learner must read a diagram to answer. */
const figureFactories: Factory[] = [
  (r) => {
    const b = int(r, 6, 16);
    const h = int(r, 5, 14);
    return {
      text: "চিত্রের ত্রিভুজটির ক্ষেত্রফল কত?",
      ...numeric((b * h) / 2, [b * h, b + h, (b * h) / 4], " বর্গসেমি"),
      explanation: `ক্ষেত্রফল = ½ × ${b} × ${h} = ${(b * h) / 2} বর্গসেমি।`,
      figure: {
        kind: "triangle",
        caption: "চিত্র: ABC ত্রিভুজ",
        labels: ["A", "B", "C", `b = ${b} cm`, `h = ${h} cm`],
      },
    };
  },
  (r) => {
    const v = int(r, 6, 24);
    const r1 = int(r, 2, 8);
    const r2 = int(r, 2, 8);
    return {
      text: "চিত্রের বর্তনীর তুল্য রোধ কত?",
      ...numeric(r1 + r2, [r1 * r2, Math.abs(r1 - r2), v], " Ω"),
      explanation: `শ্রেণি সমবায়ে R = R₁ + R₂ = ${r1} + ${r2} = ${r1 + r2} Ω।`,
      figure: {
        kind: "circuit",
        caption: "চিত্র: শ্রেণি সমবায়ে যুক্ত বর্তনী",
        labels: [`V = ${v} V`, `R₁ = ${r1} Ω`, `R₂ = ${r2} Ω`],
      },
    };
  },
  (r) => {
    const vals = [0, int(r, 4, 10), int(r, 12, 20), int(r, 22, 30), int(r, 32, 45)];
    return {
      text: "লেখচিত্র অনুযায়ী বস্তুটির গতি সম্পর্কে কোনটি সঠিক?",
      ...choice(
        "বেগ সময়ের সাথে বাড়ছে, অর্থাৎ বস্তুটি ত্বরিত",
        ["বস্তুটি স্থির", "বেগ কমছে", "বস্তুটি সমবেগে চলছে"],
        int(r, 0, 3),
      ),
      explanation: "লেখচিত্রের ঢাল ধনাত্মক, তাই ত্বরণ ধনাত্মক এবং বেগ বাড়ছে।",
      figure: {
        kind: "graph",
        caption: "চিত্র: বেগ–সময় লেখচিত্র",
        labels: ["time (s)", "v (m/s)"],
        values: vals,
      },
    };
  },
  (r) => ({
    text: "চিত্রে চিহ্নিত অঙ্গাণুটির প্রধান কাজ কী?",
    ...choice(
      "ATP তৈরি করে কোষে শক্তি সরবরাহ করা",
      ["প্রোটিন সংশ্লেষ বন্ধ করা", "কোষপ্রাচীর গঠন করা", "আলো শোষণ করে খাদ্য তৈরি"],
      int(r, 0, 3),
    ),
    explanation: "মাইটোকন্ড্রিয়া বায়বীয় শ্বসনে ATP তৈরি করে — তাই একে শক্তিঘর বলা হয়।",
    figure: {
      kind: "cell",
      caption: "চিত্র: প্রাণিকোষ (মাইটোকন্ড্রিয়া চিহ্নিত)",
      labels: ["নিউক্লিয়াস", "মাইটোকন্ড্রিয়া"],
    },
  }),
];

const bySubject: Record<string, Factory[]> = {
  math: [...mathFactories, figureFactories[0]],
  hmath: [...mathFactories, figureFactories[0]],
  physics: [...physicsFactories, figureFactories[1], figureFactories[2]],
  chem: chemFactories,
  bio: [...bioFactories, figureFactories[3]],
  english: englishFactories,
  bangla: banglaFactories,
  ict: ictFactories,
};

export type TopicPaperInput = {
  subjectId: string;
  chapterId: string;
  chapterName: string;
  topicId: string;
  topicName: string;
  count?: number;
};

/**
 * Generate a stable MCQ paper for one topic.
 * Different topic → different seed → different questions & ordering.
 */
export function getTopicQuestions({
  subjectId,
  chapterId,
  chapterName,
  topicId,
  topicName,
  count = 25,
}: TopicPaperInput): Question[] {
  const pool = [...(bySubject[subjectId] ?? []), ...genericFactories];
  const rnd = makeRng(`${subjectId}|${chapterId}|${topicId}`);
  const out: Question[] = [];
  const seen = new Set<string>();

  let guard = 0;
  while (out.length < count && guard < count * 12) {
    guard++;
    const factory = pool[Math.floor(rnd() * pool.length) % pool.length];
    const raw = factory(rnd, topicName, chapterName);
    if (seen.has(raw.text)) continue;
    seen.add(raw.text);
    const i = out.length;
    out.push({
      id: `${subjectId}-${chapterId}-${topicId}-${i + 1}`,
      subject: subjectId,
      topic: topicName,
      text: raw.text,
      options: raw.options,
      answer: raw.answer,
      explanation: raw.explanation,
      difficulty: i < count * 0.4 ? "easy" : i < count * 0.8 ? "medium" : "hard",
    });
  }

  // If duplicates limited the pool, pad by re-running factories with fresh numbers.
  while (out.length < count) {
    const factory = pool[out.length % pool.length];
    const raw = factory(rnd, topicName, chapterName);
    const i = out.length;
    out.push({
      id: `${subjectId}-${chapterId}-${topicId}-${i + 1}`,
      subject: subjectId,
      topic: topicName,
      text: raw.text,
      options: raw.options,
      answer: raw.answer,
      explanation: raw.explanation,
      difficulty: i < count * 0.4 ? "easy" : i < count * 0.8 ? "medium" : "hard",
    });
  }

  return out;
}
