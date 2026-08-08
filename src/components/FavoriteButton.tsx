import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import {
  FAVORITES_EVENT,
  isFavorite,
  toggleFavorite,
  type FavoriteItem,
  type FavoriteType,
} from "@/lib/favorites";

export interface FavoriteButtonProps {
  item: Omit<FavoriteItem, "key" | "at">;
  /** Compact icon-only rendering for dense lists. */
  compact?: boolean;
  className?: string;
}

/** Bookmark toggle that saves an item (question, post, tutor) into the local Favorites list. */
export function FavoriteButton({ item, compact = false, className }: FavoriteButtonProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(isFavorite(item.type, item.id));
    sync();
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_EVENT, sync);
  }, [item.type, item.id]);

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
      className={`inline-flex shrink-0 items-center gap-1.5 transition ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-primary"
      } ${className ?? ""}`}
    >
      <Bookmark className={`h-3.5 w-3.5 ${active ? "fill-current" : ""}`} />
      {!compact && (active ? "Saved" : "Save")}
    </motion.button>
  );
}
