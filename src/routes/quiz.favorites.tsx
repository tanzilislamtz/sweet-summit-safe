import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronDown, Star, Trash2 } from "lucide-react";
import { QuestionFigure } from "@/components/QuestionFigure";
import { AiExplanation } from "@/components/AiExplanation";
import {
  FAVORITES_EVENT,
  listFavorites,
  removeFavorite,
  type FavoriteQuestion,
} from "@/lib/favorites";

export const Route = createFileRoute("/quiz/favorites")({
  head: () => ({
    meta: [
      { title: "Favorite Questions · Learns Academy Practice" },
      {
        name: "description",
        content:
          "Revisit every question you saved while practising, with AI explanations in Bangla and instant translation.",
      },
      { property: "og:title", content: "Favorite Questions · Learns Academy" },
      {
        property: "og:description",
        content: "Your starred practice questions with AI explanations in any language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const [items, setItems] = useState<FavoriteQuestion[]>([]);

  useEffect(() => {
    const sync = () => setItems(listFavorites());
    sync();
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_EVENT, sync);
  }, []);

  return (
    <section className="space-y-5 pb-8">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link
          to="/quiz"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border transition hover:border-primary/40 hover:text-primary"
          aria-label="Back to practice"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="font-medium text-foreground">Favorite questions</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-brand"
      >
        <span className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary-foreground/10 blur-3xl" />
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-foreground/12 ring-1 ring-primary-foreground/20">
          <Star className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">Favorite Questions</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">
          {items.length > 0
            ? `${items.length} saved question${items.length > 1 ? "s" : ""} · each with an AI explanation`
            : "Tap the ⭐ on any question while practising to save it here."}
        </p>
      </motion.div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface p-10 text-center">
          <Star className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-semibold text-foreground">No favorites yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click the Favorite button next to any question and it will show up here.
          </p>
          <Link
            to="/quiz"
            className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            Start practising
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((f, i) => (
            <FavoriteCard key={f.key} item={f} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function FavoriteCard({ item, index }: { item: FavoriteQuestion; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="flex items-start gap-3 p-4">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-600">
          <Star className="h-4 w-4 fill-current" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {item.subjectName ?? item.subjectId}
            {item.topic ? ` · ${item.topic}` : ""}
          </p>
          <p className="mt-1 text-sm font-medium leading-snug">{item.text}</p>
          {item.figure && <QuestionFigure spec={item.figure} compact />}
        </div>
        <button
          onClick={() => removeFavorite(item.key)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-rose-500/40 hover:text-rose-500"
          aria-label="Remove from favorites"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/60"
      >
        <span>{open ? "Hide answer & explanation" : "Show answer & AI explanation"}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border p-4">
              <div className="grid gap-1.5">
                {item.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      i === item.answer
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-border"
                    }`}
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {i === item.answer && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">Correct</span>
                    )}
                  </div>
                ))}
              </div>

              <AiExplanation
                question={item.text}
                options={item.options}
                correctIndex={item.answer}
                userIndex={-2}
                subject={item.subjectName ?? item.subjectId}
                topic={item.topic}
                fallback={item.explanation}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
