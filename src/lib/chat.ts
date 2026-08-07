// Lightweight chat store — mock threads + localStorage-persisted messages.
// UI-only, no backend. Simulates a small circle of conversations.

export type ChatRole = "tutor" | "student" | "parent";

export type ChatThread = {
  id: string;
  name: string;
  role: ChatRole;
  subject?: string;
  avatarColor: string;
  initials: string;
  online?: boolean;
  lastSeen?: string;
};

export type VoiceClip = {
  /** data: URL of the recorded audio (demo: kept in localStorage) */
  url: string;
  /** duration in seconds */
  duration: number;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  from: "me" | "them";
  text: string;
  at: number; // epoch ms
  status?: "sent" | "delivered" | "read";
  reaction?: string;
  replyTo?: { from: "me" | "them"; text: string };
  deletedFor?: "me" | "everyone";
  voice?: VoiceClip;
};

export const threads: ChatThread[] = [
  {
    id: "rafiq",
    name: "Rafiqul Islam",
    role: "tutor",
    subject: "Higher Math",
    avatarColor: "linear-gradient(135deg,#292C75,#4f52c9)",
    initials: "RI",
    online: true,
  },
  {
    id: "nusrat",
    name: "Nusrat Jahan",
    role: "student",
    subject: "Class 10 · Physics",
    avatarColor: "linear-gradient(135deg,#006747,#22a06b)",
    initials: "NJ",
    online: true,
  },
  {
    id: "shahed",
    name: "Shahed Ahmed",
    role: "tutor",
    subject: "English Grammar",
    avatarColor: "linear-gradient(135deg,#F4C430,#e6a800)",
    initials: "SA",
    lastSeen: "2h ago",
  },
  {
    id: "parent-tania",
    name: "Tania Rahman (Parent)",
    role: "parent",
    subject: "Ayman's guardian",
    avatarColor: "linear-gradient(135deg,#7c3aed,#ec4899)",
    initials: "TR",
    lastSeen: "yesterday",
  },
  {
    id: "mahin",
    name: "Mahin Chowdhury",
    role: "student",
    subject: "SSC · Chemistry",
    avatarColor: "linear-gradient(135deg,#0ea5e9,#6366f1)",
    initials: "MC",
    lastSeen: "5m ago",
  },
];

const seed: Record<string, ChatMessage[]> = {
  rafiq: [
    { id: "1", threadId: "rafiq", from: "them", text: "Can you finish the integration chapter today?", at: Date.now() - 1000 * 60 * 40 },
    { id: "2", threadId: "rafiq", from: "me", text: "Yes sir, only the last exercise is left.", at: Date.now() - 1000 * 60 * 38, status: "read" },
    { id: "3", threadId: "rafiq", from: "them", text: "Great. We'll solve that together in class.", at: Date.now() - 1000 * 60 * 30 },
  ],
  nusrat: [
    { id: "1", threadId: "nusrat", from: "them", text: "Bhaiya, could you explain Newton's 3rd law a bit?", at: Date.now() - 1000 * 60 * 12 },
  ],
  shahed: [
    { id: "1", threadId: "shahed", from: "me", text: "Sir, will passive voice be covered in tomorrow's class?", at: Date.now() - 1000 * 60 * 60 * 3, status: "delivered" },
  ],
  "parent-tania": [
    { id: "1", threadId: "parent-tania", from: "them", text: "When will I get Ayman's progress report?", at: Date.now() - 1000 * 60 * 60 * 26 },
  ],
  mahin: [
    { id: "1", threadId: "mahin", from: "them", text: "vaia notes ta share korben?", at: Date.now() - 1000 * 60 * 6 },
    { id: "2", threadId: "mahin", from: "me", text: "Sure, sending it in 5 minutes.", at: Date.now() - 1000 * 60 * 5, status: "read" },
  ],
};

const KEY = "la_chat_messages_v1";
type Listener = () => void;
const listeners = new Set<Listener>();

function load(): Record<string, ChatMessage[]> {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    return JSON.parse(raw);
  } catch {
    return seed;
  }
}

function save(store: Record<string, ChatMessage[]>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Voice clips are heavy — if the quota is hit, drop older clip payloads.
    try {
      const trimmed: Record<string, ChatMessage[]> = {};
      for (const [k, list] of Object.entries(store)) {
        trimmed[k] = list.map((m, i) =>
          m.voice && i < list.length - 3 ? { ...m, voice: { ...m.voice, url: "" } } : m,
        );
      }
      window.localStorage.setItem(KEY, JSON.stringify(trimmed));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

export function getMessages(threadId: string): ChatMessage[] {
  const store = load();
  return store[threadId] ?? [];
}

export function getAllLatest(): Record<string, ChatMessage | undefined> {
  const store = load();
  const out: Record<string, ChatMessage | undefined> = {};
  for (const t of threads) {
    const list = store[t.id] ?? [];
    out[t.id] = list[list.length - 1];
  }
  return out;
}

/* ---------- read / unread tracking ---------- */

const READ_KEY = "la_chat_read_v1";

function loadRead(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(READ_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function markRead(threadId: string) {
  if (typeof window === "undefined") return;
  const read = loadRead();
  const list = getMessages(threadId);
  const last = list[list.length - 1];
  const at = last ? last.at : Date.now();
  if (read[threadId] === at) return;
  read[threadId] = at;
  window.localStorage.setItem(READ_KEY, JSON.stringify(read));
  listeners.forEach((l) => l());
}

/** Number of unread incoming messages per thread. */
export function getUnreadCounts(): Record<string, number> {
  const store = load();
  const read = loadRead();
  const out: Record<string, number> = {};
  for (const t of threads) {
    const list = store[t.id] ?? [];
    const since = read[t.id] ?? 0;
    out[t.id] = list.filter((m) => m.from === "them" && m.at > since).length;
  }
  return out;
}

export function getTotalUnread(): number {
  return Object.values(getUnreadCounts()).reduce((a, b) => a + b, 0);
}

/** Threads ordered by most recent activity (newest first). */
export function getSortedThreads(): ChatThread[] {
  const latest = getAllLatest();
  return [...threads].sort((a, b) => (latest[b.id]?.at ?? 0) - (latest[a.id]?.at ?? 0));
}


/* ---------- typing indicator ---------- */

const typing = new Set<string>();

export function isTyping(threadId: string) {
  return typing.has(threadId);
}

function setTyping(threadId: string, on: boolean) {
  if (on) typing.add(threadId);
  else typing.delete(threadId);
  listeners.forEach((l) => l());
}

/* ---------- reactions ---------- */

export function setReaction(threadId: string, messageId: string, emoji: string) {
  const s = load();
  const l = s[threadId] ?? [];
  s[threadId] = l.map((m) =>
    m.id === messageId ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m,
  );
  save(s);
}

export function deleteMessage(
  threadId: string,
  messageId: string,
  scope: "me" | "everyone" = "me",
) {
  const s = load();
  const l = s[threadId] ?? [];
  s[threadId] = l.map((m) =>
    m.id === messageId ? { ...m, deletedFor: scope, reaction: undefined } : m,
  );
  save(s);
}

export function sendMessage(threadId: string, text: string, replyTo?: ChatMessage) {
  const store = load();
  const list = store[threadId] ?? [];
  const msg: ChatMessage = {
    id: Math.random().toString(36).slice(2),
    threadId,
    from: "me",
    text,
    at: Date.now(),
    status: "sent",
    replyTo: replyTo ? { from: replyTo.from, text: replyTo.text } : undefined,
  };
  store[threadId] = [...list, msg];
  save(store);

  // simulate delivered/read + auto reply
  setTimeout(() => {
    const s = load();
    const l = s[threadId] ?? [];
    s[threadId] = l.map((m) => (m.id === msg.id ? { ...m, status: "delivered" } : m));
    save(s);
  }, 600);

  const typingOn = setTimeout(() => setTyping(threadId, true), 900);
  void typingOn;

  setTimeout(() => {
    setTyping(threadId, false);
    const s = load();
    const l = s[threadId] ?? [];
    const replies = [
      "Got it 👍",
      "Thanks for letting me know!",
      "Ok, ami dekhchi.",
      "Sure, replying in a bit.",
      "Noted 🙌",
    ];
    const reply: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      threadId,
      from: "them",
      text: replies[Math.floor(Math.random() * replies.length)],
      at: Date.now(),
    };
    s[threadId] = [...l.map((m) => (m.id === msg.id ? { ...m, status: "read" as const } : m)), reply];
    save(s);
  }, 2600);
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getThread(id: string): ChatThread | undefined {
  return threads.find((t) => t.id === id);
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const diff = (now.getTime() - ts) / (1000 * 60 * 60 * 24);
  if (diff < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ---------- per-thread state (pin / mute / block / archive / report) ---------- */

export type ThreadState = {
  pinnedMessageId?: string;
  muted?: boolean;
  pinned?: boolean;
  archived?: boolean;
  blocked?: boolean;
  reported?: string;
};

const STATE_KEY = "la_chat_state_v1";

function loadStates(): Record<string, ThreadState> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STATE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getThreadState(threadId: string): ThreadState {
  return loadStates()[threadId] ?? {};
}

export function setThreadState(threadId: string, patch: Partial<ThreadState>) {
  if (typeof window === "undefined") return;
  const all = loadStates();
  all[threadId] = { ...(all[threadId] ?? {}), ...patch };
  window.localStorage.setItem(STATE_KEY, JSON.stringify(all));
  listeners.forEach((l) => l());
}

export function stateSnapshot(threadId: string): string {
  return JSON.stringify(getThreadState(threadId));
}

/** Snapshot of every thread's state (for list-level subscriptions). */
export function allStatesSnapshot(): string {
  return JSON.stringify(loadStates());
}

/** IDs of threads the user has archived. */
export function getArchivedIds(): string[] {
  const all = loadStates();
  return Object.keys(all).filter((id) => all[id]?.archived);
}


/** Pin (or unpin) a single message inside a thread. */
export function pinMessage(threadId: string, messageId: string | null) {
  setThreadState(threadId, { pinnedMessageId: messageId ?? undefined });
}

/** Wipe every message of a conversation (local demo delete). */
export function clearThread(threadId: string) {
  const s = load();
  s[threadId] = [];
  save(s);
}

/** Mark a conversation as unread again. */
export function markUnread(threadId: string) {
  if (typeof window === "undefined") return;
  const read = loadRead();
  delete read[threadId];
  window.localStorage.setItem(READ_KEY, JSON.stringify(read));
  listeners.forEach((l) => l());
}

/* ---------- voice messages ---------- */

/** Send a recorded voice clip as a message (demo: data URL in localStorage). */
export function sendVoiceMessage(
  threadId: string,
  clip: VoiceClip,
  replyTo?: ChatMessage,
) {
  const store = load();
  const list = store[threadId] ?? [];
  const msg: ChatMessage = {
    id: Math.random().toString(36).slice(2),
    threadId,
    from: "me",
    text: "🎤 Voice message",
    at: Date.now(),
    status: "sent",
    voice: clip,
    replyTo: replyTo ? { from: replyTo.from, text: replyTo.text } : undefined,
  };
  store[threadId] = [...list, msg];
  save(store);

  setTimeout(() => {
    const s = load();
    s[threadId] = (s[threadId] ?? []).map((m) =>
      m.id === msg.id ? { ...m, status: "delivered" as const } : m,
    );
    save(s);
  }, 700);

  setTimeout(() => {
    const s = load();
    const l = s[threadId] ?? [];
    const reply: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      threadId,
      from: "them",
      text: "Voice ta shunlam, thanks! 🎧",
      at: Date.now(),
    };
    s[threadId] = [
      ...l.map((m) => (m.id === msg.id ? { ...m, status: "read" as const } : m)),
      reply,
    ];
    save(s);
  }, 2800);
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
