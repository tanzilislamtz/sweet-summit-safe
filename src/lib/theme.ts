/**
 * Tiny theme store: "light" | "dark" | "system".
 *
 * The resolved theme is applied as a `.dark` class on <html> so the Tailwind
 * `dark` variant and the CSS token overrides in styles.css kick in. The choice
 * is persisted in localStorage and mirrored across tabs/components with a
 * custom `la:theme` event.
 */

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "la:theme";
export const THEME_EVENT = "la:theme";

/** Read the stored preference. Always "system" during SSR. */
export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

export function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? systemTheme() : mode;
}

/** Apply the resolved theme to <html>. Safe to call repeatedly. */
export function applyTheme(mode: ThemeMode): ResolvedTheme {
  const resolved = resolveTheme(mode);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
    root.dataset["theme"] = resolved;
  }
  return resolved;
}

/** Persist + apply + broadcast. */
export function setThemeMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* storage can be unavailable in private mode — theme still applies */
  }
  applyTheme(mode);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: mode }));
}

/** Subscribe to theme changes (own tab events, other tabs, and OS changes). */
export function subscribeTheme(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (getThemeMode() === "system") {
      applyTheme("system");
      cb();
    }
  };
  window.addEventListener(THEME_EVENT, cb);
  window.addEventListener("storage", cb);
  mq?.addEventListener?.("change", onSystem);
  return () => {
    window.removeEventListener(THEME_EVENT, cb);
    window.removeEventListener("storage", cb);
    mq?.removeEventListener?.("change", onSystem);
  };
}

/**
 * Inline script injected before hydration so the correct palette paints on the
 * very first frame (no white flash on a dark-mode reload).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem("${THEME_KEY}")||"system";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";r.dataset.theme=d?"dark":"light";}catch(e){}})();`;
