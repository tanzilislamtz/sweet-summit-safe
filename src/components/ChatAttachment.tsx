import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Download, FileText, X } from "lucide-react";
import type { Attachment } from "@/lib/chat";
import { downloadAttachment, formatBytes } from "@/lib/attachments";
import { cn } from "@/lib/utils";

export interface ChatAttachmentProps {
  attachment: Attachment;
  mine?: boolean;
  className?: string;
}

type FileState = "idle" | "downloading" | "done";

/**
 * Renders an image or file attachment inside a chat bubble.
 * - Images open a full-screen viewer with close + download controls.
 * - Files open a confirmation sheet with a WhatsApp-style download countdown.
 */
export default function ChatAttachment({ attachment, mine, className }: ChatAttachmentProps) {
  const [viewer, setViewer] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [state, setState] = useState<FileState>("idle");
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);

  // Clean up the progress interval on unmount so no state updates leak.
  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    };
  }, []);

  // Close the full-screen viewer with Escape.
  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer]);

  const startDownload = () => {
    if (state === "downloading") return;
    setState("downloading");
    setProgress(0);
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setProgress((p) => {
        const next = p + 8 + Math.random() * 10;
        if (next >= 100) {
          if (timer.current !== null) window.clearInterval(timer.current);
          timer.current = null;
          setState("done");
          downloadAttachment(attachment);
          window.setTimeout(() => setSheet(false), 700);
          return 100;
        }
        return next;
      });
    }, 120);
  };

  if (attachment.kind === "image") {
    return (
      <>
        <button
          type="button"
          onClick={() => setViewer(true)}
          aria-label={`View ${attachment.name}`}
          className={cn(
            "group relative block w-52 max-w-full overflow-hidden rounded-2xl border border-border/60 sm:w-60",
            className,
          )}
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            loading="lazy"
            className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
            <span className="rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold text-foreground">
              View
            </span>
          </span>
        </button>

        <AnimatePresence>
          {viewer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewer(false)}
              className="fixed inset-0 z-[120] flex flex-col bg-black/92 backdrop-blur-sm"
            >
              <div
                className="flex items-center justify-between gap-2 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-white/80">
                  {attachment.name} · {formatBytes(attachment.size)}
                </p>
                <button
                  type="button"
                  aria-label="Download image"
                  onClick={() => downloadAttachment(attachment)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                >
                  <Download className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setViewer(false)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <motion.img
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                src={attachment.url}
                alt={attachment.name}
                onClick={(e) => e.stopPropagation()}
                className="mx-auto max-h-[calc(100vh-6rem)] w-auto max-w-[94vw] flex-1 object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSheet(true)}
        className={cn(
          "flex w-56 max-w-full items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition active:scale-[0.99]",
          mine ? "border-white/25 bg-white/10 hover:bg-white/20" : "border-border bg-muted/60 hover:bg-muted",
          className,
        )}
      >
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            mine ? "bg-white/20" : "bg-primary/10",
          )}
        >
          <FileText className={cn("h-4 w-4", mine ? "text-white" : "text-primary")} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold">{attachment.name}</span>
          <span className={cn("block text-[10px]", mine ? "text-white/75" : "text-muted-foreground")}>
            {formatBytes(attachment.size)} · Tap to download
          </span>
        </span>
        <Download className={cn("h-4 w-4 shrink-0", mine ? "text-white/80" : "text-muted-foreground")} />
      </button>

      <AnimatePresence>
        {sheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => state !== "downloading" && setSheet(false)}
            className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center"
          >
            <motion.div
              initial={{ y: 30, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10">
                  {state === "done" ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(attachment.size)} · {attachment.mime}
                  </p>
                </div>
              </div>

              {state === "idle" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Do you want to download this file to your device?
                </p>
              )}

              {state !== "idle" && (
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ ease: "linear", duration: 0.12 }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    {state === "done" ? "Saved to your device" : `Downloading… ${Math.round(progress)}%`}
                  </p>
                </div>
              )}

              {state === "idle" && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSheet(false)}
                    className="flex-1 rounded-2xl border border-border px-3 py-2.5 text-sm font-semibold transition hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={startDownload}
                    className="flex-1 rounded-2xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Download
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
