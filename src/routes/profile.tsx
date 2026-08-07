import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Calendar,
  Camera,
  ChevronRight,
  Flame,
  Globe,
  GraduationCap,
  Lock,
  MapPin,
  MessageCircle,
  Pencil,
  PenLine,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { MobileNav } from "@/components/MobileNav";
import { LeftNav } from "@/components/LeftNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/ProgressRing";
import { listAttempts, summarise, type PracticeAttempt } from "@/lib/practice-results";
import { FAVORITES_EVENT, listFavorites, type FavoriteItem } from "@/lib/favorites";
import { GROUPS_EVENT, listCreatedGroups, listJoinedIds } from "@/lib/groups";
import { getSession, type Session } from "@/lib/session";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Learns Academy" },
      {
        name: "description",
        content:
          "Your Learns Academy profile — posts, Q&A, points and level, practice accuracy and saved items.",
      },
      { property: "og:title", content: "Profile — Learns Academy" },
      {
        property: "og:description",
        content: "Followers, level progress, practice accuracy and favorites in one profile.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

type TabId = "post" | "about" | "qa" | "points" | "settings";

const TABS: { id: TabId; label: string }[] = [
  { id: "post", label: "Post" },
  { id: "about", label: "About" },
  { id: "qa", label: "Q&A" },
  { id: "points", label: "Points & Level" },
  { id: "settings", label: "Settings" },
];

/** 250 points per level — keeps the ladder readable for learners. */
const POINTS_PER_LEVEL = 250;

function ProfilePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("post");

  const [session, setSession] = useState<Session | null>(null);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [groupCount, setGroupCount] = useState(0);

  // Everything below is localStorage-backed — read only after hydration.
  useEffect(() => {
    const readPractice = () => setAttempts(listAttempts());
    const readFav = () => setFavorites(listFavorites());
    const readGroups = () => setGroupCount(listJoinedIds().length + listCreatedGroups().length);
    const readAuth = () => setSession(getSession());

    readPractice();
    readFav();
    readGroups();
    readAuth();

    window.addEventListener("la:practice-updated", readPractice);
    window.addEventListener(FAVORITES_EVENT, readFav);
    window.addEventListener(GROUPS_EVENT, readGroups);
    window.addEventListener("la:auth", readAuth);
    return () => {
      window.removeEventListener("la:practice-updated", readPractice);
      window.removeEventListener(FAVORITES_EVENT, readFav);
      window.removeEventListener(GROUPS_EVENT, readGroups);
      window.removeEventListener("la:auth", readAuth);
    };
  }, []);

  const s = summarise(attempts);
  const name = session?.name || session?.email?.split("@")[0] || "Guest learner";
  const initial = name.charAt(0).toUpperCase();

  /** Consecutive practice days ending today (or yesterday). */
  const streak = useMemo(() => {
    if (attempts.length === 0) return 0;
    const days = new Set(attempts.map((a) => new Date(a.at).toDateString()));
    let count = 0;
    const cursor = new Date();
    if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toDateString())) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [attempts]);

  // Points are earned from real activity so the level never feels fake.
  const points =
    s.correct * 10 + s.attempts * 25 + favorites.length * 5 + groupCount * 15 + streak * 20;
  const level = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const intoLevel = points % POINTS_PER_LEVEL;
  const levelPct = Math.round((intoLevel / POINTS_PER_LEVEL) * 100);

  const followers = 3;
  const following = 1;

  return (
    <div className="min-h-screen bg-background text-foreground lg:h-[100dvh] lg:overflow-hidden">
      <Topbar variant="app" onMenu={() => setMenuOpen(true)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 pb-28 lg:h-[calc(100dvh-65px)] lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden lg:px-8 lg:pb-6">
        <LeftNav stickyClass="lg:h-full" />

        <div className="min-w-0 space-y-5 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          {/* ---------------- Header ---------------- */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
          >
            {/* Cover */}
            <div className="relative h-32 bg-gradient-to-br from-primary via-primary/85 to-secondary sm:h-44">
              <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_18%_25%,white,transparent_42%),radial-gradient(circle_at_82%_12%,white,transparent_38%)]" />
              <div className="absolute inset-0 grid place-items-center">
                <p className="select-none text-2xl font-black tracking-[0.35em] text-primary-foreground/90 sm:text-3xl">
                  LEARNS
                </p>
              </div>
              <button
                type="button"
                aria-label="Change cover photo"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-foreground shadow-sm backdrop-blur transition hover:bg-surface"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 pb-4 sm:px-6 sm:pb-5">
              {/* Avatar row — only the avatar overlaps the cover, so the name
                  below always sits on a clean surface and stays readable. */}
              <div className="flex items-end justify-between gap-3">
                <div className="relative -mt-12 shrink-0 sm:-mt-14">
                  <div className="grid h-[84px] w-[84px] place-items-center rounded-full border-4 border-surface bg-gradient-to-br from-primary to-secondary text-3xl font-black text-primary-foreground shadow-lg sm:h-28 sm:w-28 sm:text-4xl">
                    {initial}
                  </div>
                  <button
                    type="button"
                    aria-label="Change profile picture"
                    className="absolute bottom-0.5 right-0.5 grid h-8 w-8 place-items-center rounded-full border-2 border-surface bg-foreground text-background transition hover:opacity-90"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  className="mb-1 inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold shadow-sm transition hover:border-primary/40 hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Profile
                </button>
              </div>

              {/* Identity block — below the cover, full width */}
              <div className="mt-3">
                <h1 className="flex min-w-0 items-center gap-1.5 text-xl font-black tracking-tight text-foreground sm:text-[26px]">
                  <span className="truncate">{name}</span>
                  <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />
                </h1>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
                  <span>
                    <b className="font-bold text-foreground tabular-nums">{followers}</b> Followers
                  </span>
                  <span>
                    <b className="font-bold text-foreground tabular-nums">{following}</b> Following
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Student
                  </span>
                </div>
              </div>


              {/* Level strip */}
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted/50 px-3.5 py-2.5">
                <span className="text-xs font-black">Level {level}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-foreground">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  <span className="tabular-nums">{points}</span> pts
                </span>
                <div className="ml-auto flex min-w-[140px] flex-1 items-center gap-2 sm:max-w-[280px]">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${levelPct}%` }}
                      transition={{ duration: 0.7 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {intoLevel}/{POINTS_PER_LEVEL}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-border bg-surface/50 backdrop-blur-sm">
              <div className="flex gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`relative shrink-0 px-4 py-3.5 text-[13px] font-bold transition-all ${
                      tab === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="relative z-10">{t.label}</span>
                    {tab === t.id && (
                      <motion.span
                        layoutId="profile-tab-underline"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="absolute inset-x-1.5 bottom-0 h-1 rounded-t-full bg-primary"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ---------------- Tab content ---------------- */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="space-y-5"
            >
              {tab === "post" && <PostTab s={s} favorites={favorites} groupCount={groupCount} />}
              {tab === "about" && (
                <AboutTab email={session?.email} joinedAt={session?.at} groupCount={groupCount} />
              )}
              {tab === "qa" && <QaTab favorites={favorites} />}
              {tab === "points" && (
                <PointsTab
                  s={s}
                  points={points}
                  level={level}
                  levelPct={levelPct}
                  streak={streak}
                  favorites={favorites.length}
                  groups={groupCount}
                  attempts={attempts}
                />
              )}
              
              {tab === "settings" && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------- Tabs ------------------------------- */

type Summary = ReturnType<typeof summarise>;

function PostTab({
  s,
  favorites,
  groupCount,
}: {
  s: Summary;
  favorites: FavoriteItem[];
  groupCount: number;
}) {
  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Target className="h-4 w-4" />} label="Accuracy" value={`${s.accuracy}%`} />
        <StatCard icon={<BookOpen className="h-4 w-4" />} label="Questions" value={String(s.questions)} />
        <StatCard icon={<Timer className="h-4 w-4" />} label="Papers" value={String(s.attempts)} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Groups" value={String(groupCount)} />
      </section>

      <Card>
        <CardHead title="Your posts" hint="Posts you share will show up here." />
        <EmptyState
          icon={<PenLine className="h-6 w-6 text-muted-foreground" />}
          text="No posts yet. Share your first post."
          cta={{ to: "/create-post", label: "Create post" }}
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickCard
          to="/favorites"
          icon={<Star className="h-5 w-5" />}
          title="Saved items"
          value={String(favorites.length)}
          sub="Questions, posts and tutors you starred."
        />
        <QuickCard
          to="/group-study"
          icon={<Users className="h-5 w-5" />}
          title="Study groups"
          value={String(groupCount)}
          sub="Groups you created or joined with your batch."
        />
      </div>
    </>
  );
}

function AboutTab({
  email,
  joinedAt,
  groupCount,
}: {
  email?: string;
  joinedAt?: number;
  groupCount: number;
}) {
  return (
    <div className="space-y-5 pb-6">
      {/* Bio Section */}
      <Card>
        <CardHead title="Bio" hint="Tell the community about yourself." />
        <p className="mt-4 text-sm text-muted-foreground italic">
          "No bio yet. Click Edit Profile to add one."
        </p>
      </Card>

      {/* Subjects of Interest (Tags) */}
      <Card>
        <CardHead title="Subjects of Interest" />
        <div className="mt-4 flex flex-wrap gap-2">
          {["Digital media", "Gadgets", "Programming", "Social Science", "Sports"].map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary"
            >
              <BadgeCheck className="h-3 w-3" />
              {s}
            </span>
          ))}
        </div>
      </Card>

      {/* Basic Information (Accordion Style) */}
      <div className="rounded-3xl border border-border bg-surface shadow-sm overflow-hidden">
        <button className="flex w-full items-center justify-between p-5 text-left transition hover:bg-muted/30">
          <h2 className="text-base font-bold">Basic Information</h2>
          <ChevronRight className="h-5 w-5 -rotate-90 text-muted-foreground" />
        </button>
        <div className="px-5 pb-5 space-y-4">
          <InputGroup label="Full Name*" value="Tanzil Islam" icon="user" />
          <InputGroup label="Phone Number*" value="01XXXXXXXXX" icon="phone" />
          <InputGroup label="Email" value={email ?? "drevstudiobd@gmail.com"} icon="mail" />
          <InputGroup label="Gender (Optional)" value="Male" icon="gender" />
          <InputGroup label="Date of Birth (Optional)" value="mm/dd/yyyy" icon="calendar" isPlaceholder />
        </div>
      </div>

      {/* Academic Information (Expanded by default per screenshots) */}
      <div className="rounded-3xl border border-border bg-surface shadow-sm overflow-hidden">
        <button className="flex w-full items-center justify-between p-5 text-left transition hover:bg-muted/30">
          <h2 className="text-base font-bold">Academic Information</h2>
          <ChevronRight className="h-5 w-5 -rotate-90 text-muted-foreground" />
        </button>
        <div className="px-5 pb-5 space-y-4">
          <InputGroup label="Education Level *" value="Select" icon="grad" isPlaceholder />
          <InputGroup label="Version" value="No versions available — type a custom version" icon="version" isPlaceholder />
          <InputGroup label="Institute" value="Search & select institute" icon="building" isPlaceholder />
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Subjects of Interest</p>
            <div className="flex flex-wrap gap-2">
              {["Digital media", "Gadgets", "Programming", "Social Science", "Sports"].map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary"
                >
                  <BadgeCheck className="h-3 w-3" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Learning Preference (Creative Grid Boxes) */}
      <div className="rounded-3xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-base font-bold">Learning Preference</h2>
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PreferenceBox 
            icon={<Target className="h-4 w-4" />} 
            label="Learning Mode" 
            value="Not Selected" 
          />
          <PreferenceBox 
            icon={<Calendar className="h-4 w-4" />} 
            label="Available Days" 
            value="7 Days" 
          />
          <PreferenceBox 
            icon={<Timer className="h-4 w-4" />} 
            label="Preferred Slots" 
            value="Evening" 
          />
          <PreferenceBox 
            icon={<MapPin className="h-4 w-4" />} 
            label="Location" 
            value="Bangladesh" 
          />
        </div>
      </div>

      {/* Additional Stats & Info Boxes (Compact 4-column row) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <CompactStatBox
          icon={<Calendar className="h-4 w-4" />}
          label="Journey"
          value={joinedAt ? new Date(joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "Aug 2026"}
          color="text-primary"
        />
        <CompactStatBox
          icon={<Users className="h-4 w-4" />}
          label="Groups"
          value={`${groupCount} Active`}
          color="text-secondary"
        />
        <CompactStatBox
          icon={<Award className="h-4 w-4" />}
          label="Reputation"
          value="Scholar"
          color="text-accent-foreground"
        />
        <CompactStatBox
          icon={<Globe className="h-4 w-4" />}
          label="Status"
          value="Verified"
          color="text-primary"
        />
      </div>


    </div>
  );
}

function CompactStatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-center transition hover:border-primary/40 group">
      <span className={cn("mx-auto mb-1.5 grid h-7 w-7 place-items-center rounded-lg bg-muted transition-transform group-hover:scale-110", color)}>
        {icon}
      </span>
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="truncate text-[11px] font-black">{value}</p>
    </div>
  );
}



function PreferenceBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5 transition hover:border-primary/30">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>

  );
}

function InputGroup({ 
  label, 
  value, 
  icon, 
  isPlaceholder 
}: { 
  label: string; 
  value: string; 
  icon: string;
  isPlaceholder?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5 transition-colors focus-within:border-primary/50">
        <span className="text-muted-foreground/60">
          {icon === 'user' && <Users className="h-4 w-4" />}
          {icon === 'phone' && <MessageCircle className="h-4 w-4" />}
          {icon === 'mail' && <Globe className="h-4 w-4" />}
          {icon === 'gender' && <Users className="h-4 w-4" />}
          {icon === 'calendar' && <Calendar className="h-4 w-4" />}
          {icon === 'grad' && <GraduationCap className="h-4 w-4" />}
          {icon === 'version' && <Settings className="h-4 w-4" />}
          {icon === 'building' && <Target className="h-4 w-4" />}
        </span>
        <span className={cn("text-sm font-semibold truncate", isPlaceholder && "text-muted-foreground font-normal")}>
          {value}
        </span>
      </div>
    </div>
  );
}


function QaTab({ favorites }: { favorites: FavoriteItem[] }) {
  const savedQuestions = favorites.filter((f) => f.type === "question");
  const [userQuestions, setUserQuestions] = useState([
    {
      id: "q1",
      title: "How to solve integration by parts for trigonometric functions?",
      subject: "Higher Math",
      askedAt: Date.now() - 3600000 * 2,
      replies: 5,
    },
    {
      id: "q2",
      title: "What is the difference between mass and weight in physics?",
      subject: "Physics",
      askedAt: Date.now() - 3600000 * 24,
      replies: 12,
    },
  ]);

  return (
    <div className="space-y-5">
      {/* Asked by Me Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardHead title="Asked by Me" hint="Questions you posted to the community." />
          <Link
            to="/create-post"
            className="rounded-xl bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Ask Question
          </Link>
        </div>
        {userQuestions.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-6 w-6 text-muted-foreground" />}
            text="You haven't asked any questions yet."
            cta={{ to: "/create-post", label: "Ask Now" }}
          />
        ) : (
          <div className="grid gap-3">
            {userQuestions.map((q) => (
              <div
                key={q.id}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5 transition hover:border-primary/30"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{q.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                    <span className="rounded-full bg-muted px-2 py-0.5">{q.subject}</span>
                    <span>• {q.replies} replies</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Saved from Practice Section */}
      <Card>
        <CardHead
          title="Saved from Practice"
          hint="Questions you starred during exams."
          action={{ to: "/favorites", label: "See All" }}
        />
        {savedQuestions.length === 0 ? (
          <EmptyState
            icon={<Star className="h-6 w-6 text-muted-foreground" />}
            text="No saved questions yet."
            cta={{ to: "/quiz", label: "Start Practising" }}
          />
        ) : (
          <div className="mt-4 grid gap-3">
            {savedQuestions.slice(0, 5).map((q) => (
              <div
                key={q.key}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5 transition hover:border-primary/30"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
                  <Star className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">{q.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground font-medium">
                    {q.questionData?.subjectName ?? q.subtitle ?? "General Question"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


function PointsTab({
  s,
  points,
  level,
  levelPct,
  intoLevel,
  streak,
  favorites,
  groups,
  attempts,
}: {
  s: Summary;
  points: number;
  level: number;
  levelPct: number;
  intoLevel: number;
  streak: number;
  favorites: number;
  groups: number;
  attempts: PracticeAttempt[];
}) {
  const badges = [
    { icon: <Sparkles className="h-5 w-5" />, title: "First paper", sub: "Submit your first paper", done: s.attempts >= 1 },
    { icon: <TrendingUp className="h-5 w-5" />, title: "Sharp shooter", sub: "Reach 80% accuracy", done: s.accuracy >= 80 },
    { icon: <Target className="h-5 w-5" />, title: "Century", sub: "Answer 100 questions", done: s.questions >= 100 },
    { icon: <Flame className="h-5 w-5" />, title: "On a streak", sub: "Practise 3 days in a row", done: streak >= 3 },
    { icon: <Star className="h-5 w-5" />, title: "Collector", sub: "Save 10 items", done: favorites >= 10 },
    { icon: <Users className="h-5 w-5" />, title: "Team player", sub: "Join a study group", done: groups >= 1 },
  ];
  const unlocked = badges.filter((b) => b.done).length;

  return (
    <>
      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative">
              <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-muted/30 bg-background sm:h-28 sm:w-28">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                  <p className="text-sm font-black text-foreground sm:text-base">Level {level}</p>
                </div>
              </div>
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="100 100"
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 100 - levelPct }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="text-primary"
                />
              </svg>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="tabular-nums">{points.toLocaleString()}</span> Available Points
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                <span>{intoLevel} / {POINTS_PER_LEVEL} points</span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${levelPct}%` }} />
              </div>
              <div className="flex gap-4 pt-1">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground uppercase">Level 1</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">Level 2</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">Level 3</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">Premium</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">
              <Award className="h-5 w-5" />
            </span>
            <p className="text-sm font-bold truncate">Use {POINTS_PER_LEVEL * 20} Points to update level-2</p>
          </div>
          <button className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50" disabled>
            Insufficient Points
          </button>
        </div>
      </section>

      {/* How to earn points */}
      <Card>
        <CardHead title="How to earn points" />
        <div className="mt-4 space-y-2">
          {[
            { label: "Comment on a post", hint: "(max 5 points/day)", val: "+1 pts" },
            { label: "Share a post", hint: "(max 5 points/day)", val: "+1 pts" },
            { label: "Attend a quiz", val: "+5 pts" },
            { label: "Perfect quiz score", hint: "(once per day)", val: "+10 pts" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-foreground">{item.label}</span>
                {item.hint && <span className="text-[10px] text-muted-foreground">{item.hint}</span>}
              </div>
              <span className="text-sm font-black text-emerald-500">{item.val}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Use Points */}
      <Card>
        <CardHead title="Use Points" />
        <div className="mt-4 space-y-2">
          {[
            { label: "10,000 Points — Promote Profile", sub: "Boost your profile visibility for a fixed duration." },
            { label: "15,000 Points — Gift Voucher", sub: "Redeem a gift voucher worth 15%, 30% or 50%." },
            { label: "20,000 Points — Physical Gift", sub: "Request a physical gift — reviewed by admin." },
            { label: "20,000 Points — Scholarship", sub: "Request a scholarship grant — reviewed by admin." },
            { label: "20,000 Points — Cash Reward (10K)", sub: "Request a cash payout — reviewed by admin." },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{item.label}</p>
                <p className="truncate text-[10px] text-muted-foreground">{item.sub}</p>
              </div>
              <button className="shrink-0 rounded-xl bg-muted px-4 py-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground transition hover:bg-muted/80">
                Insufficient
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHead title="Recent activity" />
        <div className="mt-4 space-y-2">
          {attempts.length === 0 ? (
            <EmptyState icon={<Timer className="h-6 w-6 text-muted-foreground" />} text="No activity yet. Start a quiz to earn points." cta={{ to: "/quiz", label: "Start Quiz" }} />
          ) : (
            attempts.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
                <div>
                  <p className="text-sm font-bold text-foreground">{a.mode === 'mcq' ? 'Quiz Attended' : 'Assignment Submitted'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black">{a.mode.toUpperCase()} • {new Date(a.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                </div>
                <span className="text-sm font-black text-emerald-500">+{a.correct} pts</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
}

function FavoritesTab({ favorites }: { favorites: FavoriteItem[] }) {
  return (
    <Card>
      <CardHead title="Favorites" action={{ to: "/favorites", label: "See all" }} />
      {favorites.length === 0 ? (
        <EmptyState
          icon={<Star className="h-6 w-6 text-muted-foreground" />}
          text="Nothing saved yet."
          cta={{ to: "/quiz", label: "Explore practice" }}
        />
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {favorites.slice(0, 8).map((f) => (
            <div
              key={f.key}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition hover:border-primary/30"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
                <Star className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.title}</p>
                <p className="truncate text-[11px] capitalize text-muted-foreground">
                  {f.type}
                  {f.subtitle ? ` · ${f.subtitle}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------- Bits ------------------------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm">{children}</section>
  );
}

function CardHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <p className="mt-2 text-xl font-black tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Legend({ tone, label, value }: { tone: string; label: string; value: number }) {
  return (
    <p className="flex items-center gap-2 text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      <span>{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </p>
  );
}

function QuickCard({
  to,
  icon,
  title,
  value,
  sub,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-xs font-bold text-primary">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{sub}</p>
    </Link>
  );
}

function EmptyState({
  icon,
  text,
  cta,
}: {
  icon: React.ReactNode;
  text: string;
  cta: { to: string; label: string };
}) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
      <div className="mx-auto w-fit">{icon}</div>
      <p className="mt-3 text-xs text-muted-foreground">{text}</p>
      <Link
        to={cta.to}
        className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
      >
        {cta.label}
      </Link>
    </div>
  );
}

function SettingsTab() {
  const [aiLang, setAiLang] = useState("bn");

  return (
    <Card>
      <CardHead title="Settings" hint="Manage your account preferences and app appearance." />
      <div className="mt-6 space-y-8">
        {/* Appearance Section */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="h-4 w-4 text-primary" />
            Appearance
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Switch between day and night mode. Default is Day mode.
          </p>
          <div className="mt-4 max-w-sm">
            <ThemeToggle variant="menu" />
          </div>
        </div>

        {/* AI Reply Preferences */}
        <div className="border-t border-border pt-6">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Globe className="h-4 w-4 text-primary" />
            AI Reply Language
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose the default language for AI explanations and replies.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { id: "bn", label: "Bengali" },
              { id: "en", label: "English" },
              { id: "hi", label: "Hindi" },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => setAiLang(l.id)}
                className={cn(
                  "rounded-xl border py-2.5 text-xs font-bold transition-all",
                  aiLang === l.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Security Section */}
        <div className="border-t border-border pt-6">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Security & Privacy
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Enhance your account security with these additional features.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-bold">Two-Factor Auth</p>
                  <p className="text-[10px] text-muted-foreground">Adds an extra layer of security</p>
                </div>
              </div>
              <div className="h-5 w-9 rounded-full bg-muted p-1">
                <div className="h-3 w-3 rounded-full bg-background shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-bold">Device Management</p>
                  <p className="text-[10px] text-muted-foreground">See active logged in devices</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Other Preferences */}
        <div className="border-t border-border pt-6">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Settings className="h-4 w-4 text-primary" />
            System Preferences
          </h3>
          <div className="mt-4 space-y-3">
             <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
               <span className="text-sm font-bold">Email Notifications</span>
               <div className="h-6 w-10 rounded-full bg-primary/20 p-1">
                 <div className="h-4 w-4 rounded-full bg-primary" />
               </div>
             </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
