import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  Info,
  Lock,
  Globe,
  Users,
  UserPlus,
  UserMinus,
  SlidersHorizontal,
  ScrollText,
  UserCircle2,
  TriangleAlert,
  Check,
  Trash2,
  Plus,
  Search,
} from "lucide-react";
import type { GroupMember, StudyGroup } from "@/data/groups";
import {
  GROUPS_EVENT,
  deleteCreatedGroup,
  findGroup,
  isJoined,
  setJoined,
} from "@/lib/groups";
import {
  applyGroupOverrides,
  canManageGroup,
  getGroupSettings,
  isGroupOwner,
  listJoinRequests,
  resolveJoinRequest,
  resolveMembers,
  setMemberRemoved,
  setMemberRole,
  updateGroupSettings,
  type GroupRole,
  type GroupSettings,
} from "@/lib/group-workspace";

export const Route = createFileRoute("/group-study/manage/$groupId")({
  head: () => ({
    meta: [
      { title: "Group Admin Tools — Learns Academy" },
      {
        name: "description",
        content:
          "One place to manage a study group: identity, privacy, class and board, member roles, join requests, rules and permissions.",
      },
      { property: "og:title", content: "Group Admin Tools — Learns Academy" },
      {
        property: "og:description",
        content: "Change group name, privacy, board, class, permissions and members from a single admin panel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupManagePage,
});

const SECTIONS = [
  { id: "identity", label: "Group info", icon: Info },
  { id: "privacy", label: "Privacy & type", icon: Lock },
  { id: "requests", label: "Join requests", icon: UserPlus },
  { id: "members", label: "Members & roles", icon: Users },
  { id: "permissions", label: "Permissions", icon: SlidersHorizontal },
  { id: "rules", label: "Group rules", icon: ScrollText },
  { id: "profile", label: "Your admin profile", icon: UserCircle2 },
  { id: "danger", label: "Danger zone", icon: TriangleAlert },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const ROLES: GroupRole[] = ["Admin", "Moderator", "Tutor", "Student"];
const BOARDS = ["Dhaka Board", "Rajshahi Board", "Chattogram Board", "Cumilla Board", "Sylhet Board", "Madrasah Board"];
const CLASSES = ["Class 8", "Class 9", "Class 10", "SSC", "HSC", "Admission"];

function GroupManagePage() {
  const { groupId } = useParams({ from: "/group-study/manage/$groupId" });
  const navigate = useNavigate();
  const [raw, setRaw] = useState<StudyGroup | undefined>();
  const [joined, setJoinedState] = useState(false);
  const [tick, setTick] = useState(0);
  const [active, setActive] = useState<SectionId>("identity");

  useEffect(() => {
    const sync = () => {
      const g = findGroup(groupId);
      setRaw(g);
      setJoinedState(g ? isJoined(g) : false);
      setTick((t) => t + 1);
    };
    sync();
    window.addEventListener(GROUPS_EVENT, sync);
    return () => window.removeEventListener(GROUPS_EVENT, sync);
  }, [groupId]);

  const group = useMemo(() => (raw ? applyGroupOverrides(raw) : undefined), [raw, tick]);
  const canManage = raw ? canManageGroup(raw, joined) : false;

  if (!raw || !group) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="body">This group could not be found.</p>
        <Link to="/group-study" className="mt-3 inline-block text-sm font-semibold text-primary">
          Back to Group Study
        </Link>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <ShieldCheck className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-semibold">Admin access only</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Only group admins can open these tools.
        </p>
        <Link
          to="/group-study/$groupId"
          params={{ groupId }}
          className="mt-3 inline-block text-sm font-semibold text-primary"
        >
          Back to the group
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <Link
        to="/group-study/$groupId"
        params={{ groupId }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {group.name}
      </Link>

      <header className="flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-primary px-4 py-3 text-primary-foreground shadow-md">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-foreground/12 ring-1 ring-primary-foreground/20">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold sm:text-lg">Admin tools</h1>
          <p className="truncate text-[11px] text-primary-foreground/75">
            Everything you need to run {group.name}
          </p>
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="lg:sticky lg:top-2 lg:self-start">
          <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0">
                <button
                  onClick={() => setActive(s.id)}
                  className={`flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                    active === s.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-surface text-foreground/75 hover:bg-muted"
                  }`}
                >
                  <s.icon className="h-3.5 w-3.5 shrink-0" />
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="min-w-0 space-y-3"
        >
          {active === "identity" && <IdentitySection group={raw} tick={tick} />}
          {active === "privacy" && <PrivacySection group={raw} tick={tick} />}
          {active === "requests" && <RequestsSection group={raw} tick={tick} />}
          {active === "members" && <MembersSection group={raw} tick={tick} />}
          {active === "permissions" && <PermissionsSection group={raw} tick={tick} />}
          {active === "permissions" && <PostApprovalSection group={raw} tick={tick} />}
          {active === "rules" && <RulesSection group={raw} tick={tick} />}
          {active === "profile" && <ProfileSection group={raw} tick={tick} />}
          {active === "danger" && (
            <DangerSection
              group={raw}
              onDeleted={() => navigate({ to: "/group-study" })}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ---------------------------- shared UI ---------------------------- */

function Panel({
  title,
  hint,
  icon: Icon,
  children,
}: {
  title: string;
  hint?: string;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-start gap-2 border-b border-border px-4 py-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <h2 className="truncate text-[13px] font-bold">{title}</h2>
          {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}) {
  const shared =
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none transition focus:border-primary/50";
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={4}
          className={`${shared} resize-none leading-relaxed`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={shared}
        />
      )}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <select
        value={options.includes(value) ? value : options[0]}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none transition focus:border-primary/50"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-border px-4 py-2.5 first:border-t-0">
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      </span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface transition-all ${
            checked ? "left-[1.15rem]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SaveBar({ dirty, onSave, saved }: { dirty: boolean; onSave: () => void; saved: boolean }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">
      {saved && !dirty && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tutor">
          <Check className="h-3.5 w-3.5" /> Saved
        </span>
      )}
      <button
        onClick={onSave}
        disabled={!dirty}
        className="rounded-lg bg-primary px-4 py-1.5 text-[11px] font-bold text-primary-foreground transition enabled:hover:brightness-110 disabled:opacity-40"
      >
        Save changes
      </button>
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold text-foreground/70">
      {initials}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-4 py-6 text-center text-xs text-muted-foreground">{text}</p>;
}

/** Small hook: local draft of settings with save/dirty tracking. */
function useSettingsDraft(group: StudyGroup, tick: number) {
  const stored = useMemo(() => getGroupSettings(group), [group, tick]);
  const [draft, setDraft] = useState<GroupSettings>(stored);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);
  const set = <K extends keyof GroupSettings>(key: K, value: GroupSettings[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };
  const save = () => {
    updateGroupSettings(group, draft);
    setSaved(true);
  };

  return { draft, set, save, dirty, saved };
}

/* ---------------------------- sections ---------------------------- */

function IdentitySection({ group, tick }: { group: StudyGroup; tick: number }) {
  const { draft, set, save, dirty, saved } = useSettingsDraft(group, tick);

  return (
    <Panel icon={Info} title="Group info" hint="Name, tagline, board and class shown across the group">
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Group name" value={draft.name} onChange={(v) => set("name", v)} maxLength={70} />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Tagline"
            value={draft.tagline}
            onChange={(v) => set("tagline", v)}
            maxLength={120}
            placeholder="One line about this group"
          />
        </div>
        <Select label="Board" value={draft.board} onChange={(v) => set("board", v)} options={BOARDS} />
        <Select label="Class" value={draft.classLevel} onChange={(v) => set("classLevel", v)} options={CLASSES} />
        <Field label="Batch label" value={draft.batch} onChange={(v) => set("batch", v)} maxLength={40} />
        <Select
          label="Language"
          value={draft.language}
          onChange={(v) => set("language", v)}
          options={["English", "Bangla", "Bangla + English"]}
        />
        <div className="sm:col-span-2">
          <Field
            label="Description"
            value={draft.description}
            onChange={(v) => set("description", v)}
            multiline
            maxLength={600}
          />
        </div>
      </div>
      <SaveBar dirty={dirty} onSave={save} saved={saved} />
    </Panel>
  );
}

function PrivacySection({ group, tick }: { group: StudyGroup; tick: number }) {
  const { draft, set, save, dirty, saved } = useSettingsDraft(group, tick);

  const options = [
    {
      value: "Public Group" as const,
      icon: Globe,
      title: "Public",
      hint: "Anyone can find the group and see its posts, members and files.",
    },
    {
      value: "Private Group" as const,
      icon: Lock,
      title: "Private",
      hint: "Only members can see posts. The group still appears in search.",
    },
  ];

  return (
    <>
      <Panel icon={Lock} title="Privacy & type" hint="Control who can see and join this group">
        <div className="grid gap-2 p-4 sm:grid-cols-2">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => set("privacy", o.value)}
              className={`rounded-xl border p-3 text-left transition ${
                draft.privacy === o.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-bold">
                <o.icon className="h-4 w-4 text-primary" /> {o.title}
                {draft.privacy === o.value && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">{o.hint}</span>
            </button>
          ))}
        </div>
        <Toggle
          label="Approve new members"
          hint="Every join request waits for an admin decision"
          checked={draft.approveMembers || draft.requireMemberApproval}
          onChange={(v) => {
            set("approveMembers", v);
            set("requireMemberApproval", v);
          }}
        />
        <Toggle
          label="Auto-approve academic questions"
          hint="Questions with $ mention are approved automatically"
          checked={draft.autoApproveQuestions}
          onChange={(v) => set("autoApproveQuestions", v)}
        />
        <SaveBar dirty={dirty} onSave={save} saved={saved} />
      </Panel>
    </>
  );
}

function RequestsSection({ group, tick }: { group: StudyGroup; tick: number }) {
  const requests = useMemo(() => listJoinRequests(group.id), [group.id, tick]);

  return (
    <Panel icon={UserPlus} title={`Join requests (${requests.length})`} hint="Approve or decline people waiting to join">
      <ul className="divide-y divide-border">
        {requests.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-2.5 px-4 py-2.5">
            <Avatar initials={r.initials} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{r.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {r.section} · {r.requestedOn}
              </span>
            </span>
            <button
              onClick={() => resolveJoinRequest(group.id, r.id)}
              className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:brightness-110"
            >
              Approve
            </button>
            <button
              onClick={() => resolveJoinRequest(group.id, r.id)}
              className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-muted"
            >
              Decline
            </button>
          </li>
        ))}
        {requests.length === 0 && <li><Empty text="No pending requests right now." /></li>}
      </ul>
    </Panel>
  );
}

function MembersSection({ group, tick }: { group: StudyGroup; tick: number }) {
  const [q, setQ] = useState("");
  const members = useMemo(() => resolveMembers(group), [group, tick]);
  const removed = useMemo(
    () => group.memberList.filter((m) => !members.some((r) => r.id === m.id)),
    [group, members],
  );
  const list = members.filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <Panel icon={Users} title={`Members & roles (${members.length})`} hint="Promote, demote or remove members">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search members"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary/50"
            />
          </div>
        </div>
        <ul className="divide-y divide-border">
          {list.map((m: GroupMember) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2.5 px-4 py-2.5">
              <Avatar initials={m.initials} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{m.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {m.section} · {m.expertise}
                </span>
              </span>
              <select
                value={m.role}
                onChange={(e) => setMemberRole(group.id, m.id, e.target.value as GroupRole)}
                aria-label={`Change role for ${m.name}`}
                className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold outline-none focus:border-primary/50"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setMemberRemoved(group.id, m.id, true)}
                aria-label={`Remove ${m.name}`}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <UserMinus className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {list.length === 0 && <li><Empty text="No members match this search." /></li>}
        </ul>
      </Panel>

      <Panel icon={UserMinus} title={`Removed members (${removed.length})`} hint="Restore anyone you removed by mistake">
        <ul className="divide-y divide-border">
          {removed.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 px-4 py-2.5">
              <Avatar initials={m.initials} />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">{m.name}</span>
              <button
                onClick={() => setMemberRemoved(group.id, m.id, false)}
                className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-muted"
              >
                Restore
              </button>
            </li>
          ))}
          {removed.length === 0 && <li><Empty text="Nobody has been removed." /></li>}
        </ul>
      </Panel>
    </>
  );
}

function PermissionsSection({ group, tick }: { group: StudyGroup; tick: number }) {
  const { draft, set, save, dirty, saved } = useSettingsDraft(group, tick);

  const toggles: [keyof GroupSettings, string, string][] = [
    ["membersCanPost", "Members can post", "Turn off to make the feed admin-only"],
    ["postsNeedApproval", "Approve posts before publishing", "New posts wait in a review queue"],
    ["membersCanCreateRooms", "Members can create study rooms", "Anyone can start a live room"],
    ["membersCanUpload", "Members can upload files", "Share notes and PDFs with the group"],
    ["membersCanInvite", "Members can invite others", "Existing members may send invites"],
  ];

  return (
    <Panel icon={SlidersHorizontal} title="Permissions" hint="Decide what members can do without asking you">
      <div>
        {toggles.map(([key, label, hint]) => (
          <Toggle
            key={String(key)}
            label={label}
            hint={hint}
            checked={Boolean(draft[key])}
            onChange={(v) => set(key, v as never)}
          />
        ))}
      </div>
      <SaveBar dirty={dirty} onSave={save} saved={saved} />
    </Panel>
  );
}

function RulesSection({ group, tick }: { group: StudyGroup; tick: number }) {
  const { draft, set, save, dirty, saved } = useSettingsDraft(group, tick);
  const [next, setNext] = useState("");

  const addRule = () => {
    const value = next.trim();
    if (!value) return;
    set("rules", [...draft.rules, value]);
    setNext("");
  };

  return (
    <Panel icon={ScrollText} title="Group rules" hint="Shown to members on the About tab">
      <ul className="divide-y divide-border">
        {draft.rules.map((rule, i) => (
          <li key={`${rule}-${i}`} className="flex items-center gap-2.5 px-4 py-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 text-xs">{rule}</span>
            <button
              onClick={() => set("rules", draft.rules.filter((_, idx) => idx !== i))}
              aria-label={`Delete rule ${i + 1}`}
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {draft.rules.length === 0 && <li><Empty text="No rules yet — add the first one below." /></li>}
      </ul>
      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={next}
          onChange={(e) => setNext(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addRule()}
          placeholder="Add a new rule"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary/50"
        />
        <button
          onClick={addRule}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <SaveBar dirty={dirty} onSave={save} saved={saved} />
    </Panel>
  );
}

function ProfileSection({ group, tick }: { group: StudyGroup; tick: number }) {
  const { draft, set, save, dirty, saved } = useSettingsDraft(group, tick);

  return (
    <Panel icon={UserCircle2} title="Your admin profile" hint="How your name appears inside this group">
      <div className="p-4">
        <Field
          label="Display name in this group"
          value={draft.displayName}
          onChange={(v) => set("displayName", v)}
          maxLength={40}
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          Posts and comments you write in {group.name} will show this name.
        </p>
      </div>
      <SaveBar dirty={dirty} onSave={save} saved={saved} />
    </Panel>
  );
}

function DangerSection({ group, onDeleted }: { group: StudyGroup; onDeleted: () => void }) {
  const owner = isGroupOwner(group.id);
  const [confirm, setConfirm] = useState(false);

  return (
    <section className="overflow-hidden rounded-2xl border border-destructive/40 bg-surface shadow-sm">
      <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/5 px-4 py-2.5">
        <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />
        <h2 className="text-[13px] font-bold text-destructive">Danger zone</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold">Leave this group</span>
          <span className="block text-[11px] text-muted-foreground">
            You will lose admin access and stop seeing group posts.
          </span>
        </span>
        <button
          onClick={() => {
            setJoined(group.id, false);
            onDeleted();
          }}
          className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-muted"
        >
          Leave group
        </button>
      </div>

      {owner && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3">
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold">Delete this group</span>
            <span className="block text-[11px] text-muted-foreground">
              Permanently removes the group and its content. This cannot be undone.
            </span>
          </span>
          {confirm ? (
            <span className="flex items-center gap-2">
              <button
                onClick={() => {
                  deleteCreatedGroup(group.id);
                  onDeleted();
                }}
                className="rounded-lg bg-destructive px-3 py-1.5 text-[11px] font-bold text-destructive-foreground hover:brightness-110"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-muted"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete group
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function PostApprovalSection({ group, tick }: { group: StudyGroup; tick: number }) {
  const { draft, set, save, dirty, saved } = useSettingsDraft(group, tick);

  return (
    <Panel icon={ShieldCheck} title="Content Approval" hint="Manage how posts are approved in this group">
      <Toggle
        label="Post approval system"
        hint="Posts from members need admin approval before appearing"
        checked={draft.postsNeedApproval}
        onChange={(v) => set("postsNeedApproval", v)}
      />
      {draft.postsNeedApproval && (
        <Toggle
          label="Auto-approve trusted members"
          hint="Moderators and Tutors can post without approval"
          checked={true}
          onChange={() => {}}
        />
      )}
      <SaveBar dirty={dirty} onSave={save} saved={saved} />
    </Panel>
  );
}
