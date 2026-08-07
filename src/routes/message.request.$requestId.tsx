import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Info, Lock, Trash2, Ban, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { getRequest, MAX_REQUEST_MESSAGES, timeAgo } from "@/lib/requests";
import { toast } from "sonner";

export const Route = createFileRoute("/message/request/$requestId")({
  component: RequestThread,
});

function RequestThread() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const req = getRequest(requestId);
  const [accepted, setAccepted] = useState(false);

  if (!req) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted-foreground">Request not found.</p>
        <Link to="/message/requests" className="mt-3 inline-block text-sm font-medium text-primary">
          Back to requests
        </Link>
      </div>
    );
  }

  const used = req.messages.filter((m) => m.from === "them").length;

  return (
    <div className="flex h-[100dvh] min-w-0 flex-col overflow-hidden bg-surface lg:h-full lg:rounded-3xl lg:border lg:border-border lg:shadow-sm">
      {/* fixed header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 pb-3 pt-[calc(env(safe-area-inset-top)+1.25rem)] sm:px-4 lg:pt-4">
        <Link
          to="/message/requests"
          className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
          style={{ background: req.avatarColor }}
        >
          {req.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{req.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{req.meta}</p>
        </div>
        {!accepted && (
          <span className="hidden shrink-0 rounded-full bg-accent/40 px-2.5 py-1 text-[10px] font-bold text-primary sm:block">
            REQUEST
          </span>
        )}
      </div>

      {/* profile intro card */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-muted/40 p-5 text-center">
          <div
            className="mx-auto grid h-16 w-16 place-items-center rounded-full text-lg font-bold text-white"
            style={{ background: req.avatarColor }}
          >
            {req.initials}
          </div>
          <h2 className="mt-3 text-base font-semibold">{req.name}</h2>
          <p className="text-xs text-muted-foreground">{req.meta}</p>
          {req.mutual && <p className="mt-1 text-[11px] text-primary">{req.mutual}</p>}
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground font-bangla">
            {accepted
              ? "Request accepted — you can now exchange unlimited messages."
              : "Accepting moves this conversation to your inbox. Until then they cannot receive your messages."}
          </p>
        </div>

        {/* messages */}
        <div className="mx-auto mt-5 max-w-2xl space-y-2">
          {req.messages.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex justify-start"
            >
              <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2">
                <p className="whitespace-pre-wrap break-words text-sm font-bangla">{m.text}</p>
                <p className="mt-1 text-right text-[10px] text-muted-foreground">{timeAgo(m.at)} ago</p>
              </div>
            </motion.div>
          ))}

          {/* limit indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="flex gap-1">
              {Array.from({ length: MAX_REQUEST_MESSAGES }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-6 rounded-full ${i < used ? "bg-primary" : "bg-border"}`}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {used}/{MAX_REQUEST_MESSAGES} request messages used
            </span>
          </div>

          {used >= MAX_REQUEST_MESSAGES && !accepted && (
            <div className="mt-2 flex items-start gap-2 rounded-2xl border border-dashed border-border bg-accent/20 px-3 py-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-[12px] leading-relaxed text-foreground/80 font-bangla">
                They have reached the limit — they cannot send more messages until you accept.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* fixed action bar / composer */}
      <div className="shrink-0 border-t border-border bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {accepted ? (
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2.5">
            <input
              placeholder={`Message ${req.name.split(" ")[0]}…`}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <button className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
              Send
            </button>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Accept the request to reply
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAccepted(true);
                  toast.success(`${req.name} accepted — now in your inbox`);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
              >
                <Check className="h-4 w-4" /> Accept
              </button>
              <button
                onClick={() => {
                  toast("Request deleted");
                  navigate({ to: "/message/requests" });
                }}
                className="flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <button
                onClick={() => {
                  toast("User blocked & reported");
                  navigate({ to: "/message/requests" });
                }}
                aria-label="Block"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-rose-500 transition hover:bg-rose-500/10"
              >
                <Ban className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted-foreground">
              <ShieldAlert className="h-3 w-3" /> Unknown senders can send max 3 messages
            </p>
          </>
        )}
      </div>
    </div>
  );
}
