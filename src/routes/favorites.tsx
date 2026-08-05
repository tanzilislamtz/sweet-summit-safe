import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  Star,
  Trash2,
  BookOpen,
  User as UserIcon,
  LayoutGrid,
  FileText,
  Clock,
  ExternalLink,
} from "lucide-react";
import { QuestionFigure } from "@/components/QuestionFigure";
import { AiExplanation } from "@/components/AiExplanation";
import {
  FAVORITES_EVENT,
  listFavorites,
  removeFavoriteByKey,
  type FavoriteItem,
} from "@/lib/favorites";
import { Topbar } from "@/components/Topbar";
import { MobileNav } from "@/components/MobileNav";
import { LeftNav } from "@/components/LeftNav";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites · Learns Academy" },
      {
        name: "description",
        content: "Your saved questions, posts and profiles in one place.",
      },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "question" | "post" | "tutor" | "student">("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("All Subjects");

  useEffect(() => {
    const sync = () => setItems(listFavorites());
    sync();
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_EVENT, sync);
  }, []);

  const subjectOf = (item: FavoriteItem): string =>
    item.questionData?.subjectName ?? item.questionData?.subjectId ?? "Others";

  const questionItems = items.filter((i) => i.type === "question");

  /** Subject list is derived from the saved questions, so it grows automatically. */
  const subjectCounts = questionItems.reduce<Record<string, number>>((acc, item) => {
    const name = subjectOf(item);
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  const subjects = Object.keys(subjectCounts).sort((a, b) => a.localeCompare(b));

  // Drop a stale selection when its last question is removed.
  useEffect(() => {
    if (selectedSubject !== "All Subjects" && !subjects.includes(selectedSubject)) {
      setSelectedSubject("All Subjects");
    }
  }, [subjects.join("|"), selectedSubject]);

  const filteredItems = items.filter((item) => {
    const matchTab = activeTab === "all" || item.type === activeTab;
    if (!matchTab) return false;
    if (activeTab !== "question" || item.type !== "question") return true;
    return selectedSubject === "All Subjects" || subjectOf(item) === selectedSubject;
  });

  // Subject filtering only makes sense on the Questions tab.
  const showSubjectRail = activeTab === "question" && subjects.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground lg:h-[100dvh] lg:overflow-hidden">
      <Topbar variant="app" onMenu={() => setMenuOpen(true)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 pb-28 lg:h-[calc(100dvh-65px)] lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden lg:px-8 lg:pb-6">
        <LeftNav stickyClass="lg:h-full" />
        <div className="min-w-0 space-y-5 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <Star className="h-5 w-5 fill-current" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-2">
              <div className="flex flex-wrap gap-1">
                <TabBtn active={activeTab === "all"} onClick={() => setActiveTab("all")} icon={LayoutGrid} label="All" />
                <TabBtn active={activeTab === "question"} onClick={() => setActiveTab("question")} icon={BookOpen} label="Questions" />
                <TabBtn active={activeTab === "post"} onClick={() => setActiveTab("post")} icon={FileText} label="Posts" />
                <TabBtn active={activeTab === "tutor"} onClick={() => setActiveTab("tutor")} icon={UserIcon} label="Tutors" />
                <TabBtn active={activeTab === "student"} onClick={() => setActiveTab("student")} icon={UserIcon} label="Students" />
              </div>
            </div>
          </header>

          <div className={showSubjectRail ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px]" : ""}>
            <div className="min-w-0">
              <AnimatePresence mode="popLayout">
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-3xl border border-dashed border-border bg-surface p-12 text-center"
                  >
                    <Star className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-4 text-sm font-semibold">No favorites found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Items you star across the academy will appear here.
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {activeTab === "all" ? (
                      <SectionedList items={filteredItems} />
                    ) : (
                      filteredItems.map((item, i) => (
                        <FavoriteCard key={item.key} item={item} index={i} />
                      ))
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {showSubjectRail && (
              <aside className="order-first xl:order-none">
                <SubjectRail
                  subjects={subjects}
                  counts={subjectCounts}
                  total={questionItems.length}
                  selected={selectedSubject}
                  onSelect={setSelectedSubject}
                />
              </aside>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SubjectRail({
  subjects,
  counts,
  total,
  selected,
  onSelect,
}: {
  subjects: string[];
  counts: Record<string, number>;
  total: number;
  selected: string;
  onSelect: (s: string) => void;
}) {
  const entries = [{ name: "All Subjects", count: total }, ...subjects.map((s) => ({ name: s, count: counts[s] ?? 0 }))];

  return (
    <div className="rounded-2xl border border-border bg-surface p-3 xl:sticky xl:top-2">
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Subjects
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0">
        {entries.map((e) => {
          const active = selected === e.name;
          return (
            <button
              key={e.name}
              type="button"
              onClick={() => onSelect(e.name)}
              className={`flex shrink-0 items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition xl:w-full xl:shrink ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="truncate">{e.name}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  active ? "bg-white/20" : "bg-muted text-muted-foreground"
                }`}
              >
                {e.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionedList({ items }: { items: FavoriteItem[] }) {
  const sections = [
    { type: "tutor", label: "Tutors", icon: UserIcon },
    { type: "student", label: "Students", icon: UserIcon },
    { type: "post", label: "Posts", icon: FileText },
    { type: "question", label: "Questions", icon: BookOpen },
  ] as const;

  return (
    <div className="space-y-10">
      {sections.map((sec) => {
        const secItems = items.filter((i) => i.type === sec.type);
        if (secItems.length === 0) return null;

        return (
          <div key={sec.type} className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
              <sec.icon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {sec.label} ({secItems.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {secItems.map((item, i) => (
                <FavoriteCard key={item.key} item={item} index={i} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function FavoriteCard({ item, index }: { item: FavoriteItem; index: number }) {
  const [open, setOpen] = useState(false);

  if (item.type === "question" && item.questionData) {
    const q = item.questionData;
    return (
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.4) }}
        className="overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <div className="flex items-start gap-3 p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="text-primary">{q.subjectName ?? q.subjectId}</span>
              {q.topic && (
                <>
                  <span>·</span>
                  <span>{q.topic}</span>
                </>
              )}
              {q.source && (
                <>
                  <span>·</span>
                  <span className="rounded bg-muted px-1 py-0.5">{q.source}</span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-sm font-medium leading-snug">{q.text}</p>
            {q.figure && <QuestionFigure spec={q.figure} compact />}
          </div>
          <button
            onClick={() => removeFavoriteByKey(item.key)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-rose-500/40 hover:text-rose-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground transition hover:bg-muted/60"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>{open ? "Hide Review" : "View Answer & Explanation"}</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 border-t border-border p-4">
                <div className="grid gap-2">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                        i === q.answer
                          ? "border-emerald-500/40 bg-emerald-500/10 font-semibold text-emerald-900"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-muted text-xs font-bold uppercase">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {i === q.answer && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                    </div>
                  ))}
                </div>

                <AiExplanation
                  question={q.text}
                  options={q.options}
                  correctIndex={q.answer}
                  userIndex={-2}
                  subject={q.subjectName ?? q.subjectId}
                  topic={q.topic}
                  fallback={q.explanation}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    );
  }

  if (item.type === "post" && item.postData) {
    const p = item.postData;
    return (
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.4) }}
        className="rounded-2xl border border-border bg-surface p-4"
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">{p.author}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{p.role}</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground">{p.time}</span>
            </div>
            <h3 className="mt-1 line-clamp-2 text-sm font-semibold">{item.title}</h3>
            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground leading-relaxed">
              {p.body}
            </p>
            {p.tag && (
              <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                #{p.tag}
              </span>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <button
              onClick={() => removeFavoriteByKey(item.key)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-rose-500/40 hover:text-rose-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <Link
              to="/post/$postId"
              params={{ postId: item.id }}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border text-primary transition hover:bg-primary/5"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.article>
    );
  }

  if (item.type === "student" && item.userData) {
    const u = item.userData;
    return (
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.4) }}
        className="rounded-2xl border border-border bg-surface p-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {item.image ? (
              <img src={item.image} alt={item.title} className="h-14 w-14 rounded-full border border-border object-cover" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-lg font-bold">
                {item.title.charAt(0)}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-white ${
              u.role === 'tutor' ? 'bg-tutor' : 'bg-primary'
            }`}>
              {u.role.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold">{item.title}</h3>
            <p className="text-[11px] text-muted-foreground line-clamp-1">{u.headline || u.institute}</p>
            {u.subjects && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {u.subjects.slice(0, 3).map(s => (
                  <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => removeFavoriteByKey(item.key)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-rose-500/40 hover:text-rose-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm">
              Profile
            </button>
          </div>
        </div>
      </motion.article>
    );
  }

  return null;
}
