export type Role = "tutor" | "student" | "guest";
export type Kind = "learning" | "question" | "seeking-tutor" | "offering-tutor" | "seeking-student";

export type PostData = {
  id: string;
  author: string;
  role: Role;
  handle: string;
  time: string;
  title: string;
  body: string;
  tag: string;
  tags?: string[];
  stats: { likes: number; comments: number; shares: number };
  verified?: boolean;
  media?: boolean;
  mediaUrl?: string;
  kind: Kind;
  meta?: { label: string; value: string }[];
};

export const posts: PostData[] = [
  {
    id: "lily-baba-convo",
    author: "SOJIB KHAN",
    role: "student",
    handle: "Verified Student",
    time: "10 days ago",
    verified: true,
    kind: "learning",
    title: "A Conversation Between Lily and Her Father",
    body: "Lily: Hello, Baba!\nBaba: Lily? How are you?\nLily: Fine, Baba. I just got my exam result. I've got an A in my English test!\nBaba: That's wonderful, my dear. I'm so proud of you.\n\nLily: Thank you, Baba. I studied hard for it. The reading section was tricky, but I managed to answer everything.\nBaba: Hard work always pays off. Keep going, and never lose that curiosity of yours.",
    tag: "Learning Content",
    stats: { likes: 214, comments: 36, shares: 11 },
  },
  {
    id: "light-bend-water",
    author: "Tania Rahman",
    role: "student",
    handle: "@tania.q",
    time: "1h · Public",
    kind: "question",
    title: "Why does light bend when it enters water from air?",
    body: "Physics class 10 is teaching refraction, but I don't properly understand the mathematical reason for the bending. Can someone explain Snell's law in simple terms?\n\nThe book only gives the formula — n1 sinθ1 = n2 sinθ2 — but I want to know why this happens and what's physically going on.",
    tag: "Physics · Refraction",
    tags: ["Class 10", "Optics"],
    stats: { likes: 87, comments: 24, shares: 5 },
  },
  {
    id: "alia-free-math",
    author: "Alia Bhatt",
    role: "tutor",
    handle: "@alia.tutors",
    time: "2h · Public",
    verified: true,
    kind: "offering-tutor",
    title: "Free doubt-solving session tonight — Class 9 & 10 Math",
    body: "Free doubt-solving session tonight at 9 PM. Bring any question — Algebra, Geometry, Trigonometry. The Zoom link will be posted in the comments.\n\nA 45-minute session, with 5 minutes of 1:1 time at the end for anyone with a personal doubt.",
    tag: "Class 9-10 Math",
    meta: [
      { label: "Subject", value: "Mathematics" },
      { label: "Class", value: "9 – 10" },
      { label: "Mode", value: "Online · Zoom" },
      { label: "Fee", value: "Free tonight" },
    ],
    stats: { likes: 328, comments: 42, shares: 18 },
  },
  {
    id: "imran-chem-tutor",
    author: "Imran Hossain",
    role: "student",
    handle: "@imran.hsc",
    time: "3h · Public",
    kind: "seeking-tutor",
    title: "Need a Chemistry tutor for HSC — Dhanmondi area",
    body: "I'm in HSC 2nd year and weak in Chemistry 2nd paper. Three days a week, preferably after 5 PM, would work well. Either home tuition or nearby coaching is fine.\n\nI have an English medium background, so I'm comfortable in both Bangla and English.",
    tag: "HSC · Chemistry",
    tags: ["Dhanmondi", "Home Tuition"],
    meta: [
      { label: "Subject", value: "Chemistry" },
      { label: "Level", value: "HSC 2nd Yr" },
      { label: "Location", value: "Dhanmondi" },
      { label: "Budget", value: "৳4–6k/mo" },
    ],
    stats: { likes: 96, comments: 31, shares: 7 },
  },
  {
    id: "nabila-butterfly",
    author: "Nabila Chowdhury",
    role: "student",
    handle: "@nabila.bio",
    time: "4h · Public",
    kind: "learning",
    title: "Butterfly on marigold — captured for my Biology assignment",
    body: "Field notes for chapter 7 (Pollination). Any tips on identifying this species? Guessing it's a Plain Tiger.",
    tag: "Biology · Class 10",
    stats: { likes: 512, comments: 88, shares: 24 },
    mediaUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1200&auto=format&fit=crop",
  },
  {
    id: "rafi-weekend-batch",
    author: "Rafi Islam",
    role: "tutor",
    handle: "@rafi.stem",
    time: "6h · Public",
    kind: "seeking-student",
    title: "Weekend group class — 3 seats left",
    body: "Starting an online group batch on weekends. Small batch (within 5 students), interactive sessions. DM me if interested.\n\nSyllabus: Class 9-10 Science group, 2 mock tests every month.",
    tag: "Weekend Batch",
    tags: ["Math", "Physics", "Chemistry"],
    meta: [
      { label: "Batch", value: "Weekend AM" },
      { label: "Fee", value: "৳2,500/mo" },
      { label: "Seats", value: "3 left" },
      { label: "Duration", value: "45 min × 6" },
    ],
    stats: { likes: 176, comments: 51, shares: 9 },
  },
  {
    id: "rayhan-setup",
    author: "Rayhan Chowdhury",
    role: "student",
    handle: "@rayhan.reads",
    time: "Yesterday · Public",
    kind: "learning",
    title: "Study setup for finals week",
    body: "An apple, a few books — that's this week's routine. The board exam is exactly 12 days away.",
    tag: "Motivation",
    stats: { likes: 421, comments: 66, shares: 12 },
    mediaUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop",
  },
];

export function getPostById(id: string): PostData | undefined {
  return posts.find((p) => p.id === id);
}

// Related = same kind first, then same tag, exclude self. Loops back to top if fewer than n.
export function getRelatedPosts(id: string, n = 4): PostData[] {
  const src = getPostById(id);
  if (!src) return posts.slice(0, n);
  const others = posts.filter((p) => p.id !== id);
  const sameKind = others.filter((p) => p.kind === src.kind);
  const sameTag = others.filter((p) => p.kind !== src.kind && (p.tag === src.tag || p.tags?.some((t) => src.tags?.includes(t))));
  const rest = others.filter((p) => !sameKind.includes(p) && !sameTag.includes(p));
  const combined = [...sameKind, ...sameTag, ...rest];
  // Loop content — if fewer than n, repeat
  const result: PostData[] = [];
  let i = 0;
  while (result.length < n && combined.length > 0) {
    result.push(combined[i % combined.length]);
    i++;
    if (i > combined.length * 3) break;
  }
  return result;
}

// Seed comments per post so the detail page feels populated
export const seedComments: Record<string, { id: number; author: string; role: Role; text: string; time: string; likes: number }[]> = {
  "light-bend-water": [
    { id: 1, author: "Dr. Kamal", role: "tutor", text: "In simple terms: light travels at different speeds in air and water. When the medium changes, the speed changes, and that's why the direction bends too — just like a car turns when one wheel hits mud.", time: "45m", likes: 34 },
    { id: 2, author: "Sami Ahmed", role: "student", text: "Snell's law looks most elegant when derived using Feynman's path integral — light always takes the path of shortest time.", time: "30m", likes: 12 },
    { id: 3, author: "Tania Rahman", role: "student", text: "Thanks! The car analogy made it perfectly clear now.", time: "20m", likes: 5 },
    { id: 4, author: "Nusrat", role: "student", text: "I had the same doubt, thanks for asking 🙌", time: "10m", likes: 3 },
  ],
  "alia-free-math": [
    { id: 1, author: "Rakib Hasan", role: "student", text: "When will we get the Zoom link?", time: "1h", likes: 8 },
    { id: 2, author: "Alia Bhatt", role: "tutor", text: "I'll post it as a pinned comment at 8:50. Revise the chapter until then!", time: "55m", likes: 22 },
    { id: 3, author: "Munia", role: "student", text: "Will the trigonometry identities be covered?", time: "40m", likes: 4 },
  ],
  "lily-baba-convo": [
    { id: 1, author: "Miss Rehana", role: "tutor", text: "Beautifully written. This kind of dialog is very effective for vocabulary practice.", time: "5d", likes: 41 },
    { id: 2, author: "Rifat", role: "student", text: "Can I use this in my class? I'll give credit.", time: "3d", likes: 9 },
  ],
};
