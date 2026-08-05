/**
 * Local "Favorites" store.
 *
 * Learners can star any question, post, or tutor while browsing or practising.
 * Everything is kept in localStorage for now — when the backend lands, only the
 * read/write helpers below need to change.
 */

import type { FigureSpec } from "@/data/figures";

export type FavoriteType = "question" | "post" | "tutor" | "student";

export type FavoriteItem = {
  id: string;
  type: FavoriteType;
  /** stable key: `${type}:${id}` */
  key: string;
  at: number;
  /** Shared metadata for list display */
  title: string;
  subtitle?: string;
  image?: string;
  /** Type-specific data */
  questionData?: {
    text: string;
    options: string[];
    answer: number;
    explanation?: string;
    figure?: FigureSpec;
    subjectId: string;
    subjectName?: string;
    topic?: string;
    chapterName?: string;
    source?: "mcq" | "cq" | "mock" | "board";
  };
  postData?: {
    author: string;
    role: string;
    time: string;
    body: string;
    tag?: string;
  };
  userData?: {
    role: string;
    institute?: string;
    subjects?: string[];
    headline?: string;
  };
};

const KEY = "la_favorites_v2";
const MAX = 1000;
export const FAVORITES_EVENT = "la:favorites-updated";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function favoriteKey(type: FavoriteType, id: string): string {
  return `${type}:${id}`;
}

export function listFavorites(): FavoriteItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as FavoriteItem[];
  } catch {
    return [];
  }
}

function persist(next: FavoriteItem[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
  } catch {
    /* storage full or blocked */
  }
}

export function isFavorite(type: FavoriteType, id: string): boolean {
  const key = favoriteKey(type, id);
  return listFavorites().some((f) => f.key === key);
}

export function addFavorite(item: Omit<FavoriteItem, "key" | "at">): FavoriteItem {
  const fav: FavoriteItem = {
    ...item,
    key: favoriteKey(item.type, item.id),
    at: Date.now(),
  };
  persist([fav, ...listFavorites().filter((f) => f.key !== fav.key)]);
  return fav;
}

export function removeFavorite(type: FavoriteType, id: string): void {
  const key = favoriteKey(type, id);
  persist(listFavorites().filter((f) => f.key !== key));
}

export function removeFavoriteByKey(key: string): void {
  persist(listFavorites().filter((f) => f.key !== key));
}

/** Adds when missing, removes when present. Returns the new state. */
export function toggleFavorite(item: Omit<FavoriteItem, "key" | "at">): boolean {
  if (isFavorite(item.type, item.id)) {
    removeFavorite(item.type, item.id);
    return false;
  }
  addFavorite(item);
  return true;
}

export function clearFavorites(): void {
  persist([]);
}
