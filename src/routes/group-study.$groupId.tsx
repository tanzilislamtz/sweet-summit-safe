import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  ThumbsUp,
  Share2,
  ShieldCheck,
  Info,
} from "lucide-react";
import type { StudyGroup } from "@/data/groups";
import { GROUPS_EVENT, findGroup, isJoined, setJoined } from "@/lib/groups";

export const Route = createFileRoute("/group-study/$groupId")({
  head: () => ({
    meta: [
      { title: "Study Group — Learns Academy" },
      {
        name: "description",
        content:
          "Group overview, class feed, sections, live study rooms, members, files and events.",
      },
      { property: "og:title", content: "Study Group — Learns Academy" },
      {
        property: "og:description",
        content: "Everything your batch needs in one group workspace.",
      },
    ],
  }),
  component: GroupDetailPage,
});

const TABS = [
  "Overview",
  "Class Feed",
  "Sections",
  "Study Rooms",
  "Members",
  "Files",
  "Events",
  "About",
] as const;
type Tab = (typeof TABS)[number];

function GroupDetailPage() {
  const { groupId } = useParams({ from: "/group-study/$groupId" });
  const [tab, setTab] = useState<Tab>("Overview");
  const [group, setGroup] = useState<StudyGroup | undefined>();
  const [joined, setJoinedState] = useState(false);

  useEffect(() => {
    const sync = () => {
      const g = findGroup(groupId);
      setGroup(g);
      setJoinedState(g ? isJoined(g) : false);
    };
    sync();
    window.addEventListener(GROUPS_EVENT, sync);
    return () => window.removeEventListener(GROUPS_EVENT, sync);
  }, [groupId]);

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
    <div className="space-y-5 pb-10">
      <Link
        to="/group-study"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All groups
      </Link>

      {/* Cover */}
      <header className="overflow-hidden rounded-3xl border border-border bg-primary p-6 text-primary-foreground shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start gap-5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-primary-foreground/25 bg-primary-foreground/10 text-2xl font-bold">
            {group.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="h3">{group.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip>
                {group.privacy === "Public Group" ? (
                  <Globe className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                {group.privacy}
              </Chip>
              <Chip>{group.batch}</Chip>
              {group.tags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
            <p className="body-sm mt-3 max-w-2xl text-primary-foreground/80">{group.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setJoined(group.id, !joined)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  joined
                    ? "border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                    : "bg-accent text-accent-foreground hover:brightness-95"
                }`}
              >
                {joined ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                {joined ? "Joined" : "Join group"}
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-4 py-2.5 text-sm font-semibold hover:bg-primary-foreground/10">
                <Share2 className="h-4 w-4" /> Invite members
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "Overview" && <OverviewTab group={group} onOpenTab={setTab} />}
      {tab === "Class Feed" && <FeedTab group={group} />}
      {tab === "Sections" && <SectionsTab group={group} />}
      {tab === "Study Rooms" && <RoomsTab group={group} />}
      {tab === "Members" && <MembersTab group={group} />}
      {tab === "Files" && <FilesTab group={group} />}
      {tab === "Events" && <EventsTab group={group} />}
      {tab === "About" && <AboutTab group={group} />}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-2.5 py-1 text-[11px] font-semibold">
      {children}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ icon: Icon, children }: { icon: typeof Users; children: React.ReactNode }) {
  return (
    <h2 className="h6 mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      {children}
    </h2>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-foreground/70">
      {initials}
    </span>
  );
}

/* ---------------- Overview ---------------- */

function OverviewTab({ group, onOpenTab }: { group: StudyGroup; onOpenTab: (t: Tab) => void }) {
  const stats = [
    { label: "Members", value: group.members, icon: Users, tab: "Members" as Tab },
    { label: "Online now", value: group.onlineNow, icon: Radio, tab: "Members" as Tab },
    { label: "Study rooms", value: group.rooms, icon: Video, tab: "Study Rooms" as Tab },
    { label: "Files", value: group.files, icon: FileText, tab: "Files" as Tab },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onOpenTab(s.tab)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition hover:border-primary/40"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xl font-bold">{s.value}</span>
              <span className="caption">{s.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardTitle icon={MessageCircle}>Recent activity</CardTitle>
          <ul className="space-y-3">
            {group.postList.map((p) => (
              <li key={p.id} className="flex gap-3">
                <Avatar initials={p.initials} />
                <div className="min-w-0">
                  <p className="body-sm">
                    <span className="font-semibold">{p.author}</span>{" "}
                    <span className="text-muted-foreground">in {p.section}</span>
                  </p>
                  <p className="caption line-clamp-2">{p.body}</p>
                  <p className="caption">{p.time}</p>
                </div>
              </li>
            ))}
            {group.postList.length === 0 && <Empty text="No activity yet." />}
          </ul>
        </Card>

        <Card>
          <CardTitle icon={Radio}>Today's highlights</CardTitle>
          <ul className="body-sm space-y-2 text-muted-foreground">
            <li>{group.roomList.filter((r) => r.live).length} study rooms happening now</li>
            <li>{group.eventList.length} upcoming events this month</li>
            <li>{group.files} notes and files shared in total</li>
            <li>{group.onlineNow} members are online right now</li>
          </ul>
        </Card>

        <Card>
          <CardTitle icon={Users}>Section snapshot</CardTitle>
          <ul className="space-y-2">
            {group.sections.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm"
              >
                <span className="font-semibold">{s.name}</span>
                <span className="caption">{s.members} members</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="body-sm py-4 text-center text-muted-foreground">{text}</p>;
}

/* ---------------- Class Feed ---------------- */

function FeedTab({ group }: { group: StudyGroup }) {
  const [filter, setFilter] = useState("All");
  const filters = useMemo(
    () => ["All", ...Array.from(new Set(group.postList.map((p) => p.section)))],
    [group],
  );
  const posts = group.postList.filter((p) => filter === "All" || p.section === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border border-border text-foreground/70 hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {posts.map((p) => (
        <Card key={p.id}>
          <div className="flex items-start gap-3">
            <Avatar initials={p.initials} />
            <div className="min-w-0 flex-1">
              <p className="body-sm font-semibold">
                {p.author}
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {p.section}
                </span>
                <span className="caption ml-2">{p.time}</span>
              </p>
              <p className="body mt-2">{p.body}</p>
              {p.attachment && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-muted px-3 py-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{p.attachment.name}</span>
                    <span className="caption">{p.attachment.meta}</span>
                  </span>
                </div>
              )}
              <div className="caption mt-3 flex items-center gap-5">
                <span className="inline-flex items-center gap-1.5">
                  <ThumbsUp className="h-3.5 w-3.5" /> {p.likes}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" /> {p.comments}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5" /> Share
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
      {posts.length === 0 && <Card><Empty text="No posts in this section yet." /></Card>}
    </div>
  );
}

/* ---------------- Sections ---------------- */

function SectionsTab({ group }: { group: StudyGroup }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {group.sections.map((s) => (
        <Card key={s.id}>
          <h3 className="h5 text-primary">{s.name}</h3>
          <p className="caption">{s.tagline}</p>
          <p className="body-sm mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
            <Users className="h-3.5 w-3.5" /> {s.members} members
          </p>
          <p className="overline mt-4 text-muted-foreground">Key subjects</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {s.subjects.map((sub) => (
              <span key={sub} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
                {sub}
              </span>
            ))}
          </div>
          <div className="caption mt-4 flex items-center gap-4">
            <span>{s.rooms} active rooms</span>
            <span>{s.files} files shared</span>
          </div>
        </Card>
      ))}
      {group.sections.length === 0 && <Card><Empty text="No sections yet." /></Card>}
    </div>
  );
}

/* ---------------- Study Rooms ---------------- */

function RoomsTab({ group }: { group: StudyGroup }) {
  const live = group.roomList.filter((r) => r.live);
  const upcoming = group.roomList.filter((r) => !r.live);
  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h2 className="h6 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold text-destructive-foreground">
            <Radio className="h-3 w-3" /> LIVE
          </span>
          {live.length} rooms live now
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {live.map((r) => (
            <Card key={r.id}>
              <h3 className="h6">{r.title}</h3>
              <p className="caption">{r.focus}</p>
              <p className="caption mt-2">
                {r.section} · Host {r.host}
              </p>
              <p className="caption">{r.participants} participants</p>
              <button className="mt-3 w-full rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:brightness-110">
                Join room
              </button>
            </Card>
          ))}
          {live.length === 0 && <Card className="sm:col-span-2 xl:col-span-4"><Empty text="No live rooms right now." /></Card>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="h6">Upcoming rooms</h2>
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {upcoming.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{r.title}</span>
                  <span className="caption">{r.focus}</span>
                </span>
                <span className="caption w-32">{r.when}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
                  {r.section}
                </span>
                <span className="caption w-28 truncate">{r.host}</span>
                <button className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                  Remind me
                </button>
              </li>
            ))}
            {upcoming.length === 0 && <li className="p-4"><Empty text="Nothing scheduled yet." /></li>}
          </ul>
        </Card>
      </section>
    </div>
  );
}

/* ---------------- Members ---------------- */

function MembersTab({ group }: { group: StudyGroup }) {
  const [q, setQ] = useState("");
  const [section, setSection] = useState("All");
  const [role, setRole] = useState("All");

  const sections = ["All", ...Array.from(new Set(group.memberList.map((m) => m.section)))];
  const roles = ["All", ...Array.from(new Set(group.memberList.map((m) => m.role)))];

  const list = group.memberList.filter(
    (m) =>
      m.name.toLowerCase().includes(q.trim().toLowerCase()) &&
      (section === "All" || m.section === section) &&
      (role === "All" || m.role === role),
  );

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search members by name"
          className="min-w-[200px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <Select value={section} onChange={setSection} options={sections} />
        <Select value={role} onChange={setRole} options={roles} />
      </Card>

      <Card className="p-0">
        <ul className="divide-y divide-border">
          {list.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 p-4">
              <Avatar initials={m.initials} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{m.name}</span>
                <span className="caption">{m.standard} · {m.expertise}</span>
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
                {m.section}
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {m.role}
              </span>
              <span className="caption w-24">{m.joined}</span>
              <span
                className={`caption inline-flex items-center gap-1.5 ${
                  m.status === "Online" ? "text-tutor" : m.status === "Away" ? "text-warning" : ""
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" /> {m.status}
              </span>
            </li>
          ))}
          {list.length === 0 && <li className="p-4"><Empty text="No members match these filters." /></li>}
        </ul>
      </Card>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/* ---------------- Files ---------------- */

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
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search files"
          className="min-w-[200px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <Select value={section} onChange={setSection} options={sections} />
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110">
          Upload file
        </button>
      </Card>

      <Card className="p-0">
        <ul className="divide-y divide-border">
          {list.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 p-4">
              <FileText className="h-5 w-5 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{f.name}</span>
                <span className="caption">
                  {f.uploadedBy} · {f.role} · {f.uploadedOn}
                </span>
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
                {f.section}
              </span>
              <span className="caption w-16">{f.size}</span>
              <span className="caption inline-flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" /> {f.downloads}
              </span>
            </li>
          ))}
          {list.length === 0 && <li className="p-4"><Empty text="No files found." /></li>}
        </ul>
      </Card>
    </div>
  );
}

/* ---------------- Events ---------------- */

function EventsTab({ group }: { group: StudyGroup }) {
  return (
    <div className="space-y-3">
      {group.eventList.map((e) => (
        <Card key={e.id} className="flex flex-wrap items-center gap-4">
          <span className="grid w-16 shrink-0 place-items-center rounded-xl bg-primary/10 py-2 text-primary">
            <span className="text-[11px] font-bold">{e.date}</span>
            <span className="text-[10px] font-semibold text-muted-foreground">{e.day}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{e.title}</span>
            <span className="caption">
              {e.time} · {e.section} · Host {e.host}
            </span>
          </span>
          <span className="caption inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> {e.going} going
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">{e.mode}</span>
          <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110">
            Join event
          </button>
        </Card>
      ))}
      {group.eventList.length === 0 && <Card><Empty text="No events scheduled." /></Card>}
    </div>
  );
}

/* ---------------- About ---------------- */

function AboutTab({ group }: { group: StudyGroup }) {
  const facts: [string, string][] = [
    ["Group type", group.privacy],
    ["Created on", group.createdOn],
    ["Created by", group.createdBy],
    ["Group ID", group.id],
    ["Privacy", group.privacy === "Public Group" ? "Anyone can find this group" : "Invite only"],
    ["Language", group.language],
    ["Total members", `${group.members} members`],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardTitle icon={Info}>About {group.name}</CardTitle>
        <p className="body text-muted-foreground">{group.description}</p>
        <dl className="mt-4 space-y-2">
          {facts.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <CardTitle icon={ShieldCheck}>Group rules</CardTitle>
        <ul className="space-y-2">
          {group.rules.map((r) => (
            <li key={r} className="body-sm flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-tutor" />
              {r}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
