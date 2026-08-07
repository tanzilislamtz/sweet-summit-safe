import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
import { applyGroupOverrides } from "@/lib/group-workspace";

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
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground transition hover:brightness-95"
          >
            <Plus className="h-4 w-4" /> Create
          </button>
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

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isJoining) return;
    setIsJoining(true);
    setTimeout(() => {
      setJoined(group.id, !joined);
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
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            {group.name.charAt(0)}
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

      <button
        onClick={handleJoin}
        disabled={isJoining}
        className={`mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
          joined
            ? "border border-border text-foreground hover:bg-muted"
            : "bg-primary text-primary-foreground hover:brightness-110"
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {isJoining ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {joined ? "Leaving..." : "Joining..."}
          </>
        ) : (
          <>{joined ? "Joined" : "Join"}</>
        )}
      </button>
    </motion.div>
  );
}


function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [batch, setBatch] = useState("");
  const [tagline, setTagline] = useState("");
  const [privacy, setPrivacy] = useState<"Public Group" | "Private Group">("Public Group");
  const [tags, setTags] = useState<string[]>([]);

  const valid = name.trim().length >= 3;

  const submit = () => {
    if (!valid) return;
    createGroup({
      name: name.trim(),
      batch: batch.trim() || "General Batch",
      tagline: tagline.trim() || "A study group for focused preparation.",
      privacy,
      tags: tags.length ? tags : ["Common"],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="h5">Create a study group</h2>
            <p className="caption">Set up your group in a few seconds.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <Field label="Group name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="SSC 2026 Batch"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </Field>
          <Field label="Batch / class">
            <input
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="SSC · 2026 Batch"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </Field>
          <Field label="Short description">
            <textarea
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              rows={3}
              placeholder="What is this group about?"
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </Field>
          <Field label="Privacy">
            <div className="grid grid-cols-2 gap-2">
              {(["Public Group", "Private Group"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPrivacy(p)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    privacy === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {p === "Public Group" ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {p.replace(" Group", "")}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Sections / subjects">
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
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

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            Create group
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
