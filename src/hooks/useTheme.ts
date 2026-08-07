import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  getThemeMode,
  resolveTheme,
  setThemeMode,
  subscribeTheme,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme";

export interface UseThemeResult {
  /** Stored preference: light | dark | system. */
  mode: ThemeMode;
  /** What is actually painted right now. */
  resolved: ResolvedTheme;
  /** True after the client has read localStorage (avoids hydration mismatch). */
  ready: boolean;
  setMode: (mode: ThemeMode) => void;
  /** Flip between light and dark (system resolves first). */
  toggle: () => void;
}

/**
 * Read/write the app theme. Renders the SSR-safe default ("light") until the
 * effect runs, so the server and client markup always match.
 */
export function useTheme(): UseThemeResult {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const next = getThemeMode();
      setModeState(next);
      setResolved(resolveTheme(next));
    };
    applyTheme(getThemeMode());
    sync();
    setReady(true);
    return subscribeTheme(sync);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setThemeMode(next);
    setModeState(next);
    setResolved(resolveTheme(next));
  }, []);

  const toggle = useCallback(() => {
    setMode(resolveTheme(getThemeMode()) === "dark" ? "light" : "dark");
  }, [setMode]);

  return { mode, resolved, ready, setMode, toggle };
}
