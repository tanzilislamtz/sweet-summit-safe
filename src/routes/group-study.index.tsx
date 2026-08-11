import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  Globe,
  Lock,
  Sparkles,
  BookOpen,
  Video,
  FileText,
  X,
  Check,
  Loader2,
  ChevronDown,
  LogOut,
  ShieldCheck,
  ImagePlus,
} from "lucide-react";
import { studyGroups, type StudyGroup } from "@/data/groups";
import {
  GROUPS_EVENT,
  createGroup,
  hydrateCreatedGroup,
  isJoined,
  listCreatedGroups,
  setJoined,
} from "@/lib/groups";
import { applyGroupOverrides, updateGroupSettings } from "@/lib/group-workspace";
import { useAdminAccess } from "@/lib/use-admin-access";

export const Route = createFileRoute("/group-study/")({
  head: () => ({
    meta: [
      { title: "Group Study — Create & Join Study Groups | Learns Academy" },
      {
        name: "description",
        content:
          "Discover suggested study groups, create your own batch group, and study together with live rooms, notes and events.",
      },
      { property: "og:title", content: "Group Study — Learns Academy" },
      {
        property: "og:description",
        content: "Create a study group or join a suggested one and prepare with your batch.",
      },
    ],
  }),
  component: GroupStudyIndex,
});

const TAG_OPTIONS = ["Science", "Commerce", "Humanities", "Common", "Higher Math", "English"];

function GroupStudyIndex() {
  const { isAdmin } = useAdminAccess();
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const sync = () => setVersion((v) => v + 1);
    window.addEventListener(GROUPS_EVENT, sync);
    return () => window.removeEventListener(GROUPS_EVENT, sync);
  }, []);

  const [created, setCreated] = useState<StudyGroup[]>([]);
  useEffect(() => {
    setCreated(listCreatedGroups().map(hydrateCreatedGroup));
  }, [version]);

  const all = useMemo(
    () => [...created, ...studyGroups].map(applyGroupOverrides),
    [created],
  );
  const myGroups = all.filter((g) => isJoined(g));
  const suggested = all.filter((g) => !isJoined(g));

  const filter = (list: StudyGroup[]) =>
    list.filter((g) =>
      `${g.name} ${g.batch} ${g.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()),
    );

  return (
    <div className="space-y-4 pb-10">
      <header className="overflow-hidden rounded-2xl border border-border bg-primary p-4 text-primary-foreground shadow-md sm:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-xl">Study together, stay consistent</h1>
            <p className="mt-1 line-clamp-2 text-xs text-primary-foreground/80">
              Create a group for your batch or join a suggested one — notes, live rooms and events in one place.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground transition hover:brightness-95"
            >
              <Plus className="h-4 w-4" /> Create
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-primary-foreground/85">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> <b>{all.length}</b> groups
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> <b>{myGroups.length}</b> joined
          </span>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search groups by name, batch or subject"
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-xs outline-none transition focus:border-primary/50"
        />
      </div>

      {myGroups.length > 0 && (
        <Section title="Your groups" icon={BookOpen}>
          {filter(myGroups).map((g) => (
            <GroupCard key={g.id} group={g} joined />
          ))}
        </Section>
      )}

      <Section title="Suggested for you" icon={Sparkles}>
        {filter(suggested).map((g) => (
          <GroupCard key={g.id} group={g} joined={false} />
        ))}
      </Section>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h2 className="flex items-center gap-2 text-[13px] font-bold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function GroupCard({ group, joined }: { group: StudyGroup; joined: boolean }) {
  const [isJoining, setIsJoining] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("click", handle);
    return () => window.removeEventListener("click", handle);
  }, [menuOpen]);

  const handleJoin = () => {
    if (isJoining || joined) return;
    setIsJoining(true);
    setTimeout(() => {
      setJoined(group.id, true);
      setIsJoining(false);
    }, 800);
  };

  const handleLeave = () => {
    setMenuOpen(false);
    setIsJoining(true);
    setTimeout(() => {
      setJoined(group.id, false);
      setIsJoining(false);
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-3.5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <Link
        to="/group-study/$groupId"
        params={{ groupId: group.id }}
        className="block"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            {group.icon ? (
              <img src={group.icon} alt={group.name} className="h-full w-full object-cover" />
            ) : (
              group.name.charAt(0)
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-bold group-hover:text-primary">
              {group.name}
            </h3>
            <p className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground">
              {group.privacy === "Public Group" ? (
                <Globe className="h-3 w-3 shrink-0" />
              ) : (
                <Lock className="h-3 w-3 shrink-0" />
              )}
              {group.batch}
            </p>
          </div>
        </div>

        <p className="mt-2.5 line-clamp-2 text-xs text-muted-foreground">{group.tagline}</p>

        <div className="mt-2.5 flex flex-wrap gap-1">
          {group.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground/70"
            >
              {t}
            </span>
          ))}
        </div>
      </Link>

      <div className="mt-3 flex items-center gap-4 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {group.members}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5" /> {group.rooms}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" /> {group.files}
        </span>
        <Link
          to="/group-study/$groupId"
          params={{ groupId: group.id }}
          className="ml-auto font-semibold text-primary hover:underline"
        >
          Visit
        </Link>
      </div>

      <div className="relative mt-2.5">
        {joined ? (
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((s) => !s);
              }}
              disabled={isJoining}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-[11px] font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isJoining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {isJoining ? "Leaving..." : "Joined"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLeave();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-[11px] font-semibold text-destructive transition hover:bg-destructive/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Leave group
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleJoin();
            }}
            disabled={isJoining}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Joining...
              </>
            ) : (
              "Join"
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}


function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [batch, setBatch] = useState("");
  const [tagline, setTagline] = useState("");
  const [icon, setIcon] = useState<string | undefined>();
  const [cover, setCover] = useState<string | undefined>();
  const [privacy, setPrivacy] = useState<"Public Group" | "Private Group">("Public Group");
  const [approveMembers, setApproveMembers] = useState(false);
  const [approvePosts, setApprovePosts] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  const valid = name.trim().length >= 3;

  const submit = () => {
    if (!valid) return;
    const group = createGroup({
      name: name.trim(),
      batch: batch.trim() || "General Batch",
      tagline: tagline.trim() || "A study group for focused preparation.",
      privacy,
      tags: tags.length ? tags : ["Common"],
    });

    // Save initial workspace settings for the new group
    updateGroupSettings(hydrateCreatedGroup(group), {
      requireMemberApproval: approveMembers,
      approveMembers: approveMembers,
      postsNeedApproval: approvePosts,
      icon,
      cover,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative flex h-full max-h-[850px] w-full max-w-5xl overflow-hidden rounded-[32px] border border-border bg-surface shadow-2xl"
      >
        {/* Left Side: Form */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-border bg-background/50">
          <div className="sticky top-0 z-10 flex items-start justify-between bg-surface/80 px-8 py-6 backdrop-blur-md">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Create Study Group</h2>
              <p className="text-xs font-medium text-muted-foreground">Launch your community in seconds</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-10 w-10 place-items-center rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-10 pt-2 custom-scrollbar">
            <div className="space-y-8">
              {/* Media Section */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Branding & Visuals
                </label>
                <div className="flex gap-6">
                  <div className="group relative h-24 w-24 shrink-0">
                    <div className="h-full w-full overflow-hidden rounded-3xl bg-primary/5 ring-1 ring-primary/10 transition-all group-hover:ring-primary/30">
                      {icon ? (
                        <img src={icon} alt="Icon preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-primary/40">
                          <Users className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setIcon(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 ring-surface">
                      <ImagePlus className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="group relative h-24 flex-1 overflow-hidden rounded-3xl border border-dashed border-border bg-muted/5 transition-all hover:border-primary/40 hover:bg-primary/[0.02]">
                    {cover ? (
                      <img src={cover} alt="Cover preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground/60">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Add Cover Photo</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setCover(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-5">
                <Field label="Group Identity">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Science Hub 2026"
                    className="w-full rounded-2xl border border-border bg-surface px-5 py-3.5 text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 placeholder:text-muted-foreground/40"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Batch / Class">
                    <input
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      placeholder="SSC 2026"
                      className="w-full rounded-2xl border border-border bg-surface px-5 py-3.5 text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                    />
                  </Field>
                  <Field label="Visibility">
                    <select
                      value={privacy}
                      onChange={(e) => setPrivacy(e.target.value as any)}
                      className="w-full rounded-2xl border border-border bg-surface px-5 py-3.5 text-sm font-bold outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                    >
                      <option value="Public Group">Public Group</option>
                      <option value="Private Group">Private Group</option>
                    </select>
                  </Field>
                </div>
              </div>

              <Field label="Tagline / Description">
                <textarea
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  rows={3}
                  placeholder="Tell students what this group is about..."
                  className="w-full resize-none rounded-2xl border border-border bg-surface px-5 py-4 text-sm font-medium leading-relaxed outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                />
              </Field>

              {/* Moderation */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Permissions & Moderation
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setApproveMembers(!approveMembers)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                      approveMembers
                        ? "border-primary/40 bg-primary/[0.03] text-primary"
                        : "border-border bg-surface hover:bg-muted/50"
                    }`}
                  >
                    <div className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                      approveMembers ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Member Approval</p>
                      <p className="text-[10px] opacity-70">{approveMembers ? "Admin must approve" : "Anyone can join"}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setApprovePosts(!approvePosts)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                      approvePosts
                        ? "border-primary/40 bg-primary/[0.03] text-primary"
                        : "border-border bg-surface hover:bg-muted/50"
                    }`}
                  >
                    <div className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                      approvePosts ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Post Approval</p>
                      <p className="text-[10px] opacity-70">{approvePosts ? "Admin must review" : "Instant posting"}</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tags */}
              <Field label="Categorization">
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((t) => {
                    const on = tags.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                          on
                            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "border-border bg-surface hover:border-primary/30 hover:bg-primary/[0.02]"
                        }`}
                      >
                        {on && <Check className="h-3 w-3" />}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </div>

          <div className="flex gap-4 border-t border-border bg-surface/50 px-8 py-6 backdrop-blur-md">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl border border-border py-4 text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!valid}
              className="flex-[2] rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50 active:scale-[0.98]"
            >
              Launch Group
            </button>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className="hidden w-[400px] flex-col bg-muted/30 lg:flex">
          <div className="px-8 py-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Live Preview</h3>
            <p className="text-[10px] font-medium text-muted-foreground">This is how your group will look to others</p>
          </div>
          
          <div className="flex-1 p-8">
            <div className="perspective-1000">
              <motion.div 
                animate={{ rotateY: 2, rotateX: 2 }}
                className="overflow-hidden rounded-[32px] border border-border bg-surface shadow-2xl"
              >
                {/* Mock Card Preview */}
                <div className="relative h-24 w-full bg-primary/10">
                  {cover ? (
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
                  )}
                  <div className="absolute -bottom-6 left-6 h-14 w-14 overflow-hidden rounded-2xl bg-surface p-1 shadow-lg ring-1 ring-border">
                    <div className="h-full w-full overflow-hidden rounded-xl bg-primary/10">
                      {icon ? (
                        <img src={icon} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-8 pt-10">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-base font-bold text-foreground">
                      {name || "Untitled Group"}
                    </h4>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80">
                    <span className="flex items-center gap-1">
                      {privacy === "Public Group" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {privacy}
                    </span>
                    <span>•</span>
                    <span>{batch || "Class Info"}</span>
                  </div>

                  <p className="mt-4 line-clamp-3 text-xs font-medium leading-relaxed text-muted-foreground/80">
                    {tagline || "Your group description will appear here. Tell students what makes your community special..."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-1.5">
                    {(tags.length > 0 ? tags : ["Common"]).slice(0, 3).map(t => (
                      <span key={t} className="rounded-lg bg-muted px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-muted/50 p-3 text-center">
                      <Users className="mx-auto h-4 w-4 text-primary/60" />
                      <p className="mt-1 text-[10px] font-bold">1</p>
                    </div>
                    <div className="rounded-2xl bg-muted/50 p-3 text-center">
                      <Video className="mx-auto h-4 w-4 text-primary/60" />
                      <p className="mt-1 text-[10px] font-bold">0</p>
                    </div>
                    <div className="rounded-2xl bg-muted/50 p-3 text-center">
                      <FileText className="mx-auto h-4 w-4 text-primary/60" />
                      <p className="mt-1 text-[10px] font-bold">0</p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <div className="h-10 flex-1 rounded-xl bg-primary/10" />
                    <div className="h-10 w-10 rounded-xl bg-muted" />
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/10">
                <Check className="h-4 w-4 text-emerald-500" />
                <p className="text-[10px] font-bold text-emerald-600/80">
                  Optimized for {privacy === "Public Group" ? "high visibility" : "secure study"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
