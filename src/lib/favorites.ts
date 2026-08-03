/**
 * Local "Favorite questions" store.
 *
 * Learners can star any question while practising or while reviewing an exam.
 * Everything is kept in localStorage for now — when the backend lands, only the
 * read/write helpers below need to change.
 */

import type { FigureSpec } from "@/data/figures";

export type FavoriteQuestion = {
  /** stable key: `${subjectId}:${questionId}` */
  key: string;
  questionId: string;
  text: string;
  options: string[];
  /** index of the correct option */
  answer: number;
  explanation?: string;
  figure?: FigureSpec;
  subjectId: string;
  subjectName?: string;
  topic?: string;
  chapterName?: string;
  source?: "mcq" | "cq" | "mock" | "board";
  at: number;
};

const KEY = "la_favorite_questions_v1";
const MAX = 500;
export const FAVORITES_EVENT = "la:favorites-updated";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function favoriteKey(subjectId: string, questionId: string): string {
  return `${subjectId}:${questionId}`;
}

export function listFavorites(): FavoriteQuestion[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as FavoriteQuestion[];
  } catch {
    return [];
  }
}

function persist(next: FavoriteQuestion[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
  } catch {
    /* storage full or blocked — favourites are a nice-to-have, never fatal */
  }
}

export function isFavorite(key: string): boolean {
  return listFavorites().some((f) => f.key === key);
}

export function addFavorite(item: Omit<FavoriteQuestion, "key" | "at">): FavoriteQuestion {
  const fav: FavoriteQuestion = {
    ...item,
    key: favoriteKey(item.subjectId, item.questionId),
    at: Date.now(),
  };
  persist([fav, ...listFavorites().filter((f) => f.key !== fav.key)]);
  return fav;
}

export function removeFavorite(key: string): void {
  persist(listFavorites().filter((f) => f.key !== key));
}

/** Adds when missing, removes when present. Returns the new state. */
export function toggleFavorite(item: Omit<FavoriteQuestion, "key" | "at">): boolean {
  const key = favoriteKey(item.subjectId, item.questionId);
  if (isFavorite(key)) {
    removeFavorite(key);
    return false;
  }
  addFavorite(item);
  return true;
}

export function clearFavorites(): void {
  persist([]);
}
