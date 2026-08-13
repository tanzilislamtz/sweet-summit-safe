import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, X, Users, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCallStore } from "@/lib/call-store";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function CallOverlay() {
  const { activeCall, setActiveCall } = useCallStore();
  const [isHovered, setIsHovered] = useState(false);
  const [time, setTime] = useState("00:00");

  useEffect(() => {
    if (!activeCall) return;
    const interval = setInterval(() => {
      const diff = Date.now() - activeCall.startTime;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTime(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall]);

  if (!activeCall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="fixed bottom-24 right-6 z-[100] flex items-center gap-3 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/30">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
        
        <div className="min-w-0 pr-2">
          <h4 className="truncate text-xs font-bold text-white">{activeCall.roomTitle}</h4>
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-white/50">
            <span className="h-1 w-1 rounded-full bg-green-500" />
            Live · {time}
          </p>
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2 border-l border-white/10 pl-2"
            >
              <Link
                to="/group-study/room/$groupId/$roomId"
                params={{ groupId: activeCall.groupId, roomId: activeCall.roomId }}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
              >
                <Maximize2 className="h-4 w-4 text-white" />
              </Link>
              <button
                onClick={() => setActiveCall(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/20 transition hover:bg-destructive/40"
              >
                <X className="h-4 w-4 text-destructive" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
