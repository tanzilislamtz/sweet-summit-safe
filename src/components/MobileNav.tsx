import { AnimatePresence, motion } from "framer-motion";
import { X, Home, UserCheck, GraduationCap, BookOpen, MessagesSquare, Timer, Star, Users } from "lucide-react";
import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { getSession, type Session } from "@/lib/session";
import { ChevronRight } from "lucide-react";

type NavItem = {
  icon: typeof Home;
  label: string;
  to: "/" | "/quiz" | "/quiz/mock-test" | "/favorites" | "/available-tutor" | "/message" | "/group-study";
};

const sections: { items: NavItem[] }[] = [
  {
    items: [
      { icon: Home, label: "Home", to: "/" },
      { icon: BookOpen, label: "Practice", to: "/quiz" },
      { icon: MessagesSquare, label: "Messages", to: "/message" },
    ],
  },
  {
    items: [
      { icon: Timer, label: "Mock Test", to: "/quiz/mock-test" },
      { icon: Users, label: "Group Study", to: "/group-study" },
      { icon: Star, label: "Favorite", to: "/favorites" },
    ],
  },
  {

    items: [
      { icon: UserCheck, label: "Available Tutor", to: "/available-tutor" },
    ],
  },
];



export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("la:auth", sync);
    return () => window.removeEventListener("la:auth", sync);
  }, []);
  const name = session?.name || session?.email?.split("@")[0] || "Guest";
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-sm flex-col border-r border-border bg-surface p-5 shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <span className="text-lg font-semibold">
                  <span className="font-display italic">Learns</span>
                  <span className="ml-1 text-primary">Academy</span>
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
              {sections.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className={`space-y-1 ${sIdx > 0 ? "border-t border-border pt-4" : ""}`}
                >
                  {section.items.map(({ icon: Icon, label, to }, i) => {
                    const isMock = pathname.startsWith("/quiz/mock-test");
                    const active =
                      to === "/quiz"
                        ? pathname.startsWith("/quiz") && !isMock
                        : to === "/quiz/mock-test"
                          ? isMock
                          : to === "/favorites"
                            ? pathname.startsWith("/favorites")
                          : to === "/available-tutor"
                            ? pathname.startsWith("/available-tutor")
                            : to === "/message"
                              ? pathname.startsWith("/message")
                              : pathname === to && label === "Home";
                    return (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + (sIdx * 0.06) + i * 0.04 }}
                      >
                        <Link
                          to={to}
                          onClick={onClose}
                          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                            active
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-foreground/80 hover:bg-muted"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Menu footer — profile */}
            <div className="mt-3 shrink-0 border-t border-border pt-3">
              <Link
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 transition hover:bg-muted"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {session?.email ?? "View profile"}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </div>
          </motion.aside>

        </>
      )}
    </AnimatePresence>
  );
}
