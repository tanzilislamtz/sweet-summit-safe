import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  MapPin,
  MessageCircleQuestion,
  Award,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { hasWelcomed, isAuthed, markWelcomed } from "@/lib/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoAsset from "@/assets/learns-academy-logo.png.asset.json";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome — Learns Academy" },
      { name: "description", content: "Discover Learns Academy in a quick tour." },
    ],
  }),
  component: WelcomePage,
});

type Slide = {
  key: string;
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  desc: string;
  bg: string;
  accent: string;
};

const SLIDES: Slide[] = [
  {
    key: "hello",
    icon: GraduationCap,
    eyebrow: "Learns Academy",
    title: "Smart learning for a smarter future.",
    desc: "Real tutors. Real answers. Real momentum — for students, tutors and parents across Bangladesh.",
    bg: "from-primary/15 via-accent/10 to-tutor/15",
    accent: "primary",
  },
  {
    key: "find",
    icon: MapPin,
    eyebrow: "Nearby",
    title: "Find nearby tutors in minutes.",
    desc: "Filter by subject, distance and rating. Book a session or chat first — your call.",
    bg: "from-tutor/15 via-primary/10 to-accent/15",
    accent: "tutor",
  },
  {
    key: "ask",
    icon: MessageCircleQuestion,
    eyebrow: "Community",
    title: "Ask questions. Share knowledge.",
    desc: "Post a question, get thoughtful answers, and help others when you can.",
    bg: "from-accent/15 via-tutor/10 to-primary/15",
    accent: "accent",
  },
  {
    key: "earn",
    icon: Award,
    eyebrow: "Rewards",
    title: "Earn points & unlock rewards.",
    desc: "Every helpful answer, streak and completed session earns points you can redeem.",
    bg: "from-primary/20 via-accent/15 to-tutor/20",
    accent: "primary",
  },
];

function WelcomePage() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);

  // If already signed in, skip the tour.
  useEffect(() => {
    if (isAuthed()) navigate({ to: "/" });
  }, [navigate]);

  const isLast = i === SLIDES.length - 1;
  const s = SLIDES[i];

  const finish = () => {
    markWelcomed();
    navigate({ to: "/login" });
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      {/* Ambient bg */}
      <div
        className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${s.bg} transition-colors duration-700`}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-10%,hsl(var(--primary)/0.12),transparent_60%)]" />

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-6 pb-8 pt-6 sm:max-w-lg">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoAsset.url} alt="Learns Academy" className="h-10 w-auto" />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          {!isLast && (
            <button
              type="button"
              onClick={finish}
              className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Skip
            </button>
          )}
          </div>
        </div>

        {/* Slide */}
        <div className="relative flex flex-1 items-center justify-center py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-center"
            >
              {/* Illustrated medallion */}
              <div className="relative mx-auto mb-8 grid h-56 w-56 place-items-center">
                <motion.span
                  aria-hidden
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-dashed border-foreground/15"
                />
                <motion.span
                  aria-hidden
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-6 rounded-full border border-foreground/10"
                />
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
                  className="relative grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-surface to-muted/60 shadow-xl shadow-primary/10 ring-1 ring-border/70"
                >
                  <s.icon className="h-14 w-14 text-primary" strokeWidth={1.4} />
                </motion.div>
                {/* Floating dots */}
                {[0, 1, 2, 3].map((k) => (
                  <motion.span
                    key={k}
                    aria-hidden
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0.2, 0.9, 0.2],
                      y: [0, -6, 0],
                    }}
                    transition={{ duration: 3 + k, repeat: Infinity, delay: k * 0.4 }}
                    className="absolute h-1.5 w-1.5 rounded-full bg-primary/60"
                    style={{
                      top: `${20 + k * 15}%`,
                      left: k % 2 ? "82%" : "12%",
                    }}
                  />
                ))}
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {s.eyebrow}
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {s.title}
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                {s.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="mx-auto mb-6 flex items-center gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-8 bg-primary" : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2">
          {!isLast ? (
            <>
              <button
                type="button"
                onClick={finish}
                className="h-12 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Skip tour
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setI((v) => Math.min(SLIDES.length - 1, v + 1))}
                className="ml-auto inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110"
              >
                Next <ArrowRight className="h-4 w-4" />
              </motion.button>
            </>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={finish}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" /> Get started
            </motion.button>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            onClick={markWelcomed}
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
