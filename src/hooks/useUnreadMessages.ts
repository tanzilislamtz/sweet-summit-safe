import { useEffect, useState } from "react";
import { getUnread, subscribeUnread, incrementUnread } from "@/lib/notifications";

/**
 * Returns the live unread-message count and keeps it in sync with the store.
 * Also simulates incoming messages every ~25s so the badge feels alive
 * until real realtime wiring is added.
 */
export function useUnreadMessages() {
  // Always start at 0 so SSR markup matches the first client render; the
  // effect below syncs the real count right after hydration.
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    setCount(getUnread());
    const unsub = subscribeUnread(setCount);

    // Simulate new incoming messages periodically
    const t = window.setInterval(() => {
      // 60% chance to bump by 1, 15% chance to bump by 2
      const r = Math.random();
      if (r < 0.6) incrementUnread(1);
      else if (r < 0.75) incrementUnread(2);
    }, 25000);

    return () => {
      unsub();
      window.clearInterval(t);
    };
  }, []);

  return count;
}
