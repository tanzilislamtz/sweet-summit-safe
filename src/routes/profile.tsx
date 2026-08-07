import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Camera,
  CheckCircle2,
  Clock,
  Flame,
  PenLine,
  Settings,
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
        content: "Your Learns Academy profile — practice accuracy, saved items, groups and achievements.",
      },
      { property: "og:title", content: "Profile — Learns Academy" },
      {
        property: "og:description",
        content: "See your practice accuracy, subject-wise performance and achievements in one place.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

type TabId = "overview" | "activity" | "achievements";

const tabs: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "achievements", label: "Achievements" },
];

function ProfilePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("overview");

  const [session, setSession] = useState<Session | null>(null);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [groupCount, setGroupCount] = useState(0);

  // Everything below lives in localStorage — read only after hydration.
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

  /** Consecutive days (ending today or yesterday) with at least one paper. */
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

  const savedQuestions = favorites.filter((f) => f.type === "question").length;

  return (
    <div className="min-h-screen bg-background text-foreground lg:h-[100dvh] lg:overflow-hidden">
      <Topbar variant="app" onMenu={() => setMenuOpen(true)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 pb-28 lg:h-[calc(100dvh-65px)] lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden lg:px-8 lg:pb-6">
        <LeftNav stickyClass="lg:h-full" />

        <div className="min-w-0 space-y-6 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          {/* ---------- Header card ---------- */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
          >
            <div className="relative h-28 bg-gradient-to-r from-primary via-primary/80 to-secondary sm:h-36">
              <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_10%,white,transparent_35%)]" />
            </div>

            <div className="px-4 pb-5 sm:px-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:flex-wrap sm:justify-between">
                <div className="-mt-10 flex min-w-0 items-end gap-3 sm:-mt-12 sm:gap-4">
                  <div className="relative shrink-0">
                    <div className="grid h-20 w-20 place-items-center rounded-3xl border-4 border-surface bg-primary text-2xl font-black text-primary-foreground shadow-md sm:h-24 sm:w-24 sm:text-3xl">
                      {initial}
                    </div>
                    <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-muted text-muted-foreground">
                      <Camera className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="min-w-0 pb-1">
                    <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">{name}</h1>
                    <p className="truncate text-xs text-muted-foreground sm:text-sm">
                      {session?.email ?? "Sign in to sync your progress"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 pb-1">
                  <Link
                    to="/favorites"
                    className="hidden rounded-xl border border-border px-3 py-2 text-xs font-semibold transition hover:border-primary/40 hover:text-primary sm:inline-flex"
                  >
                    Saved items
                  </Link>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Edit profile
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip icon={<CheckCircle2 className="h-3.5 w-3.5" />} text="Student" tone="primary" />
                <Chip icon={<Flame className="h-3.5 w-3.5" />} text={`${streak} day streak`} />
                <Chip icon={<Target className="h-3.5 w-3.5" />} text={`${s.accuracy}% accuracy`} />
                <Chip icon={<Users className="h-3.5 w-3.5" />} text={`${groupCount} groups`} />
              </div>
            </div>
          </motion.section>

          {/* ---------- Stat strip ---------- */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Target className="h-4 w-4" />} label="Accuracy" value={`${s.accuracy}%`} />
            <StatCard icon={<BookOpen className="h-4 w-4" />} label="Questions" value={String(s.questions)} />
            <StatCard icon={<Timer className="h-4 w-4" />} label="Papers" value={String(s.attempts)} />
            <StatCard icon={<Star className="h-4 w-4" />} label="Saved" value={String(favorites.length)} />
          </section>

          {/* ---------- Tabs ---------- */}
          <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  tab === t.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === t.id && (
                  <motion.span
                    layoutId="profile-tab"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-primary"
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              {tab === "overview" && (
                <OverviewTab s={s} savedQuestions={savedQuestions} groupCount={groupCount} />
              )}
              {tab === "activity" && <ActivityTab attempts={attempts} favorites={favorites} />}
              {tab === "achievements" && (
                <AchievementsTab s={s} streak={streak} favorites={favorites.length} groups={groupCount} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------ Tabs ------------------------------ */

type Summary = ReturnType<typeof summarise>;

function OverviewTab({
  s,
  savedQuestions,
  groupCount,
}: {
  s: Summary;
  savedQuestions: number;
  groupCount: number;
}) {
  return (
    <>
      <Card>
        <CardHead
          title="Practice performance"
          hint="MCQ ও CQ পেপার সাবমিট করলেই এখানে পার্সেন্টেজ আপডেট হয়।"
          action={{ to: "/quiz/progress", label: "Full progress" }}
        />

        {s.attempts === 0 ? (
          <EmptyState
            text="এখনো কোনো প্র্যাকটিস পেপার সাবমিট করা হয়নি।"
            cta={{ to: "/quiz", label: "Start practising" }}
          />
        ) : (
          <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <ProgressRing value={s.accuracy} label="Accuracy" />
              <div className="space-y-1.5 text-xs">
                <Legend tone="bg-primary" label="Correct" value={s.correct} />
                <Legend tone="bg-muted-foreground/40" label="Wrong" value={s.wrong} />
                <Legend tone="bg-secondary" label="Minutes" value={s.minutes} />
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              {s.bySubject.slice(0, 5).map((row, i) => (
                <div key={row.subjectId}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate">{row.subjectName}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{row.accuracy}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.accuracy}%` }}
                      transition={{ delay: 0.04 * i, duration: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {s.attempts > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {s.byMode.map((m) => (
              <span
                key={m.mode}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold"
              >
                {m.mode === "mcq" ? (
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <PenLine className="h-3.5 w-3.5 text-primary" />
                )}
                {m.mode.toUpperCase()} · {m.accuracy}% ({m.attempts})
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickCard
          to="/favorites"
          icon={<Star className="h-5 w-5" />}
          title="Saved questions"
          value={String(savedQuestions)}
          sub="Revisit the questions you starred while practising."
        />
        <QuickCard
          to="/group-study"
          icon={<Users className="h-5 w-5" />}
          title="Study groups"
          value={String(groupCount)}
          sub="Groups you created or joined with your batch."
        />
        <QuickCard
          to="/quiz"
          icon={<BookOpen className="h-5 w-5" />}
          title="Practice hub"
          value="MCQ · CQ"
          sub="Chapter-wise practice with instant AI explanations."
        />
        <QuickCard
          to="/quiz/mock-test"
          icon={<Timer className="h-5 w-5" />}
          title="Mock tests"
          value="Full length"
          sub="Exam-style papers with a live timer and result sheet."
        />
      </div>
    </>
  );
}

function ActivityTab({
  attempts,
  favorites,
}: {
  attempts: PracticeAttempt[];
  favorites: FavoriteItem[];
}) {
  if (attempts.length === 0 && favorites.length === 0) {
    return (
      <Card>
        <CardHead title="Recent activity" hint="Practice ও saved items এখানে দেখা যাবে।" />
        <EmptyState text="এখনো কোনো অ্যাক্টিভিটি নেই।" cta={{ to: "/quiz", label: "Start practising" }} />
      </Card>
    );
  }

  return (
    <>
      {attempts.length > 0 && (
        <Card>
          <CardHead title="Recent papers" action={{ to: "/quiz/progress", label: "See all" }} />
          <div className="mt-4 space-y-2">
            {attempts.slice(0, 8).map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  {a.mode === "mcq" ? (
                    <Sparkles className="h-4 w-4" />
                  ) : (
                    <PenLine className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {a.topicName ?? a.chapterName ?? a.subjectName}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {a.mode.toUpperCase()} · {a.correct}/{a.total} correct ·{" "}
                    {new Date(a.at).toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-primary">{a.percent}%</span>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {favorites.length > 0 && (
        <Card>
          <CardHead title="Recently saved" action={{ to: "/favorites", label: "Open favorites" }} />
          <div className="mt-4 space-y-2">
            {favorites.slice(0, 6).map((f) => (
              <div
                key={f.key}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
                  <Star className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.title}</p>
                  <p className="truncate text-[11px] capitalize text-muted-foreground">
                    {f.type} {f.subtitle ? `· ${f.subtitle}` : ""}
                  </p>
                </div>
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function AchievementsTab({
  s,
  streak,
  favorites,
  groups,
}: {
  s: Summary;
  streak: number;
  favorites: number;
  groups: number;
}) {
  const badges = [
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "First paper",
      sub: "Submit your first practice paper",
      done: s.attempts >= 1,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Sharp shooter",
      sub: "Reach 80% overall accuracy",
      done: s.accuracy >= 80,
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Century",
      sub: "Answer 100 questions",
      done: s.questions >= 100,
    },
    {
      icon: <Flame className="h-5 w-5" />,
      title: "On a streak",
      sub: "Practise 3 days in a row",
      done: streak >= 3,
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "Collector",
      sub: "Save 10 questions or posts",
      done: favorites >= 10,
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Team player",
      sub: "Join a study group",
      done: groups >= 1,
    },
  ];

  const unlocked = badges.filter((b) => b.done).length;

  return (
    <Card>
      <CardHead title="Achievements" hint={`${unlocked} of ${badges.length} unlocked`} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
              b.done ? "border-primary/30 bg-primary/5" : "border-border bg-background opacity-70"
            }`}
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                b.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {b.done ? b.icon : <Award className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{b.title}</p>
              <p className="text-[11px] text-muted-foreground">{b.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------ Bits ------------------------------ */

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm">{children}</section>;
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

function Chip({
  icon,
  text,
  tone = "muted",
}: {
  icon: React.ReactNode;
  text: string;
  tone?: "muted" | "primary";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
        tone === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      {icon}
      {text}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
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

function EmptyState({ text, cta }: { text: string; cta: { to: string; label: string } }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
      <Target className="mx-auto h-6 w-6 text-muted-foreground" />
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
