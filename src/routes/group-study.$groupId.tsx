import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  Globe,
  Lock,
  Check,
  Video,
  FileText,
  CalendarDays,
  Radio,
  Download,
  MessageCircle,
  
  Share2,
  ShieldCheck,
  Settings2,
  ImagePlus,
  X,
  Trash2,
  UserMinus,
  UserPlus,
  Search,
  ChevronDown,
  LogOut,
  Heart,
  MoreHorizontal,
  Star,
  EyeOff,
  Link2,
  BellOff,
  Flag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FavoriteButton } from "@/components/FavoriteButton";
import type { GroupMember, StudyGroup } from "@/data/groups";
import { GROUPS_EVENT, findGroup, isJoined, setJoined } from "@/lib/groups";
import {
  addGroupPost,
  addPostComment,
  applyGroupOverrides,
  canManageGroup,
  deleteGroupPost,
  getGroupSettings,
  hideGroupPost,
  isPostLoved,
  isRoomJoined,
  joinRoom,
  listGroupPosts,
  listGroupRooms,
  listHiddenPosts,
  listPostComments,
  resolveMembers,
  togglePostLove,
  type GroupPostComment,
  type StoredPost,
} from "@/lib/group-workspace";
import { getSession } from "@/lib/session";
import { useAdminAccess } from "@/lib/use-admin-access";

export const Route = createFileRoute("/group-study/$groupId")({
  head: () => ({
    meta: [
      { title: "Study Group Workspace — Learns Academy" },
      {
        name: "description",
        content:
          "Group feed, live study rooms, members, shared files, events and admin tools in one compact workspace.",
      },
      { property: "og:title", content: "Study Group Workspace — Learns Academy" },
      {
        property: "og:description",
        content: "Post updates with photos, run study rooms and manage members and roles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupDetailPage,
});

const BASE_TABS = ["Feed", "Rooms", "Members", "Files", "Events", "About"] as const;
type Tab = (typeof BASE_TABS)[number];

function GroupDetailPage() {
  const { groupId } = useParams({ from: "/group-study/$groupId" });
  const [tab, setTab] = useState<Tab>("Feed");
  const [group, setGroup] = useState<StudyGroup | undefined>();
  const [joined, setJoinedState] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const sync = () => {
      const g = findGroup(groupId);
      setGroup(g ? applyGroupOverrides(g) : undefined);
      setJoinedState(g ? isJoined(g) : false);
      setTick((t) => t + 1);
    };
    sync();
    window.addEventListener(GROUPS_EVENT, sync);
    return () => window.removeEventListener(GROUPS_EVENT, sync);
  }, [groupId]);

  const { isAdmin: isSiteAdmin } = useAdminAccess();
  const canManage = group ? (canManageGroup(group, joined) || isSiteAdmin) : false;
  const tabs: Tab[] = [...BASE_TABS];

  if (!group) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="body">This group could not be found.</p>
        <Link to="/group-study" className="mt-3 inline-block text-sm font-semibold text-primary">
          Back to Group Study
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <Link
        to="/group-study"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All groups
      </Link>

      <GroupHeader group={group} joined={joined} canManage={canManage} />

      <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-semibold transition ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "Feed" && <FeedTab group={group} tick={tick} />}
      {tab === "Rooms" && <RoomsTab group={group} />}
      {tab === "Members" && <MembersTab group={group} />}
      {tab === "Files" && <FilesTab group={group} />}
      {tab === "Events" && <EventsTab group={group} />}
      {tab === "About" && <AboutTab group={group} />}
    </div>
  );
}

/* --------------------------- header --------------------------- */

function GroupHeader({
  group,
  joined,
  canManage,
}: {
  group: StudyGroup;
  joined: boolean;
  canManage: boolean;
}) {
  const stats = [
    { icon: Users, value: group.members, label: "members" },
    { icon: Radio, value: group.onlineNow, label: "online" },
    { icon: Video, value: group.rooms, label: "rooms" },
    { icon: FileText, value: group.files, label: "files" },
  ];

  return (
    <header className="overflow-hidden rounded-2xl border border-border bg-surface text-foreground shadow-md">
      <div className="relative h-28 w-full overflow-hidden bg-primary/10">
        {group.cover ? (
          <img src={group.cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary to-primary/60" />
        )}
      </div>
      <div className="relative z-10 -mt-8 flex flex-col px-4 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-3">
            <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface p-1 shadow-lg ring-1 ring-border">
              {group.icon ? (
                <img src={group.icon} alt={group.name} className="h-full w-full rounded-xl object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
                  {group.name.charAt(0)}
                </span>
              )}
            </span>
            <div className="mb-1 min-w-0">
              <h1 className="truncate text-xl font-bold">{group.name}</h1>
              <p className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                {group.privacy === "Public Group" ? (
                  <Globe className="h-3 w-3 shrink-0" />
                ) : (
                  <Lock className="h-3 w-3 shrink-0" />
                )}
                {group.privacy} · {group.batch}
                {canManage && " · Admin"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {joined ? (
              <JoinedMenu groupId={group.id} />
            ) : (
              <button
                onClick={() => setJoined(group.id, true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
              >
                <UserPlus className="h-3.5 w-3.5" /> Join
              </button>
            )}
            <button className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted sm:inline-flex">
              <Share2 className="h-3.5 w-3.5" /> Invite
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border bg-muted/30 px-4 py-2 text-[11px] font-medium text-muted-foreground">
        {stats.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <s.icon className="h-3.5 w-3.5" />
            <b className="font-bold">{s.value}</b> {s.label}
          </span>
        ))}
      </div>
    </header>
  );
}

/** "Joined" pill with a small menu holding the leave-group action. */
function JoinedMenu({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ring-1 ring-primary-foreground/30 transition hover:bg-primary-foreground/10 sm:w-auto"
      >
        <Check className="h-3.5 w-3.5" /> Joined
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-border bg-surface text-foreground shadow-lg sm:left-auto sm:w-44"
          >
            <button
              role="menuitem"
              onClick={() => {
                setJoined(groupId, false);
                setOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-destructive hover:bg-destructive/10 sm:justify-start"
            >
              <LogOut className="h-3.5 w-3.5" /> Leave group
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------- shared bits --------------------------- */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function PanelHead({ icon: Icon, title, right }: { icon: typeof Users; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold">{title}</h2>
      {right}
    </div>
  );
}

function Avatar({ initials, size = "sm" }: { initials: string; size?: "sm" | "xs" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-muted font-bold text-foreground/70 ${
        size === "xs" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-[11px]"
      }`}
    >
      {initials}
    </span>
  );
}

function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "primary" | "tutor" }) {
  const tones = {
    muted: "bg-muted text-foreground/70",
    primary: "bg-primary/10 text-primary",
    tutor: "bg-tutor/10 text-tutor",
  } as const;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-4 py-6 text-center text-xs text-muted-foreground">{text}</p>;
}

function FilterChips({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
            value === o
              ? "bg-primary text-primary-foreground"
              : "border border-border text-foreground/70 hover:bg-muted"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-[160px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none transition focus:border-primary/50"
      />
    </div>
  );
}

/* ----------------------------- Feed ----------------------------- */

function FeedTab({ group, tick }: { group: StudyGroup; tick: number }) {
  const [filter, setFilter] = useState("All");
  const stored = useMemo(() => listGroupPosts(group.id), [group.id, tick]);
  const hidden = useMemo(() => listHiddenPosts(group.id), [group.id, tick]);
  const posts: StoredPost[] = useMemo(
    () =>
      [...stored, ...group.postList.map((p) => ({ ...p, createdAt: 0 }) as StoredPost)].filter(
        (p) => !hidden.includes(p.id),
      ),
    [stored, group.postList, hidden],
  );
  const sectionNames = useMemo(
    () => ["All", ...Array.from(new Set(posts.map((p) => p.section)))],
    [posts],
  );
  const visible = posts.filter((p) => filter === "All" || p.section === filter);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 space-y-3">
        <Composer group={group} />
        <FilterChips value={filter} onChange={setFilter} options={sectionNames} />
        {visible.map((p) => (
          <PostCard key={p.id} post={p} groupId={group.id} removable={p.createdAt > 0} />
        ))}
        {visible.length === 0 && <Panel><Empty text="No posts here yet." /></Panel>}
      </div>

      <aside className="hidden min-w-0 space-y-3 lg:block">
        <Panel>
          <PanelHead icon={Radio} title="Live now" />
          <ul className="divide-y divide-border">
            {group.roomList.filter((r) => r.live).slice(0, 3).map((r) => (
              <li key={r.id} className="px-4 py-2.5">
                <p className="truncate text-xs font-semibold">{r.title}</p>
                <p className="text-[11px] text-muted-foreground">{r.participants} joined</p>
              </li>
            ))}
            {group.roomList.filter((r) => r.live).length === 0 && <li><Empty text="No live rooms." /></li>}
          </ul>
        </Panel>
        <Panel>
          <PanelHead icon={CalendarDays} title="Next up" />
          <ul className="divide-y divide-border">
            {group.eventList.slice(0, 3).map((e) => (
              <li key={e.id} className="px-4 py-2.5">
                <p className="truncate text-xs font-semibold">{e.title}</p>
                <p className="text-[11px] text-muted-foreground">{e.date} · {e.time}</p>
              </li>
            ))}
            {group.eventList.length === 0 && <li><Empty text="Nothing scheduled." /></li>}
          </ul>
        </Panel>
      </aside>
    </div>
  );
}

function Composer({ group }: { group: StudyGroup }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [section, setSection] = useState(group.sections[0]?.name ?? "Common");
  const fileRef = useRef<HTMLInputElement>(null);
  const author = getSession()?.name || "You";

  const pick = (files: FileList | null) => {
    if (!files) return;
    Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 4)
      .forEach((f) => {
        const reader = new FileReader();
        reader.onload = () => setImages((prev) => [...prev, String(reader.result)].slice(0, 4));
        reader.readAsDataURL(f);
      });
  };

  const submit = () => {
    if (!body.trim() && images.length === 0) return;
    const post = addGroupPost(group.id, { body: body.trim(), section, images, author });
    
    const settings = getGroupSettings(group);
    const isQuestion = body.trim().includes("$");
    const willNeedApproval = settings.postsNeedApproval && !(settings.autoApproveQuestions && isQuestion);
    
    if (willNeedApproval) {
      toast.success("Post submitted for admin approval");
    } else {
      toast.success("Post shared with the group");
    }

    setBody("");
    setImages([]);
    setOpen(false);
  };

  if (!open) {
    return (
      <Panel className="flex items-center gap-3 p-3">
        <Avatar initials={author.charAt(0).toUpperCase()} />
        <button
          onClick={() => setOpen(true)}
          className="min-w-0 flex-1 truncate rounded-full bg-muted px-4 py-2 text-left text-xs text-muted-foreground hover:bg-muted/70"
        >
          Share a note, question or update with the group…
        </button>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-tutor hover:bg-tutor/10"
        >
          <ImagePlus className="h-4 w-4" /> <span className="hidden sm:inline">Photo</span>
        </button>
      </Panel>
    );
  }

  return (
    <Panel className="p-3">
      <div className="flex items-center gap-2">
        <Avatar initials={author.charAt(0).toUpperCase()} />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">{author}</span>
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] font-semibold outline-none"
        >
          {[...group.sections.map((s) => s.name), "Common"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="What do you want to share with the group?"
        className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50"
      />

      {images.length > 0 && (
        <div className={`mt-3 grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {images.map((src, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl border border-border">
              <img src={src} alt={`Attachment ${i + 1}`} className="h-32 w-full object-cover" />
              <button
                onClick={() => setImages(images.filter((_, x) => x !== i))}
                aria-label="Remove image"
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-foreground/70 text-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => pick(e.target.files)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
        >
          <ImagePlus className="h-4 w-4 text-tutor" /> Add photo
        </button>
        <span className="flex-1" />
        <button
          onClick={() => { setOpen(false); setBody(""); setImages([]); }}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!body.trim() && images.length === 0}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </Panel>
  );
}

function PostCard({
  post,
  groupId,
  removable,
}: {
  post: StoredPost;
  groupId: string;
  removable: boolean;
}) {
  const me = getSession()?.name || "You";

  // Reactions / comments are persisted locally so the group feed behaves
  // exactly like the main feed across reloads.
  const [loved, setLoved] = useState(false);
  const [comments, setComments] = useState<GroupPostComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [shared, setShared] = useState(0);

  useEffect(() => {
    setLoved(isPostLoved(groupId, post.id));
    setComments(listPostComments(groupId, post.id));
  }, [groupId, post.id]);

  const loves = post.likes + (loved ? 1 : 0);
  const commentCount = post.comments + comments.length;

  const toggleLove = () => setLoved(togglePostLove(groupId, post.id));

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setComments((prev) => [...prev, addPostComment(groupId, post.id, { author: me, text })]);
    setDraft("");
  };

  const onShare = () => {
    setShared((n) => n + 1);
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Post link copied — share it with your group");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Panel className="p-4">
        <div className="flex items-start gap-2.5">
          <Avatar initials={post.initials} />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-xs font-bold">{post.author}</span>
              <Pill>{post.section}</Pill>
              <span className="shrink-0 text-[11px] text-muted-foreground">{post.time}</span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Post options"
                    className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <div className="flex w-full items-center justify-between px-2 py-1.5">
                      <div className="flex items-center">
                        <Star className="mr-2 h-4 w-4" /> Save
                      </div>
                      <FavoriteButton
                        item={{
                          id: post.id,
                          type: "post",
                          title: post.body.slice(0, 60) || "Group post",
                          postData: {
                            author: post.author,
                            role: "Student",
                            time: post.time,
                            body: post.body,
                            tag: post.section,
                          },
                        }}
                        compact
                      />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toast.success("Marked as interested")}>
                    <Heart className="mr-2 h-4 w-4" /> Interested
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => hideGroupPost(groupId, post.id)}>
                    <EyeOff className="mr-2 h-4 w-4" /> Hide post
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success("Link copied");
                    }}
                  >
                    <Link2 className="mr-2 h-4 w-4" /> Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toast.success("Notifications muted for this post")}>
                    <BellOff className="mr-2 h-4 w-4" /> Mute notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {removable ? (
                    <DropdownMenuItem
                      onSelect={() => {
                        deleteGroupPost(groupId, post.id);
                        toast.success("Post deleted");
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete post
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onSelect={() => toast.success("Reported to group admins")}
                      className="text-destructive focus:text-destructive"
                    >
                      <Flag className="mr-2 h-4 w-4" /> Report to admins
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {post.body && <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>}

            {post.images && post.images.length > 0 && (
              <div className={`mt-2.5 grid gap-1.5 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {post.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Shared by ${post.author}`}
                    loading="lazy"
                    className="max-h-72 w-full rounded-xl border border-border object-cover"
                  />
                ))}
              </div>
            )}

            {post.attachment && (
              <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-border bg-muted px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{post.attachment.name}</span>
                  <span className="text-[11px] text-muted-foreground">{post.attachment.meta}</span>
                </span>
              </div>
            )}

            <footer className="mt-3 flex items-center gap-1 border-t border-border pt-2.5">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleLove}
                aria-pressed={loved}
                className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  loved
                    ? "bg-destructive/10 text-destructive"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="relative inline-flex">
                  <motion.span
                    key={loved ? "on" : "off"}
                    initial={{ scale: 0.6, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 14 }}
                    className="inline-flex"
                  >
                    <Heart className={`h-4 w-4 ${loved ? "fill-current" : ""}`} />
                  </motion.span>

                  <AnimatePresence>
                    {loved && (
                      <motion.span
                        key="ring"
                        initial={{ scale: 0.3, opacity: 0.6 }}
                        animate={{ scale: 2.4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="pointer-events-none absolute inset-0 rounded-full border-2 border-destructive"
                      />
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {loved &&
                      [0, 1, 2, 3, 4].map((i) => {
                        const angle = (i / 5) * Math.PI - Math.PI / 2;
                        const dist = 28 + (i % 2) * 10;
                        return (
                          <motion.span
                            key={`burst-${i}`}
                            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
                            animate={{
                              x: Math.cos(angle) * dist,
                              y: Math.sin(angle) * dist - 6,
                              scale: 1,
                              opacity: 0,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.02 }}
                            className="pointer-events-none absolute left-0 top-0 text-destructive"
                          >
                            <Heart className="h-3 w-3 fill-current" />
                          </motion.span>
                        );
                      })}
                  </AnimatePresence>
                </span>

                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={loves}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="tabular-nums"
                  >
                    {loves}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowComments((v) => !v)}
                aria-expanded={showComments}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  showComments
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                {commentCount}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onShare}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
              >
                <Share2 className="h-4 w-4" />
                {shared}
              </motion.button>
            </footer>

            <AnimatePresence initial={false}>
              {showComments && (
                <motion.div
                  key="comments"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-3 border-t border-border pt-3">
                    {comments.length === 0 && (
                      <p className="text-xs text-muted-foreground">Be the first to comment.</p>
                    )}
                    {comments.map((c) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <Avatar initials={c.author.charAt(0).toUpperCase()} size="xs" />
                        <div className="min-w-0 flex-1 rounded-2xl bg-muted/60 px-3 py-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-foreground">{c.author}</span>
                            <span className="text-muted-foreground">· {c.time}</span>
                          </div>
                          <p className="mt-0.5 text-sm text-foreground/85">{c.text}</p>
                        </div>
                      </motion.div>
                    ))}

                    <form onSubmit={submitComment} className="flex gap-2 pt-1">
                      <Avatar initials={me.charAt(0).toUpperCase()} size="xs" />
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Write a comment…"
                        className="h-9 min-w-0 flex-1 rounded-full border border-transparent bg-muted/60 px-4 text-sm outline-none focus:border-primary/30 focus:bg-surface focus:ring-4 focus:ring-primary/10"
                      />
                      <button
                        type="submit"
                        disabled={!draft.trim()}
                        className="shrink-0 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-40"
                      >
                        Post
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}


/* ----------------------------- Rooms ----------------------------- */

function RoomsTab({ group }: { group: StudyGroup }) {
  const live = group.roomList.filter((r) => r.live);
  const upcoming = group.roomList.filter((r) => !r.live);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {live.map((r) => (
          <Panel key={r.id} className="p-3.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[9px] font-bold text-destructive-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground" /> LIVE
              </span>
              <Pill>{r.section}</Pill>
              <span className="ml-auto text-[11px] text-muted-foreground">{r.participants}</span>
            </div>
            <h3 className="mt-2 truncate text-sm font-bold">{r.title}</h3>
            <p className="truncate text-[11px] text-muted-foreground">{r.focus} · {r.host}</p>
            <button className="mt-2.5 w-full rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110">
              Join room
            </button>
          </Panel>
        ))}
        {live.length === 0 && <Panel className="sm:col-span-2 xl:col-span-3"><Empty text="No live rooms right now." /></Panel>}
      </div>

      <Panel>
        <PanelHead icon={CalendarDays} title="Upcoming rooms" />
        <ul className="divide-y divide-border">
          {upcoming.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{r.title}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{r.when} · {r.host}</span>
              </span>
              <Pill>{r.section}</Pill>
              <button className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold hover:bg-muted">
                Remind
              </button>
            </li>
          ))}
          {upcoming.length === 0 && <li><Empty text="Nothing scheduled yet." /></li>}
        </ul>
      </Panel>
    </div>
  );
}

/* ---------------------------- Members ---------------------------- */

function MembersTab({ group }: { group: StudyGroup }) {
  const [q, setQ] = useState("");
  const [section, setSection] = useState("All");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const sync = () => setTick((t) => t + 1);
    window.addEventListener(GROUPS_EVENT, sync);
    return () => window.removeEventListener(GROUPS_EVENT, sync);
  }, []);

  const members = useMemo(() => resolveMembers(group), [group, tick]);
  const sections = ["All", ...Array.from(new Set(members.map((m) => m.section)))];
  const list = members.filter(
    (m) =>
      m.name.toLowerCase().includes(q.trim().toLowerCase()) &&
      (section === "All" || m.section === section),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search members" />
        <FilterChips value={section} onChange={setSection} options={sections} />
      </div>

      <Panel>
        <ul className="divide-y divide-border">
          {list.map((m) => (
            <MemberRow key={m.id} member={m} />
          ))}
          {list.length === 0 && <li><Empty text="No members match these filters." /></li>}
        </ul>
      </Panel>
    </div>
  );
}

function MemberRow({ member }: { member: GroupMember }) {
  const statusTone =
    member.status === "Online" ? "bg-tutor" : member.status === "Away" ? "bg-warning" : "bg-muted-foreground/50";

  return (
    <li className="flex items-center gap-2.5 px-4 py-2.5">
      <span className="relative shrink-0">
        <Avatar initials={member.initials} />
        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface ${statusTone}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{member.name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {member.section} · {member.expertise}
        </span>
      </span>
      <Pill tone={member.role === "Admin" ? "primary" : member.role === "Tutor" ? "tutor" : "muted"}>
        {member.role}
      </Pill>
    </li>
  );
}

/* ----------------------------- Files ----------------------------- */

function FilesTab({ group }: { group: StudyGroup }) {
  const [q, setQ] = useState("");
  const [section, setSection] = useState("All");
  const sections = ["All", ...Array.from(new Set(group.fileList.map((f) => f.section)))];
  const list = group.fileList.filter(
    (f) =>
      f.name.toLowerCase().includes(q.trim().toLowerCase()) &&
      (section === "All" || f.section === section),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search files" />
        <FilterChips value={section} onChange={setSection} options={sections} />
      </div>
      <Panel>
        <ul className="divide-y divide-border">
          {list.map((f) => (
            <li key={f.id} className="flex items-center gap-2.5 px-4 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{f.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {f.uploadedBy} · {f.uploadedOn} · {f.size}
                </span>
              </span>
              <Pill>{f.section}</Pill>
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                <Download className="h-3.5 w-3.5" /> {f.downloads}
              </span>
            </li>
          ))}
          {list.length === 0 && <li><Empty text="No files found." /></li>}
        </ul>
      </Panel>
    </div>
  );
}

/* ----------------------------- Events ----------------------------- */

function EventsTab({ group }: { group: StudyGroup }) {
  return (
    <Panel>
      <PanelHead icon={CalendarDays} title="Upcoming events" />
      <ul className="divide-y divide-border">
        {group.eventList.map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-4 py-3">
            <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-primary/10 py-1.5 text-primary">
              <span className="text-[11px] font-bold leading-tight">{e.date}</span>
              <span className="text-[9px] font-semibold text-muted-foreground">{e.day}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{e.title}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {e.time} · {e.section} · {e.going} going
              </span>
            </span>
            <Pill>{e.mode}</Pill>
            <button className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:brightness-110">
              Join
            </button>
          </li>
        ))}
        {group.eventList.length === 0 && <li><Empty text="No events scheduled." /></li>}
      </ul>
    </Panel>
  );
}

/* ----------------------------- About ----------------------------- */

function AboutTab({ group }: { group: StudyGroup }) {
  const facts: [string, string][] = [
    ["Group type", group.privacy],
    ["Created on", group.createdOn],
    ["Created by", group.createdBy],
    ["Language", group.language],
    ["Members", `${group.members}`],
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Panel className="lg:col-span-2">
        <PanelHead icon={ShieldCheck} title={`About ${group.name}`} />
        <div className="space-y-3 p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{group.description}</p>
          <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 text-xs">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="truncate font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Group rules
            </p>
            <ul className="space-y-1">
              {group.rules.map((r) => (
                <li key={r} className="flex items-start gap-2 text-xs">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tutor" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHead icon={Users} title="Sections" />
        <ul className="divide-y divide-border">
          {group.sections.map((s) => (
            <li key={s.id} className="px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-xs font-semibold">{s.name}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{s.members}</span>
              </div>
              <p className="mt-1 flex flex-wrap gap-1">
                {s.subjects.slice(0, 3).map((sub) => (
                  <Pill key={sub}>{sub}</Pill>
                ))}
              </p>
            </li>
          ))}
          {group.sections.length === 0 && <li><Empty text="No sections yet." /></li>}
        </ul>
      </Panel>
    </div>
  );
}
