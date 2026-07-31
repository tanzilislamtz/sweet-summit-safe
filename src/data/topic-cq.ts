import type { FigureSpec } from "./figures";

/**
 * Deterministic CQ (সৃজনশীল / creative question) generator.
 *
 * A CQ is NOT an MCQ: the learner reads a stimulus (উদ্দীপক) — often with a
 * figure — and then *writes* short answers to four graded sub-questions:
 *   ক (knowledge, 1)  খ (comprehension, 2)  গ (application, 3)  ঘ (higher skill, 4)
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
  /** ক / খ / গ / ঘ */
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
  /** উদ্দীপক — the stimulus paragraph. */
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

const LABELS = ["ক", "খ", "গ", "ঘ"] as const;
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
      stem: `একটি ${m} kg ভরের বস্তু ${u} m/s আদি বেগে যাত্রা শুরু করে এবং ${a} m/s² সুষম ত্বরণে ${t} সেকেন্ড চলে। নিচের লেখচিত্রে বস্তুটির বেগ–সময় সম্পর্ক দেখানো হয়েছে।`,
      figure: {
        kind: "graph",
        caption: `চিত্র: বস্তুটির বেগ–সময় লেখচিত্র (${topicless()})`,
        labels: ["time (s)", "v (m/s)"],
        values: [u, u + a, u + 2 * a, u + 3 * a, u + a * t],
      },
      parts: [
        {
          prompt: "ত্বরণ কাকে বলে?",
          modelAnswer:
            "একক সময়ে বেগের পরিবর্তনের হারকে ত্বরণ বলে। এর একক m/s² এবং এটি একটি ভেক্টর রাশি।",
          keywords: ["বেগের পরিবর্তনের হার", "m/s²", "ভেক্টর"],
          minWords: 12,
        },
        {
          prompt: "লেখচিত্রের ঢাল কী নির্দেশ করে — ব্যাখ্যা করো।",
          modelAnswer:
            "বেগ–সময় লেখচিত্রের ঢাল = বেগের পরিবর্তন ÷ সময়, অর্থাৎ ত্বরণ। ঢাল ধ্রুবক হলে ত্বরণ সুষম, আর লেখের নিচের ক্ষেত্রফল অতিক্রান্ত দূরত্ব নির্দেশ করে।",
          keywords: ["ঢাল", "ত্বরণ", "ক্ষেত্রফল", "দূরত্ব"],
          minWords: 25,
        },
        {
          prompt: `${t} সেকেন্ড পরে বস্তুটির বেগ নির্ণয় করো।`,
          modelAnswer: `v = u + at = ${u} + ${a}×${t} = ${v} m/s। অতএব ${t} s পরে বেগ ${v} m/s।`,
          keywords: ["v = u + at", `${v}`],
          minWords: 15,
        },
        {
          prompt: "ভর দ্বিগুণ হলে একই বল প্রয়োগে গতির কী পরিবর্তন হবে — গাণিতিক যুক্তিসহ মতামত দাও।",
          modelAnswer: `F = ma অনুসারে বল ধ্রুবক রেখে ভর দ্বিগুণ করলে ত্বরণ অর্ধেক হবে (a′ = ${a}/2 = ${(a / 2).toFixed(1)} m/s²)। ফলে একই সময়ে অর্জিত বেগ ও অতিক্রান্ত দূরত্ব দুটোই কমে যাবে — অর্থাৎ ভারী বস্তুর গতি পরিবর্তন করা কঠিন, যা জড়তার ধারণা সমর্থন করে।`,
          keywords: ["F = ma", "ত্বরণ অর্ধেক", "জড়তা"],
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
      stem: `একটি বর্তনীতে ${v} V উৎসের সাথে R₁ = ${r1} Ω ও R₂ = ${r2} Ω রোধ দুটি শ্রেণিতে যুক্ত করা হয়েছে।`,
      figure: {
        kind: "circuit",
        caption: "চিত্র: শ্রেণি সমবায়ে যুক্ত রোধসহ বর্তনী",
        labels: [`V = ${v} V`, `R₁ = ${r1} Ω`, `R₂ = ${r2} Ω`],
      },
      parts: [
        {
          prompt: "রোধ কাকে বলে?",
          modelAnswer:
            "পরিবাহীর যে ধর্মের জন্য এর মধ্য দিয়ে তড়িৎ প্রবাহ বাধাপ্রাপ্ত হয় তাকে রোধ বলে; একক ওহম (Ω)।",
          keywords: ["বাধা", "ওহম", "Ω"],
          minWords: 12,
        },
        {
          prompt: "ওহমের সূত্রটি ব্যাখ্যা করো।",
          modelAnswer:
            "নির্দিষ্ট তাপমাত্রায় পরিবাহীর দুই প্রান্তের বিভব পার্থক্য V, প্রবাহ I-এর সমানুপাতিক; V = IR, যেখানে R রোধ ধ্রুবক।",
          keywords: ["V = IR", "সমানুপাতিক", "তাপমাত্রা"],
          minWords: 25,
        },
        {
          prompt: "বর্তনীর তুল্য রোধ ও প্রবাহ নির্ণয় করো।",
          modelAnswer: `শ্রেণিতে R = R₁ + R₂ = ${r1} + ${r2} = ${series} Ω। I = V/R = ${v}/${series} = ${(v / series).toFixed(2)} A।`,
          keywords: [`${series}`, "I = V/R"],
          minWords: 15,
        },
        {
          prompt: "রোধ দুটি সমান্তরালে যুক্ত করলে প্রবাহের কী পরিবর্তন হবে — বিশ্লেষণ করো।",
          modelAnswer: `সমান্তরালে 1/R = 1/${r1} + 1/${r2} → R = ${( (r1 * r2) / (r1 + r2) ).toFixed(2)} Ω, যা শ্রেণির চেয়ে অনেক কম। রোধ কমায় I = V/R অনুসারে প্রবাহ বেড়ে ${(v / ((r1 * r2) / (r1 + r2))).toFixed(2)} A হবে। তাই গৃহস্থালিতে সমান্তরাল সংযোগ ব্যবহৃত হয়, যাতে প্রতিটি যন্ত্র পূর্ণ বিভব পায়।`,
          keywords: ["সমান্তরাল", "রোধ কম", "প্রবাহ বৃদ্ধি"],
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
      stem: `ABC ত্রিভুজের ভূমি AB = ${b} সেমি এবং উচ্চতা CD = ${h} সেমি। নিচের চিত্রে ত্রিভুজটি দেখানো হলো।`,
      figure: {
        kind: "triangle",
        caption: "চিত্র: ABC ত্রিভুজ",
        labels: ["A", "B", "C", `b = ${b} cm`, `h = ${h} cm`],
      },
      parts: [
        {
          prompt: "ত্রিভুজের ক্ষেত্রফলের সূত্রটি লেখো।",
          modelAnswer: "ক্ষেত্রফল = ½ × ভূমি × উচ্চতা।",
          keywords: ["½", "ভূমি", "উচ্চতা"],
          minWords: 8,
        },
        {
          prompt: "ত্রিভুজের তিন কোণের সমষ্টি ১৮০° — যুক্তি দিয়ে ব্যাখ্যা করো।",
          modelAnswer:
            "একটি বাহুর সমান্তরাল রেখা টানলে বিপরীত কোণ ও একান্তর কোণের সমতা থেকে তিন কোণ একটি সরলরেখায় বসে, তাই সমষ্টি এক সরলকোণ অর্থাৎ ১৮০°।",
          keywords: ["সমান্তরাল", "একান্তর কোণ", "সরলকোণ", "১৮০"],
          minWords: 25,
        },
        {
          prompt: "ত্রিভুজটির ক্ষেত্রফল নির্ণয় করো।",
          modelAnswer: `ক্ষেত্রফল = ½ × ${b} × ${h} = ${(b * h) / 2} বর্গসেমি।`,
          keywords: [`${(b * h) / 2}`, "বর্গসেমি"],
          minWords: 10,
        },
        {
          prompt: "উচ্চতা দ্বিগুণ ও ভূমি অর্ধেক করলে ক্ষেত্রফলের পরিবর্তন বিশ্লেষণ করো।",
          modelAnswer: `নতুন ক্ষেত্রফল = ½ × (${b}/2) × (2×${h}) = ${(b * h) / 2} বর্গসেমি — অর্থাৎ অপরিবর্তিত। কারণ ক্ষেত্রফল ভূমি ও উচ্চতার গুণফলের সমানুপাতিক; একটিকে অর্ধেক ও অন্যটিকে দ্বিগুণ করলে গুণফল একই থাকে।`,
          keywords: ["অপরিবর্তিত", "গুণফল", "সমানুপাতিক"],
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
      stem: `একটি বিকারে ${mol} মোল HCl দ্রবণ নেওয়া হলো এবং তাতে সমপরিমাণ NaOH যোগ করা হলো।`,
      figure: {
        kind: "beaker",
        caption: "চিত্র: প্রশমন বিক্রিয়ার সেটআপ",
        labels: [`${mol} mol HCl`, "+ NaOH"],
      },
      parts: [
        {
          prompt: "প্রশমন বিক্রিয়া কাকে বলে?",
          modelAnswer: "অ্যাসিড ও ক্ষারের বিক্রিয়ায় লবণ ও পানি উৎপন্ন হওয়ার প্রক্রিয়াকে প্রশমন বিক্রিয়া বলে।",
          keywords: ["অ্যাসিড", "ক্ষার", "লবণ", "পানি"],
          minWords: 10,
        },
        {
          prompt: "মোল ধারণাটি ব্যাখ্যা করো।",
          modelAnswer:
            "১ মোল = ৬.০২২×১০²³ টি কণা (অ্যাভোগাড্রো সংখ্যা), যা পদার্থের আণবিক ভরের সমান গ্রাম পরিমাণে থাকে।",
          keywords: ["৬.০২২", "অ্যাভোগাড্রো", "আণবিক ভর"],
          minWords: 20,
        },
        {
          prompt: `${mol} মোল HCl-এ কতটি অণু আছে নির্ণয় করো।`,
          modelAnswer: `অণুর সংখ্যা = ${mol} × ৬.০২২×১০²³ = ${(mol * 6.022).toFixed(3)}×১০²³ টি।`,
          keywords: ["৬.০২২", `${mol}`],
          minWords: 12,
        },
        {
          prompt: "বিক্রিয়া শেষে দ্রবণের pH কেমন হবে — যুক্তিসহ মতামত দাও।",
          modelAnswer:
            "সমপরিমাণ শক্তিশালী অ্যাসিড ও শক্তিশালী ক্ষার সম্পূর্ণ প্রশমিত হয়ে NaCl ও H₂O দেয়, তাই দ্রবণ নিরপেক্ষ, pH ≈ ৭। NaOH বেশি হলে pH > ৭ এবং HCl বেশি হলে pH < ৭ হতো।",
          keywords: ["pH ৭", "নিরপেক্ষ", "NaCl"],
          minWords: 35,
        },
      ],
    };
  },
];

const bioFactories: Factory[] = [
  () => ({
    stem: "নিচের চিত্রে একটি প্রাণিকোষের গঠন দেখানো হয়েছে। কোষটির বিভিন্ন অঙ্গাণু বিপাকীয় কাজে অংশ নেয়।",
    figure: {
      kind: "cell",
      caption: "চিত্র: প্রাণিকোষের গঠন",
      labels: ["নিউক্লিয়াস", "মাইটোকন্ড্রিয়া"],
    },
    parts: [
      {
        prompt: "কোষ কাকে বলে?",
        modelAnswer: "জীবদেহের গঠন ও কাজের ক্ষুদ্রতম একককে কোষ বলে।",
        keywords: ["গঠন", "একক"],
        minWords: 8,
      },
      {
        prompt: "মাইটোকন্ড্রিয়াকে কোষের শক্তিঘর বলা হয় কেন — ব্যাখ্যা করো।",
        modelAnswer:
          "মাইটোকন্ড্রিয়ায় বায়বীয় শ্বসনের মাধ্যমে গ্লুকোজ জারিত হয়ে ATP তৈরি হয়, যা কোষের সব কাজে শক্তি সরবরাহ করে — তাই একে শক্তিঘর বলা হয়।",
        keywords: ["ATP", "শ্বসন", "শক্তি"],
        minWords: 22,
      },
      {
        prompt: "চিত্রের চিহ্নিত অঙ্গাণুটির গঠন ও কাজ বর্ণনা করো।",
        modelAnswer:
          "নিউক্লিয়াস দ্বিস্তরী পর্দা, নিউক্লিওপ্লাজম, নিউক্লিওলাস ও ক্রোমাটিন জালিকা নিয়ে গঠিত। এটি বংশগতির বাহক DNA ধারণ করে এবং কোষের সব কাজ নিয়ন্ত্রণ করে।",
        keywords: ["দ্বিস্তরী পর্দা", "DNA", "নিয়ন্ত্রণ"],
        minWords: 30,
      },
      {
        prompt: "উদ্ভিদকোষ ও প্রাণিকোষের পার্থক্য বিশ্লেষণ করে মতামত দাও।",
        modelAnswer:
          "উদ্ভিদকোষে কোষপ্রাচীর, প্লাস্টিড ও বড় কোষগহ্বর থাকে যা প্রাণিকোষে নেই; আবার প্রাণিকোষে সেন্ট্রিওল থাকে। এ পার্থক্যই উদ্ভিদকে খাদ্য প্রস্তুতে (সালোকসংশ্লেষণ) এবং প্রাণীকে চলনক্ষম হতে সাহায্য করে।",
        keywords: ["কোষপ্রাচীর", "প্লাস্টিড", "সেন্ট্রিওল", "সালোকসংশ্লেষণ"],
        minWords: 40,
      },
    ],
  }),
];

const ictFactories: Factory[] = [
  (r) => {
    const n = int(r, 9, 60);
    return {
      stem: `রাফি একটি ডিজিটাল ডিভাইসে ${n} সংখ্যাটি ইনপুট দিলে ডিভাইসটি তা বাইনারিতে রূপান্তর করে প্রদর্শন করে।`,
      parts: [
        {
          prompt: "বাইনারি সংখ্যা পদ্ধতি কী?",
          modelAnswer: "যে সংখ্যা পদ্ধতিতে কেবল ০ ও ১ ব্যবহার করা হয় এবং ভিত্তি ২, তাকে বাইনারি পদ্ধতি বলে।",
          keywords: ["০", "১", "ভিত্তি ২"],
          minWords: 10,
        },
        {
          prompt: "কম্পিউটার বাইনারি ব্যবহার করে কেন — ব্যাখ্যা করো।",
          modelAnswer:
            "ইলেকট্রনিক বর্তনীর দুটি স্থিতিশীল অবস্থা (অন/অফ, উচ্চ/নিম্ন ভোল্টেজ) থাকায় দুই অঙ্কের বাইনারি সবচেয়ে নির্ভরযোগ্য ও ত্রুটিমুক্তভাবে উপস্থাপন করা যায়।",
          keywords: ["অন/অফ", "ভোল্টেজ", "নির্ভরযোগ্য"],
          minWords: 25,
        },
        {
          prompt: `${n} দশমিক সংখ্যাটিকে বাইনারিতে রূপান্তর করো।`,
          modelAnswer: `ক্রমাগত ২ দিয়ে ভাগ করে ভাগশেষ নিচ থেকে উপরে সাজিয়ে পাই ${n}₁₀ = ${n.toString(2)}₂।`,
          keywords: [n.toString(2), "ভাগশেষ"],
          minWords: 15,
        },
        {
          prompt: "ডিজিটাল ডিভাইসে তথ্য নিরাপত্তা রক্ষায় করণীয় বিশ্লেষণ করো।",
          modelAnswer:
            "শক্তিশালী দীর্ঘ পাসওয়ার্ড, দুই-ধাপ যাচাই, নিয়মিত সফটওয়্যার হালনাগাদ, অজানা লিংক এড়িয়ে চলা ও ব্যাকআপ রাখা — এগুলো তথ্য চুরি ও ম্যালওয়্যার থেকে রক্ষা করে।",
          keywords: ["পাসওয়ার্ড", "দুই-ধাপ", "হালনাগাদ", "ব্যাকআপ"],
          minWords: 35,
        },
      ],
    };
  },
];

/** Works for any subject/topic — keeps every CQ paper full. */
const genericFactories: Factory[] = [
  (_r, topic, chapter) => ({
    stem: `শ্রেণিকক্ষে শিক্ষক "${chapter}" অধ্যায়ের "${topic}" অংশটি আলোচনা করছিলেন। তিনি বললেন, এই ধারণাটি বুঝতে পারলে অধ্যায়ের বাকি সমস্যাগুলোও সহজ হয়ে যায়।`,
    parts: [
      {
        prompt: `${topic} কাকে বলে?`,
        modelAnswer: `"${topic}" হলো "${chapter}" অধ্যায়ের সেই মূল ধারণা, যার সংজ্ঞা ও বৈশিষ্ট্য পাঠ্যবইয়ে নির্দিষ্টভাবে উল্লেখ আছে।`,
        keywords: [topic, "সংজ্ঞা"],
        minWords: 10,
      },
      {
        prompt: `${topic}-এর গুরুত্ব ব্যাখ্যা করো।`,
        modelAnswer: `${topic} ছাড়া ${chapter} অধ্যায়ের পরবর্তী ধারণাগুলো প্রয়োগ করা যায় না; বোর্ড পরীক্ষায়ও এখান থেকে নিয়মিত প্রশ্ন আসে বলে এটি ভিত্তি হিসেবে কাজ করে।`,
        keywords: [topic, "ভিত্তি", "প্রয়োগ"],
        minWords: 22,
      },
      {
        prompt: `উদ্দীপকে উল্লিখিত ধারণাটি ব্যবহার করে একটি সমস্যা সমাধানের ধাপগুলো দেখাও।`,
        modelAnswer:
          "প্রথমে প্রদত্ত তথ্য চিহ্নিত করতে হবে, এরপর প্রযোজ্য সূত্র/নিয়ম নির্বাচন করে ধাপে ধাপে মান বসিয়ে হিসাব করতে হবে এবং শেষে একক ও যৌক্তিকতা যাচাই করতে হবে।",
        keywords: ["তথ্য", "সূত্র", "ধাপে ধাপে", "একক"],
        minWords: 30,
      },
      {
        prompt: `${topic} অধ্যায়ের অন্যান্য ধারণার সাথে কীভাবে সম্পর্কিত — বিশ্লেষণ করে মতামত দাও।`,
        modelAnswer: `${topic} একদিকে পূর্ববর্তী ধারণার উপর দাঁড়িয়ে আছে, অন্যদিকে পরবর্তী প্রয়োগভিত্তিক সমস্যার ভিত্তি তৈরি করে। তাই এটি বিচ্ছিন্নভাবে নয়, ${chapter} অধ্যায়ের ধারাবাহিক অংশ হিসেবে পড়াই যৌক্তিক।`,
        keywords: [chapter, "সম্পর্ক", "ধারাবাহিক"],
        minWords: 40,
      },
    ],
  }),
];

function topicless() {
  return "বেগ বনাম সময়";
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
