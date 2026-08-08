import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Send,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  User,
  BellOff,
  Search,
  Image as ImageIcon,
  Pin,
  Archive,
  Trash2,
  Ban,
  Flag,
  ChevronRight,
  CircleDot,
  Reply,
  Forward,
  Copy,
  X,
  PinOff,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import logoAsset from "@/assets/learns-academy-logo.png.asset.json";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getMessages,
  getThread,
  sendMessage,
  sendVoiceMessage,
  sendAttachment,
  subscribe,
  formatTime,
  markRead,
  isTyping,
  setReaction,
  deleteMessage,
  pinMessage,
  clearThread,
  markUnread,
  getThreadState,
  setThreadState,
  stateSnapshot,
  type ChatMessage,
} from "@/lib/chat";

const REPORT_REASONS = [
  "Spam or scam",
  "Harassment or bullying",
  "Fake account / impersonation",
  "Inappropriate content",
  "Selling illegal or unsafe items",
  "Something else",
];
import { AnimatePresence, motion } from "framer-motion";
import CallOverlay, { type CallKind } from "@/components/CallOverlay";
import VoiceMessage from "@/components/VoiceMessage";
import ChatAttachment from "@/components/ChatAttachment";
import { fileToAttachment, MAX_ATTACHMENT_BYTES } from "@/lib/attachments";
import VoiceRecorder from "@/components/VoiceRecorder";

const COMPOSER_EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎",
  "🤔","😐","😴","😢","😭","😡","🥳","😇",
  "👍","👎","👏","🙏","💪","🤝","✌️","👌",
  "❤️","🔥","⭐","✅","🎉","📚","✏️","💡",
];

export const Route = createFileRoute("/message/$threadId")({
  component: ThreadView,
});

function ThreadView() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const thread = getThread(threadId);

  const snap = useSyncExternalStore(
    (cb) => subscribe(cb),
    () =>
      JSON.stringify(getMessages(threadId)) +
      stateSnapshot(threadId) +
      (isTyping(threadId) ? "|t" : ""),
    () => "[]",
  );
  const messages = getMessages(threadId);
  void snap;

  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [openMenu, setOpenMenu] = useState<null | "profile" | "more">(null);
  const [call, setCall] = useState<null | CallKind>(null);
  const tState = getThreadState(threadId);
  const notifMuted = !!tState.muted;
  
  const blocked = !!tState.blocked;
  const pinnedMsg = messages.find((m) => m.id === tState.pinnedMessageId) ?? null;
  const [confirm, setConfirm] = useState<null | "block" | "unblock" | "deleteChat" | "report">(null);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDone, setReportDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msgMenu, setMsgMenu] = useState<{ msg: ChatMessage; x: number; y: number } | null>(null);
  const [delTarget, setDelTarget] = useState<ChatMessage | null>(null);
  const [panel, setPanel] = useState<null | "search" | "media">(null);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<string | null>(null);
  const longPress = useRef<number | null>(null);
  const typing = isTyping(threadId);

  const jumpTo = (id: string) => {
    setPanel(null);
    setHighlight(id);
    window.setTimeout(() => {
      document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    window.setTimeout(() => setHighlight(null), 2200);
  };


  const notify = (msg: string) => {
    setToast(msg);
    setOpenMenu(null);
    window.setTimeout(() => setToast(null), 1800);
  };

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenu]);


  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    const id = window.setTimeout(() => markRead(threadId), 300);
    return () => window.clearTimeout(id);
  }, [messages.length, threadId]);

  // Keep the chat shell locked to the visual viewport so the mobile keyboard
  // never pushes/crops the header or composer.
  const [vv, setVv] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    const viewport = typeof window !== "undefined" ? window.visualViewport : null;
    if (!viewport) return;
    const update = () => {
      setVv({ height: viewport.height, top: viewport.offsetTop });
      bottomRef.current?.scrollIntoView({ block: "end" });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);


  if (!thread) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted-foreground">Conversation not found.</p>
        <Link to="/message" className="mt-3 inline-block text-sm font-medium text-primary">
          Back to messages
        </Link>
      </div>
    );
  }

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    sendMessage(threadId, value, replyTo ?? undefined);
    setText("");
    setReplyTo(null);
  };

  const isMobile = typeof window !== "undefined" ? window.innerWidth < 1024 : false;
  const shellStyle =
    isMobile && vv
      ? { height: `${vv.height}px`, top: `${vv.top}px`, bottom: "auto" as const, left: 0, right: 0, width: "100%" }
      : undefined;

  return (
    <div
      style={shellStyle}
      className="fixed inset-x-0 bottom-0 top-0 z-30 flex w-full max-w-[100vw] flex-col overflow-hidden overscroll-none border-border bg-surface lg:relative lg:z-auto lg:h-full lg:min-h-0 lg:max-w-full lg:rounded-3xl lg:border lg:shadow-sm"
    >

      {/* Brand bar (mobile) */}
      <div className="flex shrink-0 items-center justify-center border-b border-border bg-surface px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:hidden">
        <img src={logoAsset.url} alt="Learns Academy" className="h-7 w-auto" />
      </div>

      {/* Header */}
      <div className="relative z-20 flex shrink-0 items-center gap-2 border-b border-border bg-surface px-3 py-2.5 sm:px-4 lg:py-3">
        <button
          onClick={() => navigate({ to: "/message" })}
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:bg-muted lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenu(openMenu === "profile" ? null : "profile");
          }}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-1 py-1 text-left transition hover:bg-muted/60"
        >
          <div className="relative shrink-0">
            <div
              className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white"
              style={{ background: thread.avatarColor }}
            >
              {thread.initials}
            </div>
            {thread.online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-semibold">
              {thread.name}
              {notifMuted && <BellOff className="h-3 w-3 shrink-0 text-muted-foreground" />}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {thread.online ? "Active now" : thread.lastSeen ? `Last seen ${thread.lastSeen}` : thread.subject}
            </p>
          </div>
        </button>

        <button
          onClick={() => setCall("audio")}
          aria-label="Call"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/10"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenu(openMenu === "more" ? null : "more");
          }}
          aria-label="More"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground/70 hover:bg-muted"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {/* Profile popover */}
        <AnimatePresence>
          {openMenu === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-3 top-full z-30 mt-1 w-72 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-xl"
            >
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <div
                  className="grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ background: thread.avatarColor }}
                >
                  {thread.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{thread.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{thread.subject}</p>
                </div>
              </div>

              <Link
                to="/profile"
                onClick={() => setOpenMenu(null)}
                className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted"
              >
                <User className="h-4 w-4 text-primary" /> Visit profile
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
              <MenuItem
                icon={<Search className="h-4 w-4 text-primary" />}
                label="Search in chat"
                onClick={() => {
                  setOpenMenu(null);
                  setQuery("");
                  setPanel("search");
                }}
              />
              <MenuItem
                icon={<ImageIcon className="h-4 w-4 text-primary" />}
                label="View media and files"
                onClick={() => {
                  setOpenMenu(null);
                  setPanel("media");
                }}
              />


            </motion.div>
          )}
        </AnimatePresence>

        {/* Three-dot menu */}
        <AnimatePresence>
          {openMenu === "more" && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-3 top-full z-30 mt-1 w-64 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-xl"
            >
              <MenuItem
                icon={<CircleDot className="h-4 w-4 text-primary" />}
                label="Mark as unread"
                onClick={() => {
                  markUnread(threadId);
                  setOpenMenu(null);
                  navigate({ to: "/message" });
                }}
              />
              <MenuItem
                icon={<BellOff className="h-4 w-4 text-primary" />}
                label={notifMuted ? "Unmute" : "Mute notifications"}
                onClick={() => {
                  setThreadState(threadId, { muted: !notifMuted });
                  notify(notifMuted ? "Notifications on" : "Notifications muted");
                }}
              />
              <MenuItem
                icon={<Archive className="h-4 w-4 text-primary" />}
                label={tState.archived ? "Unarchive chat" : "Archive chat"}
                onClick={() => {
                  const next = !tState.archived;
                  setThreadState(threadId, { archived: next });
                  setOpenMenu(null);
                  if (next) {
                    try {
                      window.sessionStorage.setItem("la_open_archived", "1");
                    } catch {
                      /* ignore */
                    }
                    navigate({ to: "/message" });
                  } else notify("Moved back to inbox");

                }}
              />

              <MenuItem
                icon={<Flag className="h-4 w-4 text-primary" />}
                label="Report"
                onClick={() => {
                  setOpenMenu(null);
                  setReportReason(null);
                  setReportDone(false);
                  setConfirm("report");
                }}
              />
              <MenuItem
                icon={<Ban className={`h-4 w-4 ${blocked ? "text-primary" : "text-red-500"}`} />}
                label={blocked ? "Unblock" : "Block"}
                danger={!blocked}
                onClick={() => {
                  setOpenMenu(null);
                  setConfirm(blocked ? "unblock" : "block");
                }}
              />

              <MenuItem
                icon={<Trash2 className="h-4 w-4 text-red-500" />}
                label="Delete chat"
                danger
                onClick={() => {
                  setOpenMenu(null);
                  setConfirm("deleteChat");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* Pinned message banner */}
      <AnimatePresence initial={false}>
        {pinnedMsg && (
          <motion.button
            key={pinnedMsg.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onClick={() => jumpTo(pinnedMsg.id)}
            className="z-10 flex w-full shrink-0 items-center gap-2 overflow-hidden border-b border-border bg-primary/5 px-3 py-2 text-left sm:px-4"
          >
            <Pin className="h-3.5 w-3.5 shrink-0 rotate-45 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold text-primary">Pinned message</span>
              <span className="block truncate text-xs text-muted-foreground font-bangla">
                {pinnedMsg.text}
              </span>
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                pinMessage(threadId, null);
                notify("Message unpinned");
              }}
              aria-label="Unpin"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-surface"
            >
              <PinOff className="h-3.5 w-3.5" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain bg-muted/30 py-4 safe-x">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const mine = m.from === "me";
            const prev = messages[i - 1];
            const showTime = !prev || m.at - prev.at > 1000 * 60 * 10;
            return (
              <div key={m.id}>
                {showTime && (
                  <div className="my-3 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {formatTime(m.at)}
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18 }}
                  className={`group flex items-center gap-1 px-1 ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    id={`msg-${m.id}`}
                    data-allow-contextmenu

                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (m.deletedFor) return;
                      setMsgMenu({ msg: m, x: e.clientX, y: e.clientY });
                    }}
                    onTouchStart={(e) => {
                      const t = e.touches[0];
                      if (m.deletedFor) return;
                      longPress.current = window.setTimeout(
                        () => setMsgMenu({ msg: m, x: t.clientX, y: t.clientY }),
                        420,
                      );
                    }}
                    onTouchEnd={() => {
                      if (longPress.current) window.clearTimeout(longPress.current);
                    }}
                    onTouchMove={() => {
                      if (longPress.current) window.clearTimeout(longPress.current);
                    }}
                    className={`relative max-w-[78%] select-none whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed font-bangla ${
                      m.deletedFor
                        ? `border border-dashed border-border bg-transparent italic text-muted-foreground ${mine ? "rounded-br-md" : "rounded-bl-md"}`
                        : mine
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border border-border bg-surface text-foreground"
                    } ${m.reaction && !m.deletedFor ? "mb-3" : ""} ${
                      highlight === m.id ? "ring-2 ring-accent ring-offset-2 ring-offset-muted/30" : ""
                    }`}
                  >
                    {m.deletedFor ? (
                      <span className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <Ban className="h-3.5 w-3.5 shrink-0" />
                          {m.deletedFor === "everyone"
                            ? mine
                              ? "You unsent a message"
                              : "This message was deleted"
                            : mine
                              ? "You removed this message"
                              : "You removed this message"}
                        </span>
                        {m.deletedFor === "me" && (
                          <span className="text-[10px] not-italic opacity-80">
                            Only removed for you — {thread.name.split(" ")[0]} can still see it
                          </span>
                        )}
                      </span>
                    ) : (
                    <>
                    {m.replyTo && (
                      <div
                        className={`mb-1.5 truncate rounded-lg border-l-2 px-2 py-1 text-[11px] ${
                          mine
                            ? "border-white/60 bg-white/15 text-primary-foreground/85"
                            : "border-primary/50 bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.replyTo.text}
                      </div>
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
                    ) : m.attachment ? (
                      <ChatAttachment attachment={m.attachment} mine={mine} />
                    ) : (
                      m.text
                    )}
                    {mine && !m.voice && !m.attachment && (
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

                    </>
                    )}
                    {m.reaction && !m.deletedFor && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute -bottom-3 ${mine ? "right-2" : "left-2"} rounded-full border border-border bg-surface px-1.5 py-0.5 text-[11px] shadow-sm`}
                      >
                        {m.reaction}
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-surface px-3.5 py-2.5">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Search / Media panel */}
      <AnimatePresence>
        {panel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col bg-black/30 backdrop-blur-[2px]"
            onClick={() => setPanel(null)}
          >
            <motion.div
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85%] min-h-0 flex-col overflow-hidden rounded-b-3xl border-b border-border bg-surface shadow-2xl"
            >
              <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)] lg:pt-2.5">
                {panel === "search" ? (
                  <>
                    <Search className="h-4 w-4 shrink-0 text-primary" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search in this conversation"
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                    <p className="flex-1 text-sm font-semibold">Media, files & links</p>
                  </>
                )}
                <button
                  onClick={() => setPanel(null)}
                  aria-label="Close"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-foreground/70 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {panel === "search" ? (
                  (() => {
                    const q = query.trim().toLowerCase();
                    const hits = q
                      ? messages.filter((m) => !m.deletedFor && m.text.toLowerCase().includes(q))
                      : [];
                    if (!q)
                      return (
                        <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                          Type to search messages in this chat.
                        </p>
                      );
                    if (!hits.length)
                      return (
                        <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                          No messages found for “{query}”.
                        </p>
                      );
                    return (
                      <>
                        <p className="px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {hits.length} result{hits.length > 1 ? "s" : ""}
                        </p>
                        {hits
                          .slice()
                          .reverse()
                          .map((m) => (
                            <button
                              key={m.id}
                              onClick={() => jumpTo(m.id)}
                              className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted"
                            >
                              <div
                                className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                                style={{
                                  background: m.from === "me" ? "var(--color-primary)" : thread.avatarColor,
                                }}
                              >
                                {m.from === "me" ? "You" : thread.initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-bangla">{m.text}</p>
                                <p className="mt-0.5 text-[10px] text-muted-foreground">{formatTime(m.at)}</p>
                              </div>
                            </button>
                          ))}
                      </>
                    );
                  })()
                ) : (
                  (() => {
                    const files = messages.filter((m) => !m.deletedFor && m.text.startsWith("📎"));
                    const links = messages.filter(
                      (m) => !m.deletedFor && /https?:\/\//i.test(m.text),
                    );
                    return (
                      <div className="space-y-4 p-1">
                        <div>
                          <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Files ({files.length})
                          </p>
                          {files.length ? (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {files
                                .slice()
                                .reverse()
                                .map((m) => (
                                  <button
                                    key={m.id}
                                    onClick={() => jumpTo(m.id)}
                                    className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-muted/40 p-3 text-left transition hover:border-primary/40 hover:bg-muted"
                                  >
                                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10">
                                      <Paperclip className="h-4 w-4 text-primary" />
                                    </span>
                                    <span className="line-clamp-2 w-full break-all text-[11px] font-medium">
                                      {m.text.replace("📎", "").trim()}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">{formatTime(m.at)}</span>
                                  </button>
                                ))}
                            </div>
                          ) : (
                            <p className="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                              No files shared yet.
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Links ({links.length})
                          </p>
                          {links.length ? (
                            <div className="space-y-1">
                              {links
                                .slice()
                                .reverse()
                                .map((m) => (
                                  <button
                                    key={m.id}
                                    onClick={() => jumpTo(m.id)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted"
                                  >
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary/10 text-secondary">
                                      <ChevronRight className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-xs font-medium">{m.text}</span>
                                      <span className="block text-[10px] text-muted-foreground">
                                        {formatTime(m.at)}
                                      </span>
                                    </span>
                                  </button>
                                ))}
                            </div>
                          ) : (
                            <p className="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message action sheet */}
      <AnimatePresence>
        {msgMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMsgMenu(null)}
            className="fixed inset-0 z-[70] bg-foreground/20 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                left: Math.min(Math.max(msgMenu.x - 110, 12), Math.max(window.innerWidth - 232, 12)),
                top: Math.min(Math.max(msgMenu.y - 60, 80), Math.max(window.innerHeight - 300, 80)),
              }}
              className="absolute w-60 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-2xl"
            >
              <div className="mb-1 flex items-center justify-between gap-0.5 rounded-xl bg-muted/60 px-2 py-1.5">
                {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emo) => {
                  const active = msgMenu.msg.reaction === emo;
                  return (
                    <motion.button
                      key={emo}
                      whileTap={{ scale: 0.85 }}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => {
                        setReaction(threadId, msgMenu.msg.id, emo);
                        setMsgMenu(null);
                      }}
                      className={`grid h-8 w-8 place-items-center rounded-full text-base leading-none transition ${
                      active
                        ? "border-2 border-transparent bg-primary/15"
                        : "border-2 border-transparent"
                      }`}
                    >
                      {emo}
                    </motion.button>
                  );
                })}
              </div>
              <MenuItem
                icon={<Reply className="h-4 w-4 text-primary" />}
                label="Reply"
                onClick={() => {
                  setReplyTo(msgMenu.msg);
                  setMsgMenu(null);
                  inputRef.current?.focus();
                }}
              />
              <MenuItem
                icon={
                  tState.pinnedMessageId === msgMenu.msg.id ? (
                    <PinOff className="h-4 w-4 text-primary" />
                  ) : (
                    <Pin className="h-4 w-4 text-primary" />
                  )
                }
                label={tState.pinnedMessageId === msgMenu.msg.id ? "Unpin message" : "Pin message"}
                onClick={() => {
                  const isPinned = tState.pinnedMessageId === msgMenu.msg.id;
                  pinMessage(threadId, isPinned ? null : msgMenu.msg.id);
                  setMsgMenu(null);
                  notify(isPinned ? "Message unpinned" : "Message pinned to top");
                }}
              />
              <MenuItem
                icon={<Forward className="h-4 w-4 text-primary" />}
                label="Forward"
                onClick={() => {
                  setMsgMenu(null);
                  notify("Message forwarded (demo)");
                }}
              />
              <MenuItem
                icon={<Copy className="h-4 w-4 text-primary" />}
                label="Copy text"
                onClick={() => {
                  navigator.clipboard?.writeText(msgMenu.msg.text);
                  setMsgMenu(null);
                  notify("Copied");
                }}
              />
              <MenuItem
                icon={<Trash2 className="h-4 w-4 text-red-500" />}
                label="Delete"
                danger
                onClick={() => {
                  setDelTarget(msgMenu.msg);
                  setMsgMenu(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Delete confirmation */}
      <AnimatePresence>
        {delTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDelTarget(null)}
            className="fixed inset-0 z-[75] flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center"
          >
            <motion.div
              initial={{ y: 30, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-2xl"
            >
              <h3 className="text-base font-bold text-foreground">Delete message?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {delTarget.from === "me"
                  ? "Choose who this message should be removed for. This can't be undone."
                  : `This will only be removed for you. ${thread.name.split(" ")[0]} will still see it in the chat.`}
              </p>

              <div className="mt-4 space-y-2">
                {delTarget.from === "me" && (
                  <button
                    onClick={() => {
                      deleteMessage(threadId, delTarget.id, "everyone");
                      setDelTarget(null);
                      notify("Message unsent for everyone");
                    }}
                    className="flex w-full items-start gap-3 rounded-2xl border border-border p-3 text-left transition hover:bg-muted"
                  >
                    <Ban className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Unsent for everyone
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Nobody in this chat will be able to see it
                      </span>
                    </span>
                  </button>
                )}
                <button
                  onClick={() => {
                    deleteMessage(threadId, delTarget.id, "me");
                    setDelTarget(null);
                    notify("Message removed for you");
                  }}
                  className="flex w-full items-start gap-3 rounded-2xl border border-border p-3 text-left transition hover:bg-muted"
                >
                  <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      Remove for you
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      It stays visible for {thread.name.split(" ")[0]}
                    </span>
                  </span>
                </button>
              </div>

              <button
                onClick={() => setDelTarget(null)}
                className="mt-3 w-full rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block / Unblock / Delete chat / Report dialogs */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirm(null)}
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center"
          >
            <motion.div
              initial={{ y: 30, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-2xl"
            >
              {confirm === "block" && (
                <>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-500/10">
                    <Ban className="h-5 w-5 text-red-500" />
                  </div>
                  <h3 className="mt-3 text-base font-bold">Block {thread.name}?</h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    <li>• They can no longer message or call you here.</li>
                    <li>• They won't be told that you blocked them.</li>
                    <li>• The chat history stays, but stays read-only.</li>
                    <li>• You can unblock any time from this menu.</li>
                  </ul>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setConfirm(null)}
                      className="flex-1 rounded-2xl border border-border px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setThreadState(threadId, { blocked: true });
                        setConfirm(null);
                        notify(`${thread.name} is blocked`);
                      }}
                      className="flex-1 rounded-2xl bg-red-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                    >
                      Block
                    </button>
                  </div>
                </>
              )}

              {confirm === "unblock" && (
                <>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-3 text-base font-bold">Unblock {thread.name}?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    They will be able to message and call you again.
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
                        setThreadState(threadId, { blocked: false });
                        setConfirm(null);
                        notify("Unblocked");
                      }}
                      className="flex-1 rounded-2xl bg-primary px-3 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Unblock
                    </button>
                  </div>
                </>
              )}

              {confirm === "deleteChat" && (
                <>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-500/10">
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </div>
                  <h3 className="mt-3 text-base font-bold">Delete this chat?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    The whole conversation with {thread.name} will be removed from your inbox. It
                    stays in their inbox. This can't be undone.
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
                        clearThread(threadId);
                        pinMessage(threadId, null);
                        setConfirm(null);
                        navigate({ to: "/message" });
                      }}
                      className="flex-1 rounded-2xl bg-red-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}

              {confirm === "report" && !reportDone && (
                <>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/15">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <h3 className="mt-3 text-base font-bold">Report {thread.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Why are you reporting this conversation?
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setReportReason(r)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm transition ${
                          reportReason === r
                            ? "border-primary bg-primary/10 font-semibold"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {r}
                        {reportReason === r && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setConfirm(null)}
                      className="flex-1 rounded-2xl border border-border px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!reportReason}
                      onClick={() => {
                        setThreadState(threadId, { reported: reportReason ?? undefined });
                        setReportDone(true);
                      }}
                      className="flex-1 rounded-2xl bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                    >
                      Submit
                    </button>
                  </div>
                </>
              )}

              {confirm === "report" && reportDone && (
                <>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="mt-3 text-base font-bold">Thanks for letting us know</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Our moderation team will review "{reportReason}". You can also block{" "}
                    {thread.name} so they can't reach you while we review.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setConfirm(null)}
                      className="flex-1 rounded-2xl border border-border px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => {
                        setThreadState(threadId, { blocked: true });
                        setConfirm(null);
                        notify(`${thread.name} is blocked`);
                      }}
                      className="flex-1 rounded-2xl bg-red-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                    >
                      Block too
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      {blocked ? (
        <div className="z-10 shrink-0 border-t border-border bg-surface px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] text-center lg:pb-4">
          <p className="text-sm font-semibold text-foreground">
            You blocked {thread.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            You can't send or receive messages in this chat.
          </p>
          <button
            onClick={() => setConfirm("unblock")}
            className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-muted"
          >
            Unblock
          </button>
        </div>
      ) : (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="z-10 flex shrink-0 flex-col gap-2 border-t border-border bg-surface py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] safe-x lg:pb-3"
      >
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 overflow-hidden rounded-xl border-l-2 border-primary bg-muted/60 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-primary">
                Replying to {replyTo.from === "me" ? "yourself" : thread.name}
              </p>
              <p className="truncate text-xs text-muted-foreground font-bangla">{replyTo.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              aria-label="Cancel reply"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-surface"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative flex items-center gap-1 sm:gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (f.size > MAX_ATTACHMENT_BYTES) {
              notify("File is too large (max 4 MB)");
              return;
            }
            try {
              const att = await fileToAttachment(f);
              sendAttachment(threadId, att, replyTo ?? undefined);
              setReplyTo(null);
            } catch {
              notify("Could not read that file");
            }
          }}
        />
        <button
          type="button"
          aria-label="Attach"
          onClick={() => fileRef.current?.click()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted/60 text-foreground/70 transition hover:bg-muted active:scale-95"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <VoiceRecorder
          onSend={(clip) => {
            sendVoiceMessage(threadId, clip, replyTo ?? undefined);
            setReplyTo(null);
          }}
        />
        <div className="flex flex-1 items-center gap-2 rounded-3xl border border-border bg-muted/50 px-3 py-1.5">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Write a message…"
            className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground font-bangla"
          />
          <button
            type="button"
            aria-label="Emoji"
            onClick={() => setEmojiOpen((v) => !v)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-foreground/60 hover:bg-surface"
          >
            <Smile className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {emojiOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute bottom-14 right-2 z-40 w-[264px] rounded-2xl border border-border bg-surface p-2 shadow-2xl"
              >
                <div className="grid grid-cols-8 gap-1">
                  {COMPOSER_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setText((t) => t + e)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-lg transition hover:scale-110 hover:bg-muted"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition active:scale-95 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>

        </div>
      </form>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-none absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <CallOverlay
        open={call !== null}
        kind={call ?? "audio"}
        name={thread.name}
        initials={thread.initials}
        avatarColor={thread.avatarColor}
        onClose={() => setCall(null)}
      />
    </div>
  );
}

function MenuItem({
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
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-muted ${
        danger ? "text-red-600" : ""
      }`}
    >
      {icon}
      <span className="font-bangla">{label}</span>
    </button>
  );
}
