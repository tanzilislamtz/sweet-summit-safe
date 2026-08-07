import type { FigureSpec } from "./figures";

/**
 * Deterministic CQ (creative question) generator.
 *
 * A CQ is NOT an MCQ: the learner reads a stimulus — often with a
 * figure — and then *writes* short answers to four graded sub-questions:
 *   a (knowledge, 1)  b (comprehension, 2)  c (application, 3)  d (higher skill, 4)
 *
 * The same (subject, chapter, topic) triple always yields the same paper, so a
 * learner's written drafts stay attached to the right question between visits.
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
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

const int = (rnd: () => number, min: number, max: number) =>
  min + Math.floor(rnd() * (max - min + 1));

// --- public types ------------------------------------------------------------

export type CqPart = {
  /** a / b / c / d */
  label: string;
  level: "Knowledge" | "Comprehension" | "Application" | "Higher skill";
  marks: number;
  prompt: string;
  /** Model answer shown after the learner writes their own. */
  modelAnswer: string;
  /** Keywords an examiner looks for — used for self-assessment. */
  keywords: string[];
  /** Suggested minimum words for a full-mark answer. */
  minWords: number;
};

export type CqQuestion = {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  /** Stimulus — the prompt paragraph. */
  stem: string;
  figure?: FigureSpec;
  parts: CqPart[];
  totalMarks: number;
};

type Blueprint = {
  stem: string;
  figure?: FigureSpec;
  parts: Array<Omit<CqPart, "label" | "level" | "marks">>;
};

type Factory = (rnd: () => number, topic: string, chapter: string) => Blueprint;

const LABELS = ["a", "b", "c", "d"] as const;
const LEVELS: CqPart["level"][] = ["Knowledge", "Comprehension", "Application", "Higher skill"];
const MARKS = [1, 2, 3, 4];

// --- subject factories -------------------------------------------------------

const physicsFactories: Factory[] = [
  (r) => {
    const m = int(r, 2, 10);
    const u = int(r, 0, 5);
    const a = int(r, 2, 6);
    const t = int(r, 3, 8);
    const v = u + a * t;
    return {
      stem: `A body of mass ${m} kg starts with an initial velocity of ${u} m/s and moves with a uniform acceleration of ${a} m/s² for ${t} seconds. The graph below shows the body's velocity–time relationship.`,
      figure: {
        kind: "graph",
        caption: `Figure: velocity–time graph of the body (${topicless()})`,
        labels: ["time (s)", "v (m/s)"],
        values: [u, u + a, u + 2 * a, u + 3 * a, u + a * t],
      },
      parts: [
        {
          prompt: "What is acceleration?",
          modelAnswer:
            "The rate of change of velocity per unit time is called acceleration. Its unit is m/s² and it is a vector quantity.",
          keywords: ["rate of change of velocity", "m/s²", "vector"],
          minWords: 12,
        },
        {
          prompt: "What does the slope of the graph indicate — explain.",
          modelAnswer:
            "The slope of a velocity–time graph = change in velocity ÷ time, i.e., acceleration. A constant slope means uniform acceleration, and the area under the graph indicates the distance travelled.",
          keywords: ["slope", "acceleration", "area", "distance"],
          minWords: 25,
        },
        {
          prompt: `Find the velocity of the body after ${t} seconds.`,
          modelAnswer: `v = u + at = ${u} + ${a}×${t} = ${v} m/s. So after ${t} s the velocity is ${v} m/s.`,
          keywords: ["v = u + at", `${v}`],
          minWords: 15,
        },
        {
          prompt: "If the mass is doubled, what change occurs in the motion under the same applied force — give your opinion with mathematical reasoning.",
          modelAnswer: `According to F = ma, keeping the force constant while doubling the mass halves the acceleration (a′ = ${a}/2 = ${(a / 2).toFixed(1)} m/s²). As a result, both the velocity gained and the distance travelled in the same time will decrease — that is, it is harder to change the motion of a heavier body, which supports the concept of inertia.`,
          keywords: ["F = ma", "acceleration halved", "inertia"],
          minWords: 40,
        },
      ],
    };
  },
  (r) => {
    const v = int(r, 6, 24);
    const r1 = int(r, 2, 8);
    const r2 = int(r, 2, 8);
    const series = r1 + r2;
    return {
      stem: `In a circuit, resistors R₁ = ${r1} Ω and R₂ = ${r2} Ω are connected in series with a ${v} V source.`,
      figure: {
        kind: "circuit",
        caption: "Figure: circuit with resistors connected in series",
        labels: [`V = ${v} V`, `R₁ = ${r1} Ω`, `R₂ = ${r2} Ω`],
      },
      parts: [
        {
          prompt: "What is resistance?",
          modelAnswer:
            "The property of a conductor due to which electric current is opposed while passing through it is called resistance; its unit is ohm (Ω).",
          keywords: ["opposition", "ohm", "Ω"],
          minWords: 12,
        },
        {
          prompt: "Explain Ohm's law.",
          modelAnswer:
            "At a constant temperature, the potential difference V across the ends of a conductor is proportional to the current I; V = IR, where R (resistance) is constant.",
          keywords: ["V = IR", "proportional", "temperature"],
          minWords: 25,
        },
        {
          prompt: "Find the equivalent resistance and current of the circuit.",
          modelAnswer: `In series, R = R₁ + R₂ = ${r1} + ${r2} = ${series} Ω. I = V/R = ${v}/${series} = ${(v / series).toFixed(2)} A.`,
          keywords: [`${series}`, "I = V/R"],
          minWords: 15,
        },
        {
          prompt: "If the resistors were connected in parallel instead, what change would occur in the current — analyse.",
          modelAnswer: `In parallel, 1/R = 1/${r1} + 1/${r2} → R = ${( (r1 * r2) / (r1 + r2) ).toFixed(2)} Ω, which is much lower than in series. As resistance decreases, by I = V/R the current increases to ${(v / ((r1 * r2) / (r1 + r2))).toFixed(2)} A. That is why parallel connections are used in households, so that every appliance gets the full voltage.`,
          keywords: ["parallel", "lower resistance", "current increase"],
          minWords: 40,
        },
      ],
    };
  },
];

const mathFactories: Factory[] = [
  (r) => {
    const b = int(r, 6, 16);
    const h = int(r, 5, 14);
    return {
      stem: `Triangle ABC has base AB = ${b} cm and height CD = ${h} cm. The triangle is shown in the figure below.`,
      figure: {
        kind: "triangle",
        caption: "Figure: triangle ABC",
        labels: ["A", "B", "C", `b = ${b} cm`, `h = ${h} cm`],
      },
      parts: [
        {
          prompt: "Write the formula for the area of a triangle.",
          modelAnswer: "Area = ½ × base × height.",
          keywords: ["½", "base", "height"],
          minWords: 8,
        },
        {
          prompt: "The sum of the three angles of a triangle is 180° — explain with reasoning.",
          modelAnswer:
            "Drawing a line parallel to one side, the equality of corresponding angles and alternate angles shows that the three angles lie along a straight line, so their sum equals a straight angle, i.e., 180°.",
          keywords: ["parallel", "alternate angle", "straight angle", "180"],
          minWords: 25,
        },
        {
          prompt: "Find the area of the triangle.",
          modelAnswer: `Area = ½ × ${b} × ${h} = ${(b * h) / 2} sq. cm.`,
          keywords: [`${(b * h) / 2}`, "sq. cm"],
          minWords: 10,
        },
        {
          prompt: "Analyse the change in area if the height is doubled and the base is halved.",
          modelAnswer: `New area = ½ × (${b}/2) × (2×${h}) = ${(b * h) / 2} sq. cm — i.e., unchanged. This is because area is proportional to the product of base and height; halving one and doubling the other keeps the product the same.`,
          keywords: ["unchanged", "product", "proportional"],
          minWords: 35,
        },
      ],
    };
  },
];

const chemFactories: Factory[] = [
  (r) => {
    const mol = int(r, 1, 4);
    return {
      stem: `A beaker contains ${mol} mol of HCl solution, to which an equal amount of NaOH is added.`,
      figure: {
        kind: "beaker",
        caption: "Figure: neutralisation reaction setup",
        labels: [`${mol} mol HCl`, "+ NaOH"],
      },
      parts: [
        {
          prompt: "What is a neutralisation reaction?",
          modelAnswer: "The process in which an acid reacts with a base to produce a salt and water is called a neutralisation reaction.",
          keywords: ["acid", "base", "salt", "water"],
          minWords: 10,
        },
        {
          prompt: "Explain the concept of the mole.",
          modelAnswer:
            "1 mole = 6.022×10²³ particles (Avogadro's number), which is present in an amount of grams equal to the substance's molecular mass.",
          keywords: ["6.022", "Avogadro", "molecular mass"],
          minWords: 20,
        },
        {
          prompt: `Find the number of molecules present in ${mol} mole of HCl.`,
          modelAnswer: `Number of molecules = ${mol} × 6.022×10²³ = ${(mol * 6.022).toFixed(3)}×10²³.`,
          keywords: ["6.022", `${mol}`],
          minWords: 12,
        },
        {
          prompt: "What will be the pH of the solution after the reaction — give your opinion with reasoning.",
          modelAnswer:
            "Equal amounts of a strong acid and a strong base are completely neutralised, producing NaCl and H₂O, so the solution is neutral, pH ≈ 7. If NaOH were in excess pH > 7, and if HCl were in excess pH < 7.",
          keywords: ["pH 7", "neutral", "NaCl"],
          minWords: 35,
        },
      ],
    };
  },
];

const bioFactories: Factory[] = [
  () => ({
    stem: "The figure below shows the structure of an animal cell. The cell's various organelles take part in metabolic activities.",
    figure: {
      kind: "cell",
      caption: "Figure: structure of an animal cell",
      labels: ["Nucleus", "Mitochondria"],
    },
    parts: [
      {
        prompt: "What is a cell?",
        modelAnswer: "The smallest structural and functional unit of a living organism is called a cell.",
        keywords: ["structure", "unit"],
        minWords: 8,
      },
      {
        prompt: "Why is the mitochondrion called the powerhouse of the cell — explain.",
        modelAnswer:
          "In the mitochondrion, glucose is oxidised through aerobic respiration to produce ATP, which supplies energy for all the cell's activities — hence it is called the powerhouse.",
        keywords: ["ATP", "respiration", "energy"],
        minWords: 22,
      },
      {
        prompt: "Describe the structure and function of the labelled organelle in the figure.",
        modelAnswer:
          "The nucleus is made up of a double-layered membrane, nucleoplasm, nucleolus, and chromatin network. It contains the hereditary carrier DNA and controls all the cell's activities.",
        keywords: ["double-layered membrane", "DNA", "control"],
        minWords: 30,
      },
      {
        prompt: "Analyse the difference between plant cells and animal cells and give your opinion.",
        modelAnswer:
          "Plant cells have a cell wall, plastids, and a large vacuole, which animal cells lack; animal cells, in turn, have centrioles. This difference helps plants prepare food (photosynthesis) and helps animals move around.",
        keywords: ["cell wall", "plastid", "centriole", "photosynthesis"],
        minWords: 40,
      },
    ],
  }),
];

const ictFactories: Factory[] = [
  (r) => {
    const n = int(r, 9, 60);
    return {
      stem: `Rafi inputs the number ${n} into a digital device, and the device converts it to binary and displays it.`,
      parts: [
        {
          prompt: "What is the binary number system?",
          modelAnswer: "The number system that uses only 0 and 1, with base 2, is called the binary system.",
          keywords: ["0", "1", "base 2"],
          minWords: 10,
        },
        {
          prompt: "Why does a computer use binary — explain.",
          modelAnswer:
            "Since electronic circuits have two stable states (on/off, high/low voltage), the two-digit binary system can be represented most reliably and error-free.",
          keywords: ["on/off", "voltage", "reliable"],
          minWords: 25,
        },
        {
          prompt: `Convert the decimal number ${n} into binary.`,
          modelAnswer: `Dividing repeatedly by 2 and arranging the remainders from bottom to top, we get ${n}₁₀ = ${n.toString(2)}₂.`,
          keywords: [n.toString(2), "remainder"],
          minWords: 15,
        },
        {
          prompt: "Analyse what should be done to protect information security on digital devices.",
          modelAnswer:
            "Strong long passwords, two-step verification, regular software updates, avoiding unknown links, and keeping backups — these protect against data theft and malware.",
          keywords: ["password", "two-step", "update", "backup"],
          minWords: 35,
        },
      ],
    };
  },
];

/** Works for any subject/topic — keeps every CQ paper full. */
const genericFactories: Factory[] = [
  (_r, topic, chapter) => ({
    stem: `In the classroom, the teacher was discussing the "${topic}" section of the "${chapter}" chapter. She said that understanding this concept makes the rest of the chapter's problems easier too.`,
    parts: [
      {
        prompt: `What is ${topic}?`,
        modelAnswer: `"${topic}" is the core concept of the "${chapter}" chapter, whose definition and characteristics are specifically mentioned in the textbook.`,
        keywords: [topic, "definition"],
        minWords: 10,
      },
      {
        prompt: `Explain the importance of ${topic}.`,
        modelAnswer: `Without ${topic}, the subsequent concepts of the ${chapter} chapter cannot be applied; since board exam questions also come from here regularly, it serves as a foundation.`,
        keywords: [topic, "foundation", "application"],
        minWords: 22,
      },
      {
        prompt: `Using the concept mentioned in the stimulus, show the steps to solve a problem.`,
        modelAnswer:
          "First, identify the given data, then select the applicable formula/rule and calculate step by step by substituting values, and finally check the unit and reasonableness.",
        keywords: ["data", "formula", "step by step", "unit"],
        minWords: 30,
      },
      {
        prompt: `How is ${topic} related to other concepts of the chapter — analyse and give your opinion.`,
        modelAnswer: `${topic} on one hand builds on earlier concepts, and on the other hand forms the basis for subsequent application-based problems. So it should be studied not in isolation, but as a continuous part of the ${chapter} chapter.`,
        keywords: [chapter, "relation", "continuous"],
        minWords: 40,
      },
    ],
  }),
];

function topicless() {
  return "velocity vs. time";
}

const bySubject: Record<string, Factory[]> = {
  physics: physicsFactories,
  math: mathFactories,
  hmath: mathFactories,
  chem: chemFactories,
  bio: bioFactories,
  ict: ictFactories,
};

export type CqPaperInput = {
  subjectId: string;
  chapterId: string;
  chapterName: string;
  topicId: string;
  topicName: string;
  count?: number;
};

/** Generate a stable written CQ paper for one topic. */
export function getTopicCqQuestions({
  subjectId,
  chapterId,
  chapterName,
  topicId,
  topicName,
  count = 6,
}: CqPaperInput): CqQuestion[] {
  const pool = [...(bySubject[subjectId] ?? []), ...genericFactories];
  const rnd = makeRng(`cq|${subjectId}|${chapterId}|${topicId}`);
  const out: CqQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const factory = pool[Math.floor(rnd() * pool.length) % pool.length];
    const bp = factory(rnd, topicName, chapterName);
    out.push({
      id: `cq-${subjectId}-${chapterId}-${topicId}-${i + 1}`,
      subject: subjectId,
      chapter: chapterName,
      topic: topicName,
      stem: bp.stem,
      figure: bp.figure,
      parts: bp.parts.slice(0, 4).map((p, pi) => ({
        ...p,
        label: LABELS[pi],
        level: LEVELS[pi],
        marks: MARKS[pi],
      })),
      totalMarks: 10,
    });
  }

  return out;
}
