import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import {
  FAVORITES_EVENT,
  favoriteKey,
  isFavorite,
  toggleFavorite,
  type FavoriteQuestion,
} from "@/lib/favorites";

export interface FavoriteButtonProps {
  item: Omit<FavoriteQuestion, "key" | "at">;
  /** Compact icon-only rendering for dense lists. */
  compact?: boolean;
  className?: string;
}

/** Star toggle that saves a question into the local Favourites list. */
export function FavoriteButton({ item, compact = false, className }: FavoriteButtonProps) {
  const key = favoriteKey(item.subjectId, item.questionId);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(isFavorite(key));
    sync();
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_EVENT, sync);
  }, [key]);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setActive(toggleFavorite(item));
      }}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Save to favorites"}
      title={active ? "Saved to Favorites" : "Save to Favorites"}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
        active
          ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
          : "border-border text-muted-foreground hover:border-amber-500/40 hover:text-amber-600"
      } ${className ?? ""}`}
    >
      <Star className={`h-3.5 w-3.5 ${active ? "fill-current" : ""}`} />
      {!compact && (active ? "Saved" : "Favorite")}
    </motion.button>
  );
}
