import { useEffect, useRef, useState } from "react";
import { Mic, Trash2, Send, Square, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatClock, type VoiceClip } from "@/lib/chat";
import { cn } from "@/lib/utils";

const MAX_SECONDS = 120;

/**
 * Hold-free voice recorder: tap the mic to start, then send or discard.
 * While recording it covers the composer row with a live recording bar.
 */
export default function VoiceRecorder({ onSend }: { onSend: (clip: VoiceClip) => void }) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);
  const keepRef = useRef(false);
  const secondsRef = useRef(0);

  const clearTick = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
  };

  const cleanup = () => {
    clearTick();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recRef.current = null;
    setRecording(false);
    setPaused(false);
  };

  useEffect(() => () => cleanup(), []);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      keepRef.current = false;
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const duration = secondsRef.current;
        const keep = keepRef.current;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        cleanup();
        if (!keep || !blob.size) return;
        const reader = new FileReader();
        reader.onload = () => {
          onSend({ url: String(reader.result), duration: Math.max(1, duration) });
        };
        reader.readAsDataURL(blob);
      };
      rec.start();
      recRef.current = rec;
      secondsRef.current = 0;
      setSeconds(0);
      setPaused(false);
      setRecording(true);
      tickRef.current = window.setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          secondsRef.current = next;
          if (next >= MAX_SECONDS) {
            keepRef.current = true;
            recRef.current?.stop();
          }
          return next;
        });
      }, 1000);
    } catch {
      setError("Microphone permission is needed to record a voice message.");
      window.setTimeout(() => setError(null), 3000);
    }
  };

  const pause = () => {
    if (!recRef.current || recRef.current.state !== "recording") return;
    recRef.current.pause();
    clearTick();
    setPaused(true);
  };

  const resume = () => {
    if (!recRef.current || recRef.current.state !== "paused") return;
    recRef.current.resume();
    setPaused(false);
    tickRef.current = window.setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        secondsRef.current = next;
        if (next >= MAX_SECONDS) {
          keepRef.current = true;
          recRef.current?.stop();
        }
        return next;
      });
    }, 1000);
  };

  const stop = (keep: boolean) => {
    keepRef.current = keep;
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    else cleanup();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Record voice message"
        onClick={start}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted/60 text-foreground/70 transition hover:bg-muted active:scale-95"
      >
        <Mic className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-14 left-0 z-50 rounded-xl bg-foreground px-3 py-2 text-[11px] font-medium text-background shadow-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute inset-0 z-40 flex items-center gap-2 rounded-3xl border border-border bg-surface px-2"
          >
            <button
              type="button"
              aria-label="Discard recording"
              onClick={() => stop(false)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted/60 text-red-500 transition hover:bg-red-500/10 active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-3xl bg-muted/60 px-3 py-2">
              <span className="relative grid h-2.5 w-2.5 place-items-center">
                <span
                  className={cn(
                    "absolute h-2.5 w-2.5 rounded-full bg-red-500/60",
                    paused ? "" : "animate-ping"
                  )}
                />
                <span className="h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {formatClock(seconds)}
              </span>
              <div className="flex h-6 flex-1 items-center gap-[2px] overflow-hidden">
                {Array.from({ length: 26 }).map((_, i) => (
                  <motion.span
                    key={i}
                    animate={
                      paused
                        ? { scaleY: 0.25 }
                        : { scaleY: [0.3, 1, 0.45, 0.85, 0.3] }
                    }
                    transition={
                      paused
                        ? { duration: 0.2 }
                        : {
                            duration: 1.1,
                            repeat: Infinity,
                            delay: (i % 7) * 0.09,
                            ease: "easeInOut",
                          }
                    }
                    className="h-4 w-[3px] shrink-0 rounded-full bg-primary/60"
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              aria-label={paused ? "Resume recording" : "Pause recording"}
              onClick={paused ? resume : pause}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted/60 text-foreground/70 transition hover:bg-muted active:scale-95"
            >
              {paused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4" />}
            </button>

            <button
              type="button"
              aria-label="Stop and send voice message"
              onClick={() => stop(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition active:scale-95"
            >
              {seconds < 1 ? <Square className="h-3.5 w-3.5" /> : <Send className="h-4 w-4" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
