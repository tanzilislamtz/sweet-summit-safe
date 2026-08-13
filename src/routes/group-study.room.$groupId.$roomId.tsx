import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  PhoneOff, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Users,
  Layout,
  Maximize2,
  Settings,
  MoreVertical,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/lib/session";
import { findGroup } from "@/lib/groups";
import { listGroupRooms } from "@/lib/group-workspace";

export const Route = createFileRoute("/group-study/room/$groupId/$roomId")({
  component: StudyRoomPage,
});

function StudyRoomPage() {
  const { groupId, roomId } = useParams({ from: "/group-study/room/$groupId/$roomId" });
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [layout, setLayout] = useState<"grid" | "focus">("grid");
  
  const session = getSession();
  const group = findGroup(groupId);
  const room = listGroupRooms(groupId).find(r => r.id === roomId);

  useEffect(() => {
    toast.info("Welcome to the study room!");
  }, []);

  const handleLeave = () => {
    window.history.back();
  };

  const participants = [
    { id: "me", name: session?.name || "You", initials: session?.name?.charAt(0) || "U", isMe: true, video: videoOn, mic: micOn },
    { id: "p1", name: "Tanvir Hasan", initials: "TH", video: true, mic: true },
    { id: "p2", name: "Sadia Afrin", initials: "SA", video: false, mic: false },
    { id: "p3", name: "Rafid Chowdhury", initials: "RC", video: true, mic: true },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#050505] text-white">
      {/* Top Bar */}
      <header className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLeave}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold">{room?.title || "Study Room"}</h1>
            <p className="text-[10px] text-white/50">{group?.name} · Live Now</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-lg bg-white/5 px-3 text-xs font-semibold transition hover:bg-white/10">
            <Users className="h-4 w-4" />
            <span>{participants.length}</span>
          </button>
          <button 
            onClick={() => setLayout(l => l === "grid" ? "focus" : "grid")}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 transition hover:bg-white/10"
          >
            <Layout className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Video Area */}
      <main className="flex-1 overflow-hidden p-4">
        <div className={cn(
          "grid h-full w-full gap-4",
          layout === "grid" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2" 
            : "grid-cols-[1fr_260px]"
        )}>
          {layout === "grid" ? (
            participants.map((p) => (
              <ParticipantTile key={p.id} participant={p} />
            ))
          ) : (
            <>
              <div className="relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                <ParticipantTile participant={participants[0]} hideName />
                <div className="absolute bottom-4 left-4 rounded-lg bg-black/40 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                  {participants[0].name} (Host)
                </div>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                {participants.slice(1).map((p) => (
                  <div key={p.id} className="aspect-video relative overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                    <ParticipantTile participant={p} compact />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Controls Bar */}
      <footer className="flex h-20 items-center justify-center px-4 pb-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur-xl">
          <ControlBtn 
            icon={micOn ? Mic : MicOff} 
            active={micOn} 
            onClick={() => setMicOn(!micOn)} 
            danger={!micOn}
          />
          <ControlBtn 
            icon={videoOn ? Video : VideoOff} 
            active={videoOn} 
            onClick={() => setVideoOn(!videoOn)} 
            danger={!videoOn}
          />
          <ControlBtn 
            icon={isDeafened ? VolumeX : Volume2} 
            active={!isDeafened} 
            onClick={() => setIsDeafened(!isDeafened)} 
            danger={isDeafened}
            label="Defend"
          />
          <div className="mx-1 h-8 w-px bg-white/10" />
          <ControlBtn 
            icon={MonitorUp} 
            active={screenSharing} 
            onClick={() => setScreenSharing(!screenSharing)} 
            highlight={screenSharing}
          />
          <ControlBtn icon={MessageSquare} />
          <ControlBtn icon={Settings} />
          <div className="mx-1 h-8 w-px bg-white/10" />
          <button 
            onClick={handleLeave}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive text-white shadow-lg transition hover:brightness-110 active:scale-95"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}

function ParticipantTile({ 
  participant, 
  compact = false,
  hideName = false 
}: { 
  participant: any; 
  compact?: boolean;
  hideName?: boolean;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-[#121212] ring-1 ring-white/10">
      {participant.video ? (
        <img 
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}`}
          alt={participant.name}
          className="h-full w-full object-cover opacity-80"
        />
      ) : (
        <div className={cn(
          "grid place-items-center rounded-full bg-primary/20 text-primary font-bold shadow-2xl ring-2 ring-primary/30",
          compact ? "h-12 w-12 text-lg" : "h-24 w-24 text-4xl"
        )}>
          {participant.initials}
        </div>
      )}
      
      {!hideName && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/40 px-2 py-1 text-[10px] font-bold backdrop-blur-md">
          {participant.name}
          {!participant.mic && <MicOff className="h-3 w-3 text-destructive" />}
        </div>
      )}
      
      {participant.isMe && (
        <div className="absolute right-3 top-3 rounded-full bg-primary/20 p-1 backdrop-blur-md ring-1 ring-primary/30">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        </div>
      )}
    </div>
  );
}

function ControlBtn({ 
  icon: Icon, 
  active = true, 
  onClick, 
  danger = false,
  highlight = false,
  label 
}: { 
  icon: any; 
  active?: boolean; 
  onClick?: () => void;
  danger?: boolean;
  highlight?: boolean;
  label?: string;
}) {
  return (
    <div className="group relative flex flex-col items-center">
      <button
        onClick={onClick}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 active:scale-90",
          highlight ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" :
          danger ? "bg-destructive/20 text-destructive border border-destructive/30" :
          active ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/5 text-white/40"
        )}
      >
        <Icon className={cn("h-5 w-5", highlight && "animate-pulse")} />
      </button>
      {label && (
        <span className="absolute -top-8 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
          {label}
        </span>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
