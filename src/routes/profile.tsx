import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PenLine, Sparkles, User } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { MobileNav } from "@/components/MobileNav";
import { LeftNav } from "@/components/LeftNav";
import { listAttempts, summarise, type PracticeAttempt } from "@/lib/practice-results";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Learns Academy" },
      {
        name: "description",
        content: "Your Learns Academy profile, practice accuracy, activity and achievements.",
      },
      { property: "og:title", content: "Profile — Learns Academy" },
      {
        property: "og:description",
        content: "See your practice accuracy and subject-wise performance in one place.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);

  // Practice results live in localStorage — read them after hydration.
  useEffect(() => {
    const read = () => setAttempts(listAttempts());
    read();
    window.addEventListener("la:practice-updated", read);
    return () => window.removeEventListener("la:practice-updated", read);
  }, []);

  const s = summarise(attempts);

  return (
    <div className="min-h-screen bg-background text-foreground lg:h-[100dvh] lg:overflow-hidden">
      <Topbar variant="app" onMenu={() => setMenuOpen(true)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 pb-28 lg:h-[calc(100dvh-65px)] lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden lg:px-8 lg:pb-6">
        <LeftNav stickyClass="lg:h-full" />
        <div className="min-w-0 space-y-6 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          <div>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <h1 className="h2">Profile</h1>
            <p className="mt-2 body text-muted-foreground">
              Your profile hub — activity, saved posts, achievements and settings will live here.
            </p>
          </div>

          {/* Practice performance */}
          <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Practice performance</h2>
                <p className="text-xs text-muted-foreground">
                  MCQ ও CQ পেপার সাবমিট করলেই এখানে পার্সেন্টেজ আপডেট হয়।
                </p>
              </div>
              <Link
                to="/quiz/progress"
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
              >
                Full progress
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Accuracy" value={`${s.accuracy}%`} />
              <Stat label="Correct" value={String(s.correct)} />
              <Stat label="Wrong" value={String(s.wrong)} />
              <Stat label="Papers" value={String(s.attempts)} />
            </div>

            {s.attempts === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                এখনো কোনো প্র্যাকটিস পেপার সাবমিট করা হয়নি।
              </p>
            ) : (
              <>
                <div className="mt-5 space-y-3">
                  {s.bySubject.slice(0, 6).map((row, i) => (
                    <div key={row.subjectId}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="truncate">{row.subjectName}</span>
                        <span className="tabular-nums text-muted-foreground">{row.accuracy}%</span>
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
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}



