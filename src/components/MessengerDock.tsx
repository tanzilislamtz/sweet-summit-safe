import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Minus,
  X,
  Send,
  Search,
  Pencil,
  Check,
  CheckCheck,
  Phone,
  MoreHorizontal,
  User,
  Images,
  BellOff,
  Bell,
  Ban,
  Trash2,
  Pin,
  PinOff,
  Archive,
  CornerUpLeft,
  Forward,
  Copy,
  Smile,
  Paperclip,
  Image as ImageIcon,
  MailQuestion,
  ChevronRight,
} from "lucide-react";
import { messageRequests } from "@/lib/requests";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getMessengerState,
  subscribeMessenger,
  closeMessengerPopup,
  openChatWindow,
  closeChatWindow,
  toggleMinimizeChat,
} from "@/lib/messenger";
import {
  threads,
  getSortedThreads,
  getUnreadCounts,
  markRead,
  getAllLatest,
  getMessages,
  getThread,
  sendMessage,
  sendVoiceMessage,
  subscribe,
  formatTime,
  setReaction,
  deleteMessage,
  type ChatThread,
  type ChatMessage,
} from "@/lib/chat";
import VoiceMessage from "@/components/VoiceMessage";
import VoiceRecorder from "@/components/VoiceRecorder";
import CallOverlay from "@/components/CallOverlay";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎",
  "🤔","😐","😴","😢","😭","😡","🥳","😇",
  "👍","👎","👏","🙏","💪","🤝","✌️","👌",
  "❤️","🔥","⭐","✅","🎉","📚","✏️","💡",
];

function DockToast({ text }: { text: string | null }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="pointer-events-none fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-lg"
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition hover:bg-muted ${
        danger ? "text-red-500" : "text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

const SERVER_STATE = { popupOpen: false, openChats: [] as string[], minimized: [] as string[] };

function useMessenger() {
  return useSyncExternalStore(subscribeMessenger, getMessengerState, () => SERVER_STATE);
}

function useChatStore() {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => JSON.stringify(getAllLatest()),
    () => "{}",
  );
}

export function MessengerDock() {
  const { popupOpen, openChats, minimized } = useMessenger();

  return (
    <div className="pointer-events-none fixed inset-0 z-50 hidden lg:block">
      <AnimatePresence>{popupOpen && <MessagesPopup key="popup" />}</AnimatePresence>

      <div className="absolute bottom-0 right-4 flex max-w-[calc(100vw-2rem)] items-end justify-end gap-3 overflow-hidden">
        <AnimatePresence>
          {openChats.map((id) => (
            <ChatWindow key={id} threadId={id} minimized={minimized.includes(id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MessagesPopup() {
  useChatStore();
  const latest = getAllLatest();
  const unread = getUnreadCounts();
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ thread: ChatThread; x: number; y: number } | null>(null);
  const [confirm, setConfirm] = useState<{ thread: ChatThread; kind: "delete" | "block" } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [muted, setMuted] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 1800);
  };
  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (ref.current?.contains(target)) return;
      if (target.closest("[data-dock-menu]")) return;
      if (target.closest("[data-messenger-trigger]")) return;
      closeMessengerPopup();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeMessengerPopup();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const filtered = getSortedThreads()
    .filter((t) => !hidden.includes(t.id))
    .filter(
      (t) =>
        t.name.toLowerCase().includes(q.toLowerCase()) ||
        (t.subject ?? "").toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => Number(pinned.includes(b.id)) - Number(pinned.includes(a.id)));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto absolute right-4 top-16 max-h-[calc(100dvh-6rem)] w-[min(360px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl"
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-xl font-bold tracking-tight">Chats</h2>
        <button
          aria-label="New chat"
          className="grid h-8 w-8 place-items-center rounded-full bg-muted text-foreground/70 hover:bg-muted/70"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <div className="relative px-4 py-3">
        <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Messenger"
          className="h-9 w-full rounded-full border border-border bg-muted/60 pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:bg-surface"
        />
      </div>

      <ul className="max-h-[min(420px,calc(100dvh-14rem))] overflow-y-auto px-2 pb-2">
        {messageRequests.length > 0 && (
          <li>
            <Link
              to="/message/requests"
              onClick={() => closeMessengerPopup()}
              className="mb-1 flex items-center gap-2 rounded-xl px-2.5 py-1 transition hover:bg-muted"
            >
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <MailQuestion className="h-3.5 w-3.5" />
              </div>
              <p className="min-w-0 flex-1 truncate text-xs font-semibold">
                Message requests
                <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                  · {messageRequests.length} new
                </span>
              </p>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

            </Link>
          </li>
        )}
        {filtered.map((t) => {
          const last = latest[t.id];
          const n = unread[t.id] ?? 0;
          const isUnread = n > 0;
          return (
            <li key={t.id}>
              <button
                onClick={() => openChatWindow(t.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenu({ thread: t, x: e.clientX, y: e.clientY });
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-muted ${
                  isUnread ? "bg-primary/[0.06]" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-full text-sm font-bold text-white"
                    style={{ background: t.avatarColor }}
                  >
                    {t.initials}
                  </div>
                  {t.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-surface" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`flex items-center gap-1 truncate text-sm ${isUnread ? "font-extrabold" : "font-semibold"}`}>
                    {t.name}
                    {pinned.includes(t.id) && <Pin className="h-3 w-3 shrink-0 text-primary" />}
                    {muted.includes(t.id) && <BellOff className="h-3 w-3 shrink-0 text-muted-foreground" />}
                  </p>
                  <p
                    className={`truncate text-xs font-bangla ${
                      isUnread ? "font-bold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {last ? (last.from === "me" ? "You: " : "") + last.text : t.subject}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {last && (
                    <span className={`text-[11px] ${isUnread ? "font-bold text-primary" : "text-muted-foreground"}`}>
                      {formatTime(last.at)}
                    </span>
                  )}
                  {isUnread && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {n}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">No conversations found.</li>
        )}
      </ul>

      <div className="border-t border-border p-2">
        <Link
          to="/message"
          onClick={() => closeMessengerPopup()}
          className="block rounded-2xl py-2 text-center text-sm font-semibold text-primary hover:bg-muted"
        >
          See all in Messages
        </Link>
      </div>

      <AnimatePresence>
        {menu && (
          <motion.div
            data-dock-menu
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenu(null)}
            className="pointer-events-auto fixed inset-0 z-[85]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                left: Math.min(menu.x - 110, window.innerWidth - 250),
                top: Math.min(menu.y - 20, window.innerHeight - 300),
              }}
              className="absolute w-60 rounded-2xl border border-border bg-surface p-1.5 shadow-2xl"
            >
              <div className="flex items-center gap-2 px-2 py-2">
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: menu.thread.avatarColor }}
                >
                  {menu.thread.initials}
                </div>
                <p className="min-w-0 truncate text-sm font-semibold">{menu.thread.name}</p>
              </div>
              <div className="my-1 h-px bg-border" />
              <MenuRow
                icon={<MessageOpenIcon />}
                label="Open chat"
                onClick={() => {
                  openChatWindow(menu.thread.id);
                  setMenu(null);
                }}
              />
              {(unread[menu.thread.id] ?? 0) > 0 && (
                <MenuRow
                  icon={<Check className="h-4 w-4 text-primary" />}
                  label="Mark as read"
                  onClick={() => {
                    markRead(menu.thread.id);
                    setMenu(null);
                    notify("Marked as read");
                  }}
                />
              )}
              <MenuRow
                icon={
                  muted.includes(menu.thread.id) ? (
                    <Bell className="h-4 w-4 text-primary" />
                  ) : (
                    <BellOff className="h-4 w-4 text-primary" />
                  )
                }
                label={muted.includes(menu.thread.id) ? "Unmute notifications" : "Mute notifications"}
                onClick={() => {
                  const was = muted.includes(menu.thread.id);
                  toggle(muted, setMuted, menu.thread.id);
                  setMenu(null);
                  notify(was ? "Notifications on" : "Notifications muted");
                }}
              />
              <MenuRow
                icon={
                  pinned.includes(menu.thread.id) ? (
                    <PinOff className="h-4 w-4 text-primary" />
                  ) : (
                    <Pin className="h-4 w-4 text-primary" />
                  )
                }
                label={pinned.includes(menu.thread.id) ? "Unpin chat" : "Pin chat"}
                onClick={() => {
                  const was = pinned.includes(menu.thread.id);
                  toggle(pinned, setPinned, menu.thread.id);
                  setMenu(null);
                  notify(was ? "Chat unpinned" : "Chat pinned to top");
                }}
              />
              <MenuRow
                icon={<Archive className="h-4 w-4 text-primary" />}
                label="Archive chat"
                onClick={() => {
                  setHidden((h) => [...h, menu.thread.id]);
                  setMenu(null);
                  notify("Chat archived");
                }}
              />
              <div className="my-1 h-px bg-border" />
              <MenuRow
                icon={<Ban className="h-4 w-4 text-red-500" />}
                label="Block user"
                danger
                onClick={() => {
                  setConfirm({ thread: menu.thread, kind: "block" });
                  setMenu(null);
                }}
              />
              <MenuRow
                icon={<Trash2 className="h-4 w-4 text-red-500" />}
                label="Delete chat"
                danger
                onClick={() => {
                  setConfirm({ thread: menu.thread, kind: "delete" });
                  setMenu(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirm && (
          <motion.div
            data-dock-menu
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirm(null)}
            className="pointer-events-auto fixed inset-0 z-[90] grid place-items-center bg-black/45 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-2xl"
            >
              <h3 className="text-base font-bold">
                {confirm.kind === "delete" ? "Delete chat?" : `Block ${confirm.thread.name.split(" ")[0]}?`}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {confirm.kind === "delete"
                  ? "This conversation will be removed from your inbox only."
                  : "They won't be able to message or call you."}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setConfirm(null)}
                  className="flex-1 rounded-2xl border border-border px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setHidden((h) => [...h, confirm.thread.id]);
                    notify(confirm.kind === "delete" ? "Chat deleted" : "User blocked");
                    setConfirm(null);
                  }}
                  className="flex-1 rounded-2xl bg-red-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                >
                  {confirm.kind === "delete" ? "Delete" : "Block"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DockToast text={toast} />
    </motion.div>
  );
}

function MessageOpenIcon() {
  return <Send className="h-4 w-4 text-primary" />;
}

function ChatWindow({ threadId, minimized }: { threadId: string; minimized: boolean }) {
  const thread = getThread(threadId);
  const snap = useSyncExternalStore(
    (cb) => subscribe(cb),
    () => JSON.stringify(getMessages(threadId)),
    () => "[]",
  );
  void snap;
  const messages = getMessages(threadId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [profileMenu, setProfileMenu] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const [call, setCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [msgMenu, setMsgMenu] = useState<{ msg: ChatMessage; x: number; y: number } | null>(null);
  const [delTarget, setDelTarget] = useState<ChatMessage | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [panel, setPanel] = useState<null | "search" | "media">(null);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const jumpTo = (id: string) => {
    setPanel(null);
    setHighlight(id);
    window.setTimeout(() => {
      document.getElementById(`dock-${threadId}-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    window.setTimeout(() => setHighlight(null), 2200);
  };
  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 1800);
  };

  useEffect(() => {
    if (minimized) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    const id = window.setTimeout(() => markRead(threadId), 300);
    return () => window.clearTimeout(id);
  }, [messages.length, minimized, threadId]);

  if (!thread) return null;

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    sendMessage(threadId, v, replyTo ?? undefined);
    setText("");
    setReplyTo(null);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto relative flex w-[min(328px,calc(100vw-2rem))] max-w-full min-w-0 flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-surface shadow-2xl"
      style={{
        height: minimized ? 48 : "min(440px, calc(100dvh - 5rem))",
      }}
    >
      <div className="relative flex items-center gap-1 border-b border-border bg-surface px-3 py-2">
        <button
          onClick={() => {
            setMoreMenu(false);
            setProfileMenu((v) => !v);
          }}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-1 py-0.5 text-left transition hover:bg-muted"
        >
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
            style={{ background: thread.avatarColor }}
          >
            {thread.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{thread.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">
              {thread.online ? "Active now" : thread.lastSeen ? `Active ${thread.lastSeen}` : thread.subject}
            </p>
          </div>
        </button>
        <button
          aria-label="Audio call"
          onClick={() => setCall(true)}
          className="grid h-7 w-7 place-items-center rounded-full text-primary hover:bg-muted"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          aria-label="More options"
          onClick={() => {
            setProfileMenu(false);
            setMoreMenu((v) => !v);
          }}
          className="grid h-7 w-7 place-items-center rounded-full text-primary hover:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <button
          aria-label="Minimize"
          onClick={() => toggleMinimizeChat(threadId)}
          className="grid h-7 w-7 place-items-center rounded-full text-foreground/60 hover:bg-muted"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          aria-label="Close chat"
          onClick={() => closeChatWindow(threadId)}
          className="grid h-7 w-7 place-items-center rounded-full text-foreground/60 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <AnimatePresence>
          {profileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="absolute left-2 top-[46px] z-30 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-2xl"
            >
              <Link
                to="/message/$threadId"
                params={{ threadId }}
                onClick={() => setProfileMenu(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition hover:bg-muted"
              >
                <User className="h-4 w-4 text-primary" /> Visit profile
              </Link>
              <MenuRow
                icon={<Search className="h-4 w-4 text-primary" />}
                label="Search in chat"
                onClick={() => {
                  setProfileMenu(false);
                  setQuery("");
                  setPanel("search");
                }}
              />
              <MenuRow
                icon={<Images className="h-4 w-4 text-primary" />}
                label="View media"
                onClick={() => {
                  setProfileMenu(false);
                  setPanel("media");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {moreMenu && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="absolute right-2 top-[46px] z-30 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-2xl"
            >
              <MenuRow
                icon={muted ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-primary" />}
                label={muted ? "Turn on notifications" : "Mute notifications"}
                onClick={() => {
                  setMuted((v) => !v);
                  setMoreMenu(false);
                  notify(muted ? "Notifications on" : "Notifications muted");
                }}
              />
              <MenuRow
                icon={<Archive className="h-4 w-4 text-primary" />}
                label="Archive chat"
                onClick={() => {
                  setMoreMenu(false);
                  closeChatWindow(threadId);
                  notify("Chat archived");
                }}
              />
              <div className="my-1 h-px bg-border" />
              <MenuRow
                icon={<Ban className="h-4 w-4 text-red-500" />}
                label="Block user"
                danger
                onClick={() => {
                  setMoreMenu(false);
                  notify("User blocked");
                }}
              />
              <MenuRow
                icon={<Trash2 className="h-4 w-4 text-red-500" />}
                label="Delete chat"
                danger
                onClick={() => {
                  setMoreMenu(false);
                  closeChatWindow(threadId);
                  notify("Chat deleted");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search / media panel */}
      <AnimatePresence>
        {panel && !minimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-0 top-[52px] z-40 flex flex-col bg-surface"
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
              {panel === "search" ? (
                <>
                  <Search className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search in this chat"
                    className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </>
              ) : (
                <>
                  <ImageIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="flex-1 text-xs font-semibold">Media, files & links</p>
                </>
              )}
              <button
                onClick={() => setPanel(null)}
                aria-label="Close panel"
                className="grid h-6 w-6 place-items-center rounded-full text-foreground/60 hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {panel === "search" ? (
                (() => {
                  const q = query.trim().toLowerCase();
                  const hits = q ? messages.filter((m) => !m.deletedFor && m.text.toLowerCase().includes(q)) : [];
                  if (!q)
                    return <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">Type to search messages.</p>;
                  if (!hits.length)
                    return <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">No matches found.</p>;
                  return hits
                    .slice()
                    .reverse()
                    .map((m) => (
                      <button
                        key={m.id}
                        onClick={() => jumpTo(m.id)}
                        className="flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left hover:bg-muted"
                      >
                        <span
                          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white"
                          style={{ background: m.from === "me" ? "var(--color-primary)" : thread.avatarColor }}
                        >
                          {m.from === "me" ? "You" : thread.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 block text-xs font-bangla">{m.text}</span>
                          <span className="block text-[10px] text-muted-foreground">{formatTime(m.at)}</span>
                        </span>
                      </button>
                    ));
                })()
              ) : (
                (() => {
                  const files = messages.filter((m) => !m.deletedFor && m.text.startsWith("📎"));
                  const links = messages.filter((m) => !m.deletedFor && /https?:\/\//i.test(m.text));
                  return (
                    <div className="space-y-3 p-1">
                      <div>
                        <p className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Files ({files.length})
                        </p>
                        {files.length ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            {files
                              .slice()
                              .reverse()
                              .map((m) => (
                                <button
                                  key={m.id}
                                  onClick={() => jumpTo(m.id)}
                                  className="rounded-xl border border-border bg-muted/40 p-2 text-left hover:border-primary/40"
                                >
                                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                                  <span className="mt-1 line-clamp-2 block break-all text-[10px] font-medium">
                                    {m.text.replace("📎", "").trim()}
                                  </span>
                                </button>
                              ))}
                          </div>
                        ) : (
                          <p className="rounded-xl border border-dashed border-border px-2 py-4 text-center text-[10px] text-muted-foreground">
                            No files shared yet.
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Links ({links.length})
                        </p>
                        {links.length ? (
                          links
                            .slice()
                            .reverse()
                            .map((m) => (
                              <button
                                key={m.id}
                                onClick={() => jumpTo(m.id)}
                                className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-[11px] hover:bg-muted"
                              >
                                {m.text}
                              </button>
                            ))
                        ) : (
                          <p className="rounded-xl border border-dashed border-border px-2 py-4 text-center text-[10px] text-muted-foreground">
                            No links shared yet.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!minimized && (
        <>
          <div className="flex-1 space-y-1.5 overflow-y-auto bg-muted/30 px-3 py-3">
            {messages.map((m) => {
              const mine = m.from === "me";
              if (m.deletedFor === "me" && mine) return null;
              const tomb = !!m.deletedFor;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} ${m.reaction && !tomb ? "mb-3" : ""}`}>
                  <div
                    id={`dock-${threadId}-${m.id}`}
                    onContextMenu={(e) => {
                      if (tomb) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setMsgMenu({ msg: m, x: e.clientX, y: e.clientY });
                    }}
                    className={`relative max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-1.5 text-sm leading-relaxed font-bangla ${
                      tomb
                        ? "border border-dashed border-border bg-transparent italic text-muted-foreground"
                        : mine
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border border-border bg-surface text-foreground"
                    } ${highlight === m.id ? "ring-2 ring-accent" : ""}`}
                  >
                    {tomb ? (
                      <span className="text-xs">
                        {m.deletedFor === "everyone"
                          ? mine
                            ? "You unsent a message"
                            : "This message was removed"
                          : "You removed this message"}
                      </span>
                    ) : (
                      <>
                        {m.replyTo && (
                          <span className="mb-1 block truncate rounded-lg bg-black/10 px-2 py-1 text-[11px] opacity-80">
                            {m.replyTo.text}
                          </span>
                        )}
                        {m.voice ? (
                          <VoiceMessage
                            clip={m.voice}
                            mine={mine}
                            seed={m.id}
                            statusSlot={
                              mine ? (
                                m.status === "read" ? (
                                  <CheckCheck className="h-3 w-3 text-accent" />
                                ) : m.status === "delivered" ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )
                              ) : undefined
                            }
                          />
                        ) : (
                          m.text
                        )}
                      </>
                    )}
                    {m.reaction && !tomb && (
                      <span className="absolute -bottom-3 right-1 rounded-full border border-border bg-surface px-1 text-[11px] shadow-sm">
                        {m.reaction}
                      </span>
                    )}
                    {!tomb && mine && !m.voice && (
                      <span className="ml-1.5 inline-flex translate-y-0.5 items-center text-[10px] opacity-80">
                        {m.status === "read" ? (
                          <CheckCheck className="h-3 w-3 text-accent" />
                        ) : m.status === "delivered" ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </span>
                    )}

                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {replyTo && (
            <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-3 py-1.5">
              <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground font-bangla">{replyTo.text}</p>
              <button onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="relative flex w-full min-w-0 flex-nowrap items-center gap-1.5 border-t border-border bg-surface p-2"
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  sendMessage(threadId, `📎 ${f.name}`, replyTo ?? undefined);
                  setReplyTo(null);
                  notify("Attachment sent");
                }
                e.target.value = "";
              }}
            />
            <button
              type="button"
              aria-label="Attach file"
              onClick={() => fileRef.current?.click()}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-foreground/70 hover:bg-muted"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <VoiceRecorder
              onSend={(clip) => {
                sendVoiceMessage(threadId, clip, replyTo ?? undefined);
                setReplyTo(null);
                notify("Voice message sent");
              }}
            />
            <div className="flex flex-1 items-center gap-1 rounded-full border border-border bg-muted/50 px-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Aa"
                className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none font-bangla"
              />
              <button
                type="button"
                aria-label="Emoji"
                onClick={() => setEmojiOpen((v) => !v)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-foreground/60 hover:bg-surface"
              >
                <Smile className="h-4 w-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!text.trim()}
              aria-label="Send"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {emojiOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute bottom-14 right-2 z-30 w-[248px] rounded-2xl border border-border bg-surface p-2 shadow-2xl"
                >
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setText((t) => t + e)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-base transition hover:scale-110 hover:bg-muted"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </>
      )}

      <AnimatePresence>
        {msgMenu && (
          <div className="pointer-events-auto fixed inset-0 z-[85]" onClick={() => setMsgMenu(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                left: Math.min(msgMenu.x - 100, window.innerWidth - 240),
                top: Math.min(msgMenu.y - 20, window.innerHeight - 260),
              }}
              className="absolute w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-2xl"
            >
              <div className="mb-1 flex items-center justify-between rounded-xl bg-muted/60 px-1.5 py-1">
                {REACTIONS.map((emo) => {
                  const active = msgMenu.msg.reaction === emo;
                  return (
                    <button
                      key={emo}
                      onClick={() => {
                        setReaction(threadId, msgMenu.msg.id, emo);
                        setMsgMenu(null);
                      }}
                      className={`grid h-7 w-7 place-items-center rounded-full text-base transition hover:scale-125 ${
                        active
                          ? "border-2 border-transparent bg-primary/15"
                          : "border-2 border-transparent"
                      }`}
                    >
                      {emo}
                    </button>
                  );
                })}
              </div>
              <MenuRow
                icon={<CornerUpLeft className="h-4 w-4 text-primary" />}
                label="Reply"
                onClick={() => {
                  setReplyTo(msgMenu.msg);
                  setMsgMenu(null);
                }}
              />
              <MenuRow
                icon={<Forward className="h-4 w-4 text-primary" />}
                label="Forward"
                onClick={() => {
                  setMsgMenu(null);
                  notify("Forwarding coming soon");
                }}
              />
              <MenuRow
                icon={<Copy className="h-4 w-4 text-primary" />}
                label="Copy text"
                onClick={() => {
                  navigator.clipboard?.writeText(msgMenu.msg.text);
                  setMsgMenu(null);
                  notify("Copied to clipboard");
                }}
              />
              <div className="my-1 h-px bg-border" />
              <MenuRow
                icon={<Trash2 className="h-4 w-4 text-red-500" />}
                label="Delete"
                danger
                onClick={() => {
                  setDelTarget(msgMenu.msg);
                  setMsgMenu(null);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {delTarget && (
          <div
            className="pointer-events-auto fixed inset-0 z-[90] grid place-items-center bg-black/45 backdrop-blur-sm"
            onClick={() => setDelTarget(null)}
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-2xl"
            >
              <h3 className="text-base font-bold">Delete message?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {delTarget.from === "me"
                  ? "Unsend for everyone removes it for all. Remove for you keeps it on their side."
                  : "This message will only be removed from your side."}
              </p>
              <div className="mt-4 space-y-2">
                {delTarget.from === "me" && (
                  <button
                    onClick={() => {
                      deleteMessage(threadId, delTarget.id, "everyone");
                      setDelTarget(null);
                      notify("Message unsent");
                    }}
                    className="w-full rounded-2xl bg-red-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                  >
                    Unsend for everyone
                  </button>
                )}
                <button
                  onClick={() => {
                    deleteMessage(threadId, delTarget.id, "me");
                    setDelTarget(null);
                    notify("Removed for you");
                  }}
                  className="w-full rounded-2xl border border-border px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  Remove for you
                </button>
                <button
                  onClick={() => setDelTarget(null)}
                  className="w-full rounded-2xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CallOverlay
        open={call}
        kind="audio"
        name={thread.name}
        initials={thread.initials}
        avatarColor={thread.avatarColor}
        onClose={() => setCall(false)}
      />

      <DockToast text={toast} />
    </motion.div>
  );
}
