import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Languages, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { explainAnswer } from "@/lib/ai-explain.functions";

export const EXPLAIN_LANGUAGES = [
  { id: "bn", label: "বাংলা", prompt: "Bangla (বাংলা)" },
  { id: "en", label: "English", prompt: "English" },
  { id: "hi", label: "हिन्दी", prompt: "Hindi (हिन्दी)" },
  { id: "ar", label: "العربية", prompt: "Arabic (العربية)" },
  { id: "ur", label: "اردو", prompt: "Urdu (اردو)" },
  { id: "es", label: "Español", prompt: "Spanish (Español)" },
] as const;

export type ExplainLanguageId = (typeof EXPLAIN_LANGUAGES)[number]["id"];

export interface AiExplanationProps {
  question: string;
  options: string[];
  correctIndex: number;
  /** -1 when skipped, -2 when the learner is only browsing the question */
  userIndex: number;
  subject?: string;
  topic?: string;
  /** Fallback text when the AI service is unreachable. */
  fallback?: string;
  /** Load the Bangla explanation as soon as the block mounts. */
  autoLoad?: boolean;
  className?: string;
}

/**
 * AI explanation block with a language switcher.
 *
 * The default language is Bangla; every other language is fetched on demand and
 * cached per-language so switching back and forth costs nothing.
 */
export function AiExplanation({
  question,
  options,
  correctIndex,
  userIndex,
  subject,
  topic,
  fallback,
  autoLoad = true,
  className,
}: AiExplanationProps) {
  const explain = useServerFn(explainAnswer);
  const [lang, setLang] = useState<ExplainLanguageId>("bn");
  const [cache, setCache] = useState<Partial<Record<ExplainLanguageId, string>>>({});
  const [loadingLang, setLoadingLang] = useState<ExplainLanguageId | null>(null);
  const [picker, setPicker] = useState(false);

  const load = async (target: ExplainLanguageId, force = false) => {
    if (!force && cache[target]) {
      setLang(target);
      return;
    }
    const meta = EXPLAIN_LANGUAGES.find((l) => l.id === target);
    if (!meta) return;
    setLang(target);
    setLoadingLang(target);
    try {
      const res = await explain({
        data: {
          question,
          options,
          correctIndex,
          userIndex,
          subject,
          topic,
          language: meta.prompt,
        },
      });
      setCache((c) => ({ ...c, [target]: res.explanation }));
    } catch {
      setCache((c) => ({
        ...c,
        [target]: fallback ?? "ব্যাখ্যা আনা যায়নি। একটু পরে আবার চেষ্টা করুন।",
      }));
    } finally {
      setLoadingLang(null);
    }
  };

  // Kick off the default Bangla explanation once.
  if (autoLoad && !cache.bn && loadingLang === null && lang === "bn") {
    void load("bn");
  }

  const text = cache[lang];
  const busy = loadingLang === lang;

  return (
    <div
      className={`rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <Sparkles className="h-3.5 w-3.5" /> AI ব্যাখ্যা
        </span>

        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setPicker((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold transition hover:border-primary/40 hover:text-primary"
          >
            <Languages className="h-3.5 w-3.5" />
            {EXPLAIN_LANGUAGES.find((l) => l.id === lang)?.label}
          </button>

          <AnimatePresence>
            {picker && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                className="absolute right-0 top-full z-30 mt-1.5 w-40 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg"
              >
                {EXPLAIN_LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setPicker(false);
                      void load(l.id);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-muted"
                  >
                    {l.label}
                    {lang === l.id && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => void load(lang, true)}
          disabled={busy}
          className="grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
          aria-label="Regenerate explanation"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-2 min-h-[1.5rem] text-sm leading-relaxed">
        {busy && !text ? (
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> ব্যাখ্যা তৈরি হচ্ছে…
          </span>
        ) : text ? (
          <p className="whitespace-pre-line">{text}</p>
        ) : (
          <button
            type="button"
            onClick={() => void load(lang)}
            className="text-xs font-semibold text-primary underline underline-offset-2"
          >
            ব্যাখ্যা দেখুন
          </button>
        )}
      </div>
    </div>
  );
}
