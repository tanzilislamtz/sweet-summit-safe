import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  MessageSquare,
  Search,
  Pencil,
  MailQuestion,
  ChevronRight,
  BellOff,
  Bell,
  Pin,
  PinOff,
  Archive,
  Ban,
  Trash2,
  CircleDot,
  ArrowLeft,
  ArchiveRestore,

} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ChatThread } from "@/lib/chat";
import { clearUnread } from "@/lib/notifications";
import { Topbar } from "@/components/Topbar";
import { MobileNav } from "@/components/MobileNav";
import { LeftNav } from "@/components/LeftNav";
import { useNavigationStore } from "@/lib/navigation-store";
import { cn } from "@/lib/utils";
import { messageRequests } from "@/lib/requests";
import {
  threads,
  getAllLatest,
  getSortedThreads,
  getUnreadCounts,
  subscribe,
  formatTime,
  markRead,
  allStatesSnapshot,
  getArchivedIds,
  getThreadState,
  setThreadState,
} from "@/lib/chat";


export const Route = createFileRoute("/message")({
  head: () => ({
    meta: [
      { title: "Messages — Learns Academy" },
      { name: "description", content: "Chat with tutors, students and parents on Learns Academy." },
    ],
  }),
  component: MessageLayout,
});

function useLatest() {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => JSON.stringify(getAllLatest()),
    () => "{}",
  );
}

function MessageLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isCollapsed = useNavigationStore((s) => s.isSidebarCollapsed);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inThread = pathname !== "/message" && pathname.startsWith("/message/");

  useEffect(() => {
    const t = window.setTimeout(() => clearUnread(), 1200);
    return () => window.clearTimeout(t);
  }, []);

  // Lock page scroll on mobile while inside a chat thread
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    if (!mq.matches) return;
    window.scrollTo(0, 0);
    document.body.classList.add("chat-thread-open");
    return () => {
      document.body.classList.remove("chat-thread-open");
    };
  }, [inThread]);



  return (
    <div
      className={`w-full max-w-full overflow-x-hidden bg-background text-foreground ${
        "h-[100dvh] overflow-hidden"
      }`}
    >
      {/* Header visible everywhere, hidden on mobile only inside a thread */}
      <div className={inThread ? "hidden lg:block" : "block"}>
        <Topbar variant="app" onMenu={() => setMenuOpen(true)} />
      </div>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main
        className={cn(
          "mx-auto grid w-full max-w-[1400px] transition-all duration-300 lg:h-[calc(100dvh-65px)] lg:overflow-hidden lg:px-8 lg:py-6",
          inThread ? "px-0 py-0" : "px-4 py-4",
          isCollapsed 
            ? "grid-cols-1 lg:grid-cols-[72px_minmax(0,1fr)]" 
            : "grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]"
        )}
      >

        <LeftNav stickyClass="lg:h-full" />
        <div className="min-w-0 lg:h-full lg:min-h-0">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:h-full lg:min-h-0 lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* Threads list — hidden on mobile when inside a thread */}
            <section className={`min-w-0 lg:h-full lg:min-h-0 ${inThread ? "hidden lg:block" : "block"}`}>
              <ThreadList />
            </section>
            {/* Thread view or empty state */}
            <section className={`min-w-0 lg:h-full lg:min-h-0 ${inThread ? "block" : "hidden lg:block"}`}>
              {inThread ? <Outlet /> : <EmptyPane />}
            </section>
          </div>
        </div>
      </main>
    </div>
  );

}

function ThreadList() {
  useLatest();
  const latest = getAllLatest();
  const unread = getUnreadCounts();
  const [q, setQ] = useState("");
  const [view, setView] = useState<"inbox" | "archived">("inbox");
  const [menu, setMenu] = useState<{ thread: ChatThread; x: number; y: number } | null>(null);
  const [confirm, setConfirm] = useState<{ thread: ChatThread; kind: "delete" | "block" } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const longPress = useRef<number | null>(null);

  const states = useSyncExternalStore(
    (cb) => subscribe(cb),
    () => allStatesSnapshot(),
    () => "{}",
  );
  void states;
  const archivedIds = getArchivedIds();
  const isArchived = (id: string) => archivedIds.includes(id);
  const isMuted = (id: string) => !!getThreadState(id).muted;

  // Land directly on the Archived view right after archiving from a chat
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("la_open_archived") === "1") {
        window.sessionStorage.removeItem("la_open_archived");
        setView("archived");
        setToast("Chat moved to Archived");
        window.setTimeout(() => setToast(null), 2200);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  };
  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const filtered = getSortedThreads()
    .filter((t) => !hidden.includes(t.id))
    .filter((t) => (view === "archived" ? isArchived(t.id) : !isArchived(t.id)))
    .filter(
      (t) =>
        t.name.toLowerCase().includes(q.toLowerCase()) ||
        (t.subject ?? "").toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => Number(pinned.includes(b.id)) - Number(pinned.includes(a.id)));


  return (
    <div className="flex h-[calc(100dvh-11rem)] min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-surface p-4 shadow-sm lg:h-full">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {view === "archived" ? (
            <button
              onClick={() => setView("inbox")}
              aria-label="Back to inbox"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition hover:bg-primary/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {view === "archived" ? "Archived" : "Messages"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {view === "archived"
                ? `${archivedIds.length} archived ${archivedIds.length === 1 ? "chat" : "chats"}`
                : `${threads.length - archivedIds.length} conversations`}
            </p>
          </div>
        </div>
        {view === "inbox" && (
          <button
            aria-label="New chat"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-95"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative mb-3 shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={view === "archived" ? "Search archived" : "Search conversations"}
          className="h-10 w-full rounded-full border border-border bg-muted/60 pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:bg-surface focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <ul className="-mr-1 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">
        {view === "inbox" && (
          <>
            {messageRequests.length > 0 && (
              <li>
                <Link
                  to="/message/requests"
                  className="mb-1 flex items-center gap-2.5 rounded-xl border border-border bg-accent/20 px-2.5 py-1.5 transition hover:bg-accent/30"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <MailQuestion className="h-3.5 w-3.5" />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-xs font-semibold">
                    Message requests
                    <span className="ml-1 font-normal text-muted-foreground">· {messageRequests.length} new</span>
                  </p>
                  <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {messageRequests.length}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            )}
            {archivedIds.length > 0 && (
              <li>
                <button
                  onClick={() => setView("archived")}
                  className="mb-1 flex w-full items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-2.5 py-1.5 text-left transition hover:bg-muted"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Archive className="h-3.5 w-3.5" />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-xs font-semibold">
                    Archived
                    <span className="ml-1 font-normal text-muted-foreground">
                      · {archivedIds.length} {archivedIds.length === 1 ? "chat" : "chats"}
                    </span>
                  </p>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            )}

          </>
        )}

        {view === "archived" && filtered.length === 0 && (
          <li className="mt-8 flex flex-col items-center px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-muted text-muted-foreground">
              <Archive className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold">No archived chats</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Archived chats are hidden from your inbox but never deleted. You can bring them back anytime.
            </p>
          </li>
        )}


        {filtered.map((t) => {
          const last = latest[t.id];
          const n = unread[t.id] ?? 0;
          const isUnread = n > 0;
          return (
            <li key={t.id} className="relative">
              <Link
                to="/message/$threadId"
                params={{ threadId: t.id }}
                data-allow-contextmenu
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenu({ thread: t, x: e.clientX, y: e.clientY });
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  longPress.current = window.setTimeout(
                    () => setMenu({ thread: t, x: touch.clientX, y: touch.clientY }),
                    420,
                  );
                }}
                onTouchEnd={() => longPress.current && window.clearTimeout(longPress.current)}
                onTouchMove={() => longPress.current && window.clearTimeout(longPress.current)}
                className={`group flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-muted ${isUnread ? "bg-primary/[0.06]" : ""}`}
                activeProps={{ className: "bg-accent/40" }}
              >
                <div className="relative shrink-0">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white"
                    style={{ background: t.avatarColor }}
                  >
                    {t.initials}
                  </div>
                  {t.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-surface" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${isUnread ? "font-extrabold text-foreground" : "font-semibold"}`}>
                      {t.name}
                    </p>
                    {pinned.includes(t.id) && <Pin className="h-3 w-3 shrink-0 text-primary" />}
                    {isMuted(t.id) && <BellOff className="h-3 w-3 shrink-0 text-muted-foreground" />}
                    {last && (
                      <span
                        className={`shrink-0 text-[11px] ${isUnread ? "font-bold text-primary" : "text-muted-foreground"}`}
                      >
                        {formatTime(last.at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p
                      className={`min-w-0 flex-1 truncate text-xs font-bangla ${
                        isUnread ? "font-bold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {last ? (last.from === "me" ? "You: " : "") + last.text : t.subject}
                    </p>
                    {isUnread && (
                      <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {n}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              {view === "archived" && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setThreadState(t.id, { archived: false });
                    notify(`${t.name.split(" ")[0]} moved back to inbox`);
                  }}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm transition hover:bg-primary/10"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  Unarchive
                </button>
              )}
            </li>

          );
        })}
      </ul>

      {/* Long-press / right-click menu */}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenu(null)}
            className="fixed inset-0 z-[70] bg-black/25 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                left: Math.min(Math.max(menu.x - 110, 12), Math.max(window.innerWidth - 252, 12)),
                top: Math.min(Math.max(menu.y - 40, 70), Math.max(window.innerHeight - 380, 70)),
              }}
              className="absolute w-60 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-2xl"
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

              {(unread[menu.thread.id] ?? 0) > 0 && (
                <RowItem
                  icon={<CircleDot className="h-4 w-4 text-primary" />}
                  label="Mark as read"
                  onClick={() => {
                    markRead(menu.thread.id);
                    setMenu(null);
                    notify("Marked as read");
                  }}
                />
              )}
              <RowItem
                icon={
                  isMuted(menu.thread.id) ? (
                    <Bell className="h-4 w-4 text-primary" />
                  ) : (
                    <BellOff className="h-4 w-4 text-primary" />
                  )
                }
                label={isMuted(menu.thread.id) ? "Unmute notifications" : "Mute notifications"}
                onClick={() => {
                  const was = isMuted(menu.thread.id);
                  setThreadState(menu.thread.id, { muted: !was });
                  setMenu(null);
                  notify(was ? "Notifications on" : "Notifications muted");
                }}
              />

              <RowItem
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
              <RowItem
                icon={<Archive className="h-4 w-4 text-primary" />}
                label={isArchived(menu.thread.id) ? "Unarchive chat" : "Archive chat"}
                onClick={() => {
                  const was = isArchived(menu.thread.id);
                  setThreadState(menu.thread.id, { archived: !was });
                  setMenu(null);
                  notify(was ? "Moved back to inbox" : "Chat moved to Archived");
                  if (!was) setView("archived");
                }}
              />

              <div className="my-1 h-px bg-border" />
              <RowItem
                icon={<Ban className="h-4 w-4 text-red-500" />}
                label="Block user"
                danger
                onClick={() => {
                  setConfirm({ thread: menu.thread, kind: "block" });
                  setMenu(null);
                }}
              />
              <RowItem
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

      {/* Confirmation */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirm(null)}
            className="fixed inset-0 z-[75] flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center"
          >
            <motion.div
              initial={{ y: 26, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 18, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-2xl"
            >
              <h3 className="text-base font-bold">
                {confirm.kind === "delete" ? "Delete chat?" : `Block ${confirm.thread.name.split(" ")[0]}?`}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {confirm.kind === "delete"
                  ? `This conversation will be removed from your inbox only. ${confirm.thread.name.split(" ")[0]} will still have their copy.`
                  : "They won't be able to message or call you, and this chat moves out of your inbox."}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setConfirm(null)}
                  className="flex-1 rounded-2xl border border-border px-3 py-2.5 text-sm font-semibold transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setHidden((h) => [...h, confirm.thread.id]);
                    notify(confirm.kind === "delete" ? "Chat deleted" : "User blocked");
                    setConfirm(null);
                  }}
                  className="flex-1 rounded-2xl bg-red-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  {confirm.kind === "delete" ? "Delete" : "Block"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-lg lg:bottom-10"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RowItem({
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
      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition hover:bg-muted ${
        danger ? "text-red-500" : "text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EmptyPane() {
  return (
    <div className="hidden h-full min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface p-10 text-center lg:flex">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 text-primary">
        <MessageSquare className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Pick a conversation</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Select a chat from the left to see messages, or start a new one from any tutor or student profile.
      </p>
    </div>
  );
}
