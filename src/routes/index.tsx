import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Home,
  BookOpen,
  MessageCircle,
  Bookmark,
  Users,
  Sparkles,
  Image as ImageIcon,
  Paperclip,
  BarChart3,
  Heart,
  Share2,
  MoreHorizontal,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,

  GraduationCap,
  Menu,
  FileText,
  Flame,
  MessageSquare,
  UserSearch,
  BookOpenCheck,
  UserCheck,
  Star,
  Trophy,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  HelpCircle,
  Upload,
  X,
  ChevronUp,
} from "lucide-react";


import { MobileNav } from "@/components/MobileNav";
import { Topbar } from "@/components/Topbar";
import { LeftNav } from "@/components/LeftNav";
import { useNavigationStore } from "@/lib/navigation-store";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FeedToolbar } from "@/components/FeedToolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BellOff, Copy, Flag, Link2, UserMinus, EyeOff, Undo2 } from "lucide-react";
import { hasWelcomed, isAuthed } from "@/lib/session";
import { posts, type Role, type Kind } from "@/lib/posts";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isCollapsed = useNavigationStore((s) => s.isSidebarCollapsed);

  useEffect(() => {
    if (!isAuthed()) {
      navigate({ to: hasWelcomed() ? "/login" : "/welcome", replace: true });
    } else {
      setReady(true);
    }
  }, [navigate]);

  if (!ready) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          Loading your space…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground lg:h-[100dvh] lg:overflow-hidden">
      <Topbar variant="app" onMenu={() => setMenuOpen(true)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className={cn(
        "mx-auto grid w-full max-w-[1400px] flex-1 gap-6 px-4 py-6 transition-all duration-300 lg:h-0 lg:overflow-hidden lg:px-8",
        isCollapsed 
          ? "grid-cols-1 lg:grid-cols-[72px_minmax(0,1fr)_320px]" 
          : "grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_320px]"
      )}>
        <LeftNav stickyClass="lg:h-full lg:sticky lg:top-0" />
        <Feed />
        <RightRail />
      </main>
      {/* Bottom nav rendered globally in __root.tsx */}
    </div>
  );
}


function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="relative grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}


function Feed() {
  return (
    <section className="min-w-0 pb-20 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pb-0 lg:pr-1">
      <div className="space-y-5">
        <Leaderboard />
        <Composer />
        <FeedToolbar />
      </div>


      <div className="mt-5 space-y-5">
        {posts.slice(0, 2).map((p) => (
          <Post key={p.id} {...p} />
        ))}

        <AdCard
          title="Master English Speaking with Learns Academy Pro"
          description="Join our 3-month intensive English speaking course. Get 1-on-1 sessions with native speakers and daily practice groups."
          cta="Join Now"
          imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop"
          sponsored
        />

        <NearbyTutors />

        {posts.slice(2, 4).map((p) => (
          <Post key={p.id} {...p} />
        ))}

        <AdCard
          title="Need a Professional Home Tutor?"
          description="Find verified tutors for Math, Physics, and English near your area. 100% money-back guarantee for the first week."
          cta="Find Tutors"
          imageUrl="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop"
          sponsored
        />

        <BestTutorCard />

        {posts.slice(4).map((p) => (
          <Post key={p.id} {...p} />
        ))}
      </div>
    </section>
  );
}

function AdCard({
  title,
  description,
  cta,
  imageUrl,
  sponsored = true,
}: {
  title: string;
  description: string;
  cta: string;
  imageUrl?: string;
  sponsored?: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(12);
  const [shares, setShares] = useState(5);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: number; author: string; text: string; time: string }[]>([]);
  const [draft, setDraft] = useState("");

  const toggleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setComments((c) => [...c, { id: Date.now(), author: "You", text, time: "now" }]);
    setDraft("");
  };

  const commentCount = 3 + comments.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: "0 18px 40px -20px rgba(41,44,117,0.25)" }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow"
    >
      <div className="relative mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {sponsored ? "Sponsored" : "Promoted"}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground p-2 rounded-full transition-colors hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => toast.success("Ad reported")}>
              <Flag className="mr-2 h-4 w-4 text-destructive" /> Report Ad
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success("You will see fewer ads like this")}>
              <EyeOff className="mr-2 h-4 w-4" /> Hide Ad
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success("Ad preference updated")}>
              <BellOff className="mr-2 h-4 w-4" /> Ad Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.info("Ads help keep Learns Academy free")}>
              <HelpCircle className="mr-2 h-4 w-4" /> Why am I seeing this?
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-foreground/75 line-clamp-3">
            {description}
          </p>
        </div>

        {imageUrl && (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-muted">
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/10 bg-primary/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <ChevronRight className="h-4 w-4" />
            Click here to Enroll or Join
          </div>
          <button className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95">
            {cta}
          </button>
        </div>

        <footer className="flex items-center gap-1 border-t border-border pt-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleLike}
            className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              liked ? "bg-destructive/10 text-destructive" : "text-foreground/70 hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="relative inline-flex">
              <motion.span
                key={liked ? "on" : "off"}
                initial={{ scale: 0.6, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 14 }}
                className="inline-flex"
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              </motion.span>
              <AnimatePresence>
                {liked && (
                  <motion.span
                    key="ring"
                    initial={{ scale: 0.3, opacity: 0.6 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="pointer-events-none absolute inset-0 rounded-full border-2 border-destructive"
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {liked && [0, 1, 2, 3, 4].map((i) => {
                  const angle = (i / 5) * Math.PI - Math.PI / 2;
                  const dist = 28 + (i % 2) * 10;
                  const x = Math.cos(angle) * dist;
                  const y = Math.sin(angle) * dist - 6;
                  return (
                    <motion.span
                      key={`burst-${i}`}
                      initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
                      animate={{ x, y, scale: 1, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.02 }}
                      className="pointer-events-none absolute left-0 top-0 text-destructive"
                    >
                      <Heart className="h-3 w-3 fill-current" />
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={likes}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="tabular-nums"
              >
                {likes}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowComments(!showComments)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              showComments ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{commentCount}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShares(s => s + 1);
              toast.success("Shared successfully");
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
            <span>{shares}</span>
          </motion.button>

          <FavoriteButton 
            item={{ id: "ad-" + title, type: "post", title: title }} 
            compact 
            className="ml-auto"
          />
        </footer>

        <AnimatePresence initial={false}>
          {showComments && (
            <motion.div
              key="comments"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground">Be the first to comment.</p>
                )}
                {comments.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {c.author.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl bg-muted/60 px-3 py-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-foreground">{c.author}</span>
                        <span className="text-muted-foreground">· {c.time}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-foreground/85">{c.text}</p>
                    </div>
                  </motion.div>
                ))}

                <form onSubmit={submitComment} className="flex gap-2 pt-1">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    A
                  </div>
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a comment…"
                    className="h-9 min-w-0 flex-1 rounded-full border border-transparent bg-muted/60 px-4 text-sm outline-none focus:border-primary/30 focus:bg-surface focus:ring-4 focus:ring-primary/10"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="shrink-0 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-40"
                  >
                    Post
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}


function Leaderboard() {
  const entries = [
    { rank: 1, name: "Md. Rajwanur R.", sub: "University of Dhaka", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop", following: false },
    { rank: 2, name: "Papul Halder", sub: "Chittagong College", img: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400&auto=format&fit=crop", following: false },
    { rank: 3, name: "Sojib Khan", sub: "Rajshahi University", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&auto=format&fit=crop", following: false },
    { rank: 4, name: "Sabuj Hossain", sub: "Notre Dame College", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop", following: false },
    { rank: 5, name: "Protiq Halder", sub: "Khulna Model School", img: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&auto=format&fit=crop", following: true },
  ];
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/40 text-primary">
            <Trophy className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-foreground">
            Leaderboard <span className="text-muted-foreground">· top by points</span>
          </h3>
        </div>
        <button className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
          See all <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {entries.map((e) => (
          <motion.div
            key={e.rank}
            whileHover={{ y: -3 }}
            className="relative w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img src={e.img} alt={e.name} loading="lazy" className="h-full w-full object-cover" />
              <span className="absolute left-2 top-2 rounded-lg bg-background/95 px-1.5 py-0.5 text-[10px] font-bold text-primary shadow-sm">
                #{e.rank}
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/85 via-foreground/40 to-transparent p-2">
                <p className="truncate text-xs font-semibold text-background">{e.name}</p>
                <p className="truncate text-[10px] text-background/80">{e.sub}</p>
              </div>
            </div>
            <div className="p-2">
              <button
                className={`w-full rounded-full py-1.5 text-[11px] font-semibold transition ${
                  e.following
                    ? "bg-foreground text-background"
                    : "bg-primary text-primary-foreground hover:opacity-95"
                }`}
              >
                {e.following ? "Following" : "Follow"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AiRecommendedTutors() {
  const recommendations = [
    {
      id: "protiq",
      name: "Protiq Halder",
      photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces",
      match: "98% Match",
      reason: "Based on your interest in Physics",
      subject: "Physics",
      rating: 4.8,
    },
    {
      id: "farhana",
      name: "Farhana Islam",
      photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces",
      match: "95% Match",
      reason: "Fits your Class 10 profile",
      subject: "English & ICT",
      rating: 4.9,
    },
    {
      id: "anika",
      name: "Anika Rahman",
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces",
      match: "92% Match",
      reason: "Popular for Math in your area",
      subject: "Mathematics",
      rating: 4.8,
    },
    {
      id: "sadman",
      name: "Sadman Chowdhury",
      photo: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop&crop=faces",
      match: "89% Match",
      reason: "Great for Biology basics",
      subject: "Biology",
      rating: 4.6,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Recommended Tutors</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Personalized for you</p>
          </div>
        </div>
        <Link 
          to="/available-tutor" 
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {recommendations.map((t) => (
          <motion.div
            key={t.id}
            whileHover={{ y: -4 }}
            className="group relative w-[140px] shrink-0 rounded-xl border border-border bg-muted/30 p-3 transition-colors hover:border-primary/30 hover:bg-muted/50"
          >
            <div className="absolute top-2 right-2 z-10">
               <div className="flex items-center gap-0.5 rounded-full bg-surface/90 px-1.5 py-0.5 text-[9px] font-bold text-primary ring-1 ring-primary/10 shadow-sm">
                {t.match}
              </div>
            </div>
            
            <div className="relative mx-auto mb-3 h-14 w-14 overflow-hidden rounded-full ring-2 ring-primary/5 group-hover:ring-primary/20">
              <img
                src={t.photo}
                alt={t.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="text-center">
              <h4 className="truncate text-xs font-bold text-foreground">{t.name}</h4>
              <p className="mt-0.5 text-[10px] font-medium text-primary/80">{t.subject}</p>
              
              <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">{t.rating}</span>
              </div>

              <div className="mt-2 text-[9px] leading-tight text-muted-foreground line-clamp-2 italic">
                "{t.reason}"
              </div>
              
              <Link
                to="/available-tutor"
                className="mt-3 block w-full rounded-lg bg-primary/10 py-1.5 text-[10px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Visit Profile
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}



function Composer() {
  const navigate = useNavigate();
  const go = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate({ to: "/create-post" });
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-[0_8px_30px_rgb(41,44,117,0.08)]">
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-sm transition hover:opacity-80 active:scale-95"
        >
          A
        </Link>

        <button
          onClick={() => go()}
          className="group flex h-11 min-w-0 flex-1 items-center rounded-full border border-border bg-muted/50 px-4 transition-all hover:border-border/80 hover:bg-muted/70"
        >

          <span className="flex-1 truncate text-left text-sm text-muted-foreground">
            Share a thought, ask a question, drop a note…
          </span>
          <span className="ml-2 hidden items-center gap-0.5 sm:flex">
            <ComposerIconBtn icon={ImageIcon} onClick={go} title="Image" />
            <ComposerIconBtn icon={Paperclip} onClick={go} title="Attach" />
            
            
          </span>
        </button>

      </div>
    </div>
  );
}

function ComposerIconBtn({
  icon: Icon,
  onClick,
  title,
}: {
  icon: React.ElementType;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}) {
  return (
    <span
      role="button"
      title={title}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-primary"
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}







function TopicChips() {
  return null;
}

function NearbyTutors() {
  const tutors = [
    { name: "Nadia Karim", subject: "Physics · 2.1 km away", rating: 4.9, tone: "primary" as const },
    { name: "Tanvir Ahmed", subject: "Web Dev · 3.4 km away", rating: 4.8, tone: "tutor" as const },
    { name: "Meherun Nisa", subject: "IELTS · 1.6 km away", rating: 5.0, tone: "accent" as const },
    { name: "Sabbir Rahman", subject: "Chemistry · 4.2 km away", rating: 4.7, tone: "primary" as const },
  ];
  const toneMap = {
    primary: "from-primary/20 via-primary/10 to-transparent ring-primary/30 text-primary",
    tutor: "from-tutor/25 via-tutor/10 to-transparent ring-tutor/30 text-tutor",
    accent: "from-accent/40 via-accent/15 to-transparent ring-accent/40 text-foreground",
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Nearby tutors</h3>
        <button className="text-xs font-medium text-primary hover:underline">See all</button>
      </div>
      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tutors.map((t) => (
          <motion.div
            key={t.name}
            whileHover={{ y: -3 }}
            className="relative w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
          >
            <div className={`aspect-[4/5] bg-gradient-to-br ${toneMap[t.tone]}`}>
              <div className="grid h-full w-full place-items-center">
                <div className={`grid h-16 w-16 place-items-center rounded-full bg-background text-xl font-bold ring-2 ${toneMap[t.tone].split(" ").find((c) => c.startsWith("ring-"))}`}>
                  <span className={toneMap[t.tone].split(" ").find((c) => c.startsWith("text-"))}>
                    {t.name.charAt(0)}
                  </span>
                </div>
              </div>
              <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
                ★ {t.rating}
              </span>
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{t.subject}</p>
              <button className="mt-2.5 w-full rounded-full bg-primary py-1.5 text-[11px] font-semibold text-primary-foreground transition hover:opacity-95">
                Follow
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function BestTutorCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-2xl border border-accent/50 bg-gradient-to-br from-accent/40 via-surface to-surface p-4 shadow-sm"
    >
      <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/30 blur-2xl" />
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Best tutor available
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-md">
            R
          </div>
          <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-tutor text-tutor-foreground ring-2 ring-surface">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            Rayhan Chowdhury <span className="text-xs text-muted-foreground">· ★ 4.9</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Physics · Chemistry · 6y experience · BUET
          </p>
          <p className="mt-0.5 text-[11px] text-primary">Available today · 2 slots left</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="flex-1 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground/80 transition hover:bg-muted">
          Join Now
        </button>
        <button className="flex-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95">
          Book Now
        </button>
      </div>
    </motion.div>
  );
}


const kindConfig: Record<
  Kind,
  {
    label: string;
    Icon: typeof HelpCircle;
    accent: string;
    chip: string;
    ring: string;
    frame: string;
    dark?: boolean;
  }
> = {
  learning: {
    label: "Article",
    Icon: BookOpen,
    accent: "text-primary",
    chip: "bg-primary/10 text-primary",
    ring: "ring-primary/30",
    frame: "border-border bg-surface",
  },
  question: {
    label: "Question",
    Icon: HelpCircle,
    accent: "text-amber-800 dark:text-amber-300",
    chip: "bg-amber-500/20 text-amber-900 dark:text-amber-200",
    ring: "ring-amber-500/60",
    frame:
      "border border-violet-300/70 bg-[linear-gradient(135deg,#fbf8ff_0%,#f3ecff_55%,#ece5ff_100%)] dark:border-violet-400/25 dark:bg-[linear-gradient(135deg,#221f33_0%,#241f3d_55%,#1d1a2e_100%)]",
  },
  "seeking-tutor": {
    label: "Seeking Tutor",
    Icon: UserSearch,
    accent: "text-cyan-700 dark:text-cyan-300",
    chip: "bg-cyan-500/15 text-cyan-800 border border-cyan-500/30 dark:text-cyan-200",
    ring: "ring-cyan-500/60",
    frame:
      "border border-cyan-300/50 bg-gradient-to-br from-sky-50 via-cyan-50/70 to-white dark:border-cyan-400/20 dark:from-[#16222e] dark:via-[#152430] dark:to-[#141b26]",
  },
  "offering-tutor": {
    label: "Available Tutor",
    Icon: UserCheck,
    accent: "text-emerald-800 dark:text-emerald-300",
    chip: "bg-emerald-500/20 text-emerald-900 dark:text-emerald-200",
    ring: "ring-emerald-500/60",
    frame: "border border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white dark:from-[#15271f] dark:via-[#14241f] dark:to-[#141b1a]",
  },
  "seeking-student": {
    label: "Admission Open",
    Icon: BookOpenCheck,
    accent: "text-fuchsia-800 dark:text-fuchsia-300",
    chip: "bg-fuchsia-500/20 text-fuchsia-900 dark:text-fuchsia-200",
    ring: "ring-fuchsia-500/60",
    frame: "border border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-50 via-purple-50/60 to-white dark:border-fuchsia-400/25 dark:from-[#251a2b] dark:via-[#221a2b] dark:to-[#181521]",
  },
};


function Post({
  id,
  author,
  role,
  handle,
  time,
  title,
  body,
  tag,
  tags,
  stats,
  verified,
  media,
  mediaUrl,
  kind = "learning",
  meta,
}: {
  id: string;
  author: string;
  role: Role;
  handle: string;
  time: string;
  title: string;
  body: string;
  tag: string;
  tags?: string[];
  stats: { likes: number; comments: number; shares: number };
  verified?: boolean;
  media?: boolean;
  mediaUrl?: string;
  kind?: Kind;
  meta?: { label: string; value: string }[];
}) {
  const navigate = useNavigate();
  const openDetail = () => navigate({ to: "/post/$postId", params: { postId: id } });
  const roleStyles: Record<Role, { badge: string; ring: string; label: string }> = {
    tutor: { badge: "bg-tutor text-tutor-foreground", ring: "ring-tutor", label: "Tutor" },
    student: { badge: "bg-primary text-primary-foreground", ring: "ring-primary", label: "Student" },
    guest: { badge: "bg-accent text-accent-foreground", ring: "ring-accent", label: "Guest" },
  };
  const rs = roleStyles[role];
  const kc = kindConfig[kind];
  const isLearning = kind === "learning";

  const [liked, setLiked] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [likes, setLikes] = useState(stats.likes);
  const [bookmarked, setBookmarked] = useState(false);
  const [shared, setShared] = useState(stats.shares);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: number; author: string; text: string; time: string }[]>([]);
  const [draft, setDraft] = useState("");
  const canExpand = title.length > 80 || body.length > 180;

  const commentCount = stats.comments + comments.length;

  const toggleLike = () => {
    setLiked((v) => !v);
    setLikes((n) => n + (liked ? -1 : 1));
  };
  const onShare = () => setShared((n) => n + 1);
  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setComments((c) => [
      ...c,
      { id: Date.now(), author: "You", text, time: "now" },
    ]);
    setDraft("");
  };

  if (hidden) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-5"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Post hidden</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            You won't see this post in your feed.
          </p>
        </div>
        <button
          onClick={() => setHidden(false)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
        >
          <Undo2 className="h-3.5 w-3.5" /> Undo
        </button>
      </motion.div>
    );
  }

  return (

    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: "0 18px 40px -20px rgba(41,44,117,0.25)" }}
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm ${kc.frame}`}
    >
      {/* Per-kind decorative motifs */}
      {kind === "question" && (
        <>
          {/* Sticky-tape strips */}
          <span className="pointer-events-none absolute -top-2 left-8 h-5 w-16 rotate-[-6deg] rounded-sm bg-amber-200/70 shadow-sm" />
          <span className="pointer-events-none absolute -top-2 right-12 h-5 w-14 rotate-[4deg] rounded-sm bg-amber-200/70 shadow-sm" />
          {/* Huge ? watermark */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-4 -bottom-10 select-none text-[220px] font-black leading-none text-amber-500/10"
          >
            ?
          </span>
        </>
      )}
      {kind === "seeking-tutor" && (
        <>
          {/* Corner ribbon */}
          <div className="pointer-events-none absolute -right-12 top-6 rotate-45 bg-cyan-400 px-14 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-950 shadow-lg">
            Wanted
          </div>
          {/* Grid dot pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "radial-gradient(#67e8f9 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
        </>
      )}
      {kind === "offering-tutor" && (
        <>
          {/* Ticket-stub notches on left & right edges */}
          <span aria-hidden className="pointer-events-none absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background ring-1 ring-emerald-500/30" />
          <span aria-hidden className="pointer-events-none absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background ring-1 ring-emerald-500/30" />
          {/* Subtle diagonal shine */}
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-emerald-500/5 to-transparent" />
        </>
      )}
      {kind === "seeking-student" && (
        <div className="pointer-events-none absolute right-3 top-3 rotate-[-8deg] rounded-md border-2 border-fuchsia-600 bg-white px-2.5 py-1 dark:bg-[#1b1626] text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-700 shadow-md">
          Admission Open
        </div>
      )}

      {/* Kind label chip (all except learning shows a small type pill in header row) */}
      {!isLearning && (
        <div className="relative mb-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${kc.chip}`}
          >
            <kc.Icon className="h-3.5 w-3.5" />
            {kc.label}
          </span>
        </div>
      )}

      <header className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          {kind === "offering-tutor" ? (
            <Link
              to="/profile"
              className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 font-display text-2xl font-black text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] ring-2 ring-white transition hover:scale-105 active:scale-95`}
            >
              {author.charAt(0)}
            </Link>
          ) : (
            <Link
              to="/profile"
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted font-semibold text-foreground ring-2 ${isLearning ? rs.ring : kc.ring} transition hover:opacity-80 active:scale-95`}
            >
              {author.charAt(0)}
            </Link>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`truncate text-sm font-semibold ${kc.dark ? "text-slate-50" : "text-foreground"}`}>{author}</span>
              {verified && <CheckCircle2 className={`h-4 w-4 shrink-0 ${kc.dark ? "text-cyan-300" : "text-tutor"}`} />}
              <span className={`ml-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${rs.badge}`}>
                {rs.label}
              </span>
            </div>
            <div className={`truncate text-xs ${kc.dark ? "text-slate-400" : "text-muted-foreground"}`}>
              {handle} · {time}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="More options"
              className={`shrink-0 rounded-full p-2 transition-colors ${kc.dark ? "text-slate-400 hover:bg-white/10 hover:text-slate-100" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <div className="flex w-full items-center justify-between px-2 py-1.5">
                <div className="flex items-center">
                  <Bookmark className="mr-2 h-4 w-4" /> Save
                </div>
                <FavoriteButton
                  item={{
                    id,
                    type: "post",
                    title,
                    postData: {
                      author,
                      role,
                      time,
                      body,
                      tag,
                    }
                  }}
                  compact
                />
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success("Marked as interested")}>
              <Heart className="mr-2 h-4 w-4" /> Interested
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setHidden(true)}>
              <EyeOff className="mr-2 h-4 w-4" /> Hide post
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success("Link copied");
              }}
            >
              <Link2 className="mr-2 h-4 w-4" /> Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success("Notifications muted for this post")}>
              <BellOff className="mr-2 h-4 w-4" /> Mute notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => toast.success("Report submitted")}
              className="text-destructive focus:text-destructive"
            >
              <Flag className="mr-2 h-4 w-4" /> Report post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="relative mt-4">
        {kind === "question" ? (
          <div className="flex gap-3">
            {/* Vote rail */}
            <div className="flex h-fit shrink-0 flex-col items-center justify-between gap-1 rounded-full border border-amber-500/40 bg-white/70 px-2 py-2 text-amber-900 dark:bg-white/5 dark:text-amber-200">
              <button aria-label="Upvote" className="grid place-items-center rounded-full p-1 transition-colors hover:bg-amber-500/20">
                <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <span className="text-base font-black leading-none tabular-nums">{Math.max(1, Math.round(stats.likes / 3))}</span>
              <button aria-label="Downvote" className="grid place-items-center rounded-full p-1 text-amber-900/50 transition-colors hover:bg-amber-500/20 hover:text-amber-900 dark:text-amber-200/60 dark:hover:text-amber-200">
                <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
            <div
              className="min-w-0 flex-1 cursor-pointer"
              onClick={openDetail}
            >
              <h2 className="text-lg font-bold leading-snug text-amber-950 line-clamp-2">{title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-amber-950/80 line-clamp-3">{body}</p>
              {canExpand && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openDetail(); }}
                  className="mt-1 text-xs font-semibold text-amber-800 hover:underline"
                >
                  See more
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="cursor-pointer" onClick={openDetail}>
            <h2 className={`text-xl font-semibold leading-snug ${kc.dark ? "text-slate-50" : "text-foreground"} line-clamp-2`}>{title}</h2>
            <p className={`mt-2 whitespace-pre-line text-sm leading-relaxed ${kc.dark ? "text-slate-300" : "text-foreground/75"} line-clamp-3`}>{body}</p>
            {canExpand && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openDetail(); }}
                className={`mt-1 text-xs font-semibold hover:underline ${kc.dark ? "text-cyan-300" : "text-primary"}`}
              >
                See more
              </button>
            )}
          </div>
        )}
      </div>

      {/* Structured meta tiles for tutor/student-seeking */}
      {meta && meta.length > 0 && (
        <div className={`relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 ${kind === "seeking-tutor" ? "font-mono" : ""}`}>
          {meta.map((m) => (
            <div
              key={m.label}
              className={
                kc.dark
                  ? "rounded-xl border border-cyan-400/20 bg-white/5 px-3 py-2 backdrop-blur-sm"
                  : kind === "offering-tutor"
                  ? "rounded-xl border border-emerald-500/25 bg-white/70 px-3 py-2 shadow-sm dark:bg-white/5"
                  : kind === "seeking-student"
                  ? "rounded-xl border border-fuchsia-400/30 bg-white/70 px-3 py-2 shadow-sm dark:bg-white/5"
                  : "rounded-xl border border-current/15 bg-background/60 px-3 py-2"
              }
            >
              <div className={`text-[10px] font-semibold uppercase tracking-wider ${kc.dark ? "text-cyan-300/80" : "opacity-70"} ${!kc.dark ? kc.accent : ""}`}>{m.label}</div>
              <div className={`mt-0.5 truncate text-sm font-semibold ${kc.dark ? "text-slate-50" : "text-foreground"}`}>{m.value}</div>
            </div>
          ))}
        </div>
      )}


      {mediaUrl ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted">
          <img
            src={mediaUrl}
            alt={title}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover"
          />
        </div>
      ) : media ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-primary via-primary to-tutor">
            <div className="absolute inset-0 grid place-items-center">
              <div className="rounded-xl bg-background/95 px-4 py-3 text-center shadow-lg">
                <div className="font-display text-2xl font-semibold text-foreground">Solved ✓</div>
                <div className="text-xs text-muted-foreground">Runtime beats 96% · Memory 87%</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${kc.chip}`}>
          #{tag}
        </span>
        {tags?.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/70"
          >
            #{t}
          </span>
        ))}
      </div>




      <footer className="mt-4 flex items-center gap-1 border-t border-border pt-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleLike}
          aria-pressed={liked}
          className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            liked
              ? "bg-destructive/10 text-destructive"
              : "text-foreground/70 hover:bg-muted hover:text-foreground"
          }`}
        >
          <span className="relative inline-flex">
            <motion.span
              key={liked ? "on" : "off"}
              initial={{ scale: 0.6, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 14 }}
              className="inline-flex"
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            </motion.span>

            {/* Ripple ring */}
            <AnimatePresence>
              {liked && (
                <motion.span
                  key="ring"
                  initial={{ scale: 0.3, opacity: 0.6 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 rounded-full border-2 border-destructive"
                />
              )}
            </AnimatePresence>

            {/* Floating burst hearts */}
            <AnimatePresence>
              {liked &&
                [0, 1, 2, 3, 4].map((i) => {
                  const angle = (i / 5) * Math.PI - Math.PI / 2;
                  const dist = 28 + (i % 2) * 10;
                  const x = Math.cos(angle) * dist;
                  const y = Math.sin(angle) * dist - 6;
                  return (
                    <motion.span
                      key={`burst-${i}`}
                      initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
                      animate={{ x, y, scale: 1, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.02 }}
                      className="pointer-events-none absolute left-0 top-0 text-destructive"
                    >
                      <Heart className="h-3 w-3 fill-current" />
                    </motion.span>
                  );
                })}
            </AnimatePresence>
          </span>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={likes}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="tabular-nums"
            >
              {likes}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            showComments
              ? "bg-primary/10 text-primary"
              : "text-foreground/70 hover:bg-muted hover:text-foreground"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          {commentCount}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onShare}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
          {shared}
        </motion.button>
        <FavoriteButton
          item={{
            id,
            type: "post",
            title,
            postData: {
              author,
              role,
              time,
              body,
              tag,
            }
          }}
          compact
          className="ml-auto"
        />
      </footer>

      <AnimatePresence initial={false}>
        {showComments && (
          <motion.div
            key="comments"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground">Be the first to comment.</p>
              )}
              {comments.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {c.author.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl bg-muted/60 px-3 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-foreground">{c.author}</span>
                      <span className="text-muted-foreground">· {c.time}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground/85">{c.text}</p>
                  </div>
                </motion.div>
              ))}

              <form onSubmit={submitComment} className="flex gap-2 pt-1">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  A
                </div>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a comment…"
                  className="h-9 min-w-0 flex-1 rounded-full border border-transparent bg-muted/60 px-4 text-sm outline-none focus:border-primary/30 focus:bg-surface focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="shrink-0 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-40"
                >
                  Post
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}


function RightRail() {
  const [msgTab, setMsgTab] = useState<"active" | "all">("active");
  return (
    <aside className="hidden space-y-5 lg:block lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
      <div className="space-y-5">

        {/* Sponsored */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Sponsored</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ad
            </span>
          </div>
          <a
            href="#"
            className="group block overflow-hidden rounded-xl border border-border bg-muted"
          >
            <img
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop"
              alt="Exotic Collection — Unstitched Fabrics"
              loading="lazy"
              className="aspect-[16/10] w-full object-cover transition group-hover:scale-[1.02]"
            />
          </a>
          <div className="mt-3">
            <p className="text-sm font-semibold text-foreground">Exotic Collection</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Unstitched fabrics · New arrivals for Eid
            </p>
          </div>
        </div>

        {/* Message List */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Message List</h3>
            <button className="text-xs font-medium text-primary hover:underline">See all</button>
          </div>
          <div className="mb-3 grid grid-cols-2 rounded-full bg-muted p-1 text-xs font-semibold">
            <button
              onClick={() => setMsgTab("active")}
              className={`rounded-full py-1.5 transition ${
                msgTab === "active" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setMsgTab("all")}
              className={`rounded-full py-1.5 transition ${
                msgTab === "all" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              All <span className="opacity-70">(3)</span>
            </button>
          </div>

          {msgTab === "active" ? (
            <div className="rounded-xl border border-dashed border-border py-6 text-center">
              <p className="text-xs text-muted-foreground">
                No one is online right now.{" "}
                <button className="font-semibold text-primary hover:underline">Show all</button>
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {[
                { name: "Nadia Karim", msg: "Sent the notes ✓", time: "2m", unread: 2 },
                { name: "Tanvir Ahmed", msg: "See you at 8pm class", time: "1h", unread: 0 },
                { name: "Meherun Nisa", msg: "Thanks for the feedback!", time: "3h", unread: 0 },
              ].map((m) => (
                <li key={m.name} className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{m.name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{m.time}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{m.msg}</p>
                  </div>
                  {m.unread > 0 && (
                    <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      {m.unread}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="px-2 text-[11px] text-muted-foreground">
          © Learns Academy · About · Privacy · Terms · Help
        </p>
      </div>
    </aside>
  );
}



