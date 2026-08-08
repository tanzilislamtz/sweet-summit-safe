import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  Star,
  MapPin,
  GraduationCap,
  Briefcase,
  Heart,
  MessageCircle,
  ChevronDown,
  BadgeCheck,
  Video,
  Users,
  Home,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

import { Topbar } from "@/components/Topbar";
import { MobileNav } from "@/components/MobileNav";
import { LeftNav } from "@/components/LeftNav";
import { useNavigationStore } from "@/lib/navigation-store";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/FavoriteButton";

export const Route = createFileRoute("/available-tutor")({
  head: () => ({
    meta: [
      { title: "Available Tutors — Learns Academy" },
      { name: "description", content: "Browse verified tutors ready to teach — filter by subject, class, location, teaching mode and fee." },
      { property: "og:title", content: "Available Tutors — Learns Academy" },
      { property: "og:description", content: "Find your perfect tutor. Verified profiles, real reviews, transparent fees." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AvailableTutorPage,
});

type Availability = "today" | "busy" | "week";

type Tutor = {
  id: string;
  name: string;
  initials: string;
  photo: string;
  headline: string;
  verified: boolean;
  subjects: string[];
  board: string;
  experience: string;
  location: string;
  online: boolean;
  rating: number;
  reviews: number;
  availability: Availability;
  fee: number;
  mode: "Online" | "In-person" | "Both";
};

const tutors: Tutor[] = [
  {
    id: "protiq",
    name: "Protiq Halder",
    initials: "PH",
    photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces",
    headline: "BUET undergrad · Physics that finally clicks",
    verified: true,
    subjects: ["Physics", "English", "Math"],
    board: "SSC",
    experience: "3 yrs",
    location: "Dhanmondi, Dhaka",
    online: true,
    rating: 4.8,
    reviews: 35,
    availability: "today",
    fee: 1200,
    mode: "Both",
  },
  {
    id: "anika",
    name: "Anika Rahman",
    initials: "AR",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces",
    headline: "Patient with slow starters · HSC Math & English",
    verified: true,
    subjects: ["Mathematics", "English"],
    board: "HSC",
    experience: "5 yrs",
    location: "Dhanmondi, Dhaka",
    online: false,
    rating: 4.8,
    reviews: 21,
    availability: "busy",
    fee: 1500,
    mode: "Online",
  },
  {
    id: "sadman",
    name: "Sadman Chowdhury",
    initials: "SC",
    photo: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop&crop=faces",
    headline: "Med student · loves teaching Chem & Bio",
    verified: true,
    subjects: ["Chemistry", "Biology"],
    board: "SSC",
    experience: "2 yrs",
    location: "Mirpur, Dhaka",
    online: true,
    rating: 4.6,
    reviews: 18,
    availability: "today",
    fee: 900,
    mode: "In-person",
  },
  {
    id: "farhana",
    name: "Farhana Islam",
    initials: "FI",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces",
    headline: "School teacher · Bangla, English, ICT",
    verified: true,
    subjects: ["Bangla", "English", "ICT"],
    board: "JSC · SSC",
    experience: "6 yrs",
    location: "Uttara, Dhaka",
    online: true,
    rating: 4.9,
    reviews: 54,
    availability: "week",
    fee: 1800,
    mode: "Both",
  },
  {
    id: "raihan",
    name: "Raihan Kabir",
    initials: "RK",
    photo: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop&crop=faces",
    headline: "IUT · Higher Math + Physics for HSC",
    verified: false,
    subjects: ["Higher Math", "Physics"],
    board: "HSC",
    experience: "4 yrs",
    location: "Gulshan, Dhaka",
    online: false,
    rating: 4.7,
    reviews: 27,
    availability: "today",
    fee: 2000,
    mode: "Online",
  },
];

const availabilityMeta: Record<Availability, { label: string; className: string }> = {
  today: { label: "Free today", className: "text-emerald-700 bg-emerald-50" },
  busy: { label: "Book ahead", className: "text-amber-700 bg-amber-50" },
  week: { label: "This week", className: "text-sky-700 bg-sky-50" },
};

function AvailableTutorPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isCollapsed = useNavigationStore((s) => s.isSidebarCollapsed);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState<"top" | "fee-low" | "fee-high" | "new">("top");
  const [subject, setSubject] = useState("All subjects");
  const [board, setBoard] = useState("All classes");
  const [location, setLocation] = useState("All locations");
  const [mode, setMode] = useState("Any mode");
  const [fee, setFee] = useState("Any fee");
  const [rating, setRating] = useState("Any rating");
  const [gender, setGender] = useState("Any gender");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tutors.filter((t) => {
      const matchQ = !q
        ? true
        : t.name.toLowerCase().includes(q) ||
          t.subjects.join(" ").toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q);
      const matchSubject = subject === "All subjects" || t.subjects.includes(subject);
      const matchBoard = board === "All classes" || t.board.includes(board);
      const matchLocation = location === "All locations" || t.location.includes(location);
      const matchMode = mode === "Any mode" || t.mode === mode || t.mode === "Both";
      const matchFee =
        fee === "Any fee" ||
        (fee === "Under ৳1000" && t.fee < 1000) ||
        (fee === "৳1000 – ৳1500" && t.fee >= 1000 && t.fee <= 1500) ||
        (fee === "৳1500 – ৳2000" && t.fee > 1500 && t.fee <= 2000) ||
        (fee === "Above ৳2000" && t.fee > 2000);
      const matchRating =
        rating === "Any rating" ||
        (rating === "4.5+" && t.rating >= 4.5) ||
        (rating === "4.0+" && t.rating >= 4.0) ||
        (rating === "3.5+" && t.rating >= 3.5);
      return matchQ && matchSubject && matchBoard && matchLocation && matchMode && matchFee && matchRating;
    });
    const sorted = [...list];
    if (sort === "top") sorted.sort((a, b) => b.rating - a.rating);
    if (sort === "fee-low") sorted.sort((a, b) => a.fee - b.fee);
    if (sort === "fee-high") sorted.sort((a, b) => b.fee - a.fee);
    if (sort === "new") sorted.sort((a, b) => b.reviews - a.reviews);
    return sorted;
  }, [query, sort, subject, board, location, mode, fee, rating]);

  // gender is UI-only (mock data has no gender field)
  void gender;

  return (
    <div className="min-h-screen bg-background text-foreground lg:h-[100dvh] lg:overflow-hidden">
      <Topbar variant="app" onMenu={() => setMenuOpen(true)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className={cn(
        "mx-auto grid max-w-[1400px] gap-6 px-3 py-4 pb-28 sm:px-4 sm:py-6 transition-all duration-300 lg:h-[calc(100dvh-65px)] lg:overflow-hidden lg:px-8 lg:pb-6",
        isCollapsed 
          ? "grid-cols-1 lg:grid-cols-[72px_minmax(0,1fr)]" 
          : "grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]"
      )}>
        <LeftNav stickyClass="lg:h-full" />

        <div className="min-w-0 space-y-5 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          {/* AI Recommended Section */}
          <AiRecommendedSection />

          {/* Simple heading */}
          <header className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">Available tutors</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {filtered.length} tutor{filtered.length === 1 ? "" : "s"} near you · updated a few minutes ago
              </p>
            </div>
          </header>


          {/* Search + filter row */}
          <section className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, subject or area…"
                className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterSelect label="Subject" value={subject} onChange={setSubject} options={["All subjects", "Physics", "Mathematics", "Higher Math", "Chemistry", "Biology", "English", "Bangla", "ICT"]} />
              <FilterSelect label="Class / Level" value={board} onChange={setBoard} options={["All classes", "JSC", "SSC", "HSC"]} />
              <FilterSelect label="Location" value={location} onChange={setLocation} options={["All locations", "Dhanmondi", "Mirpur", "Uttara", "Gulshan", "Banani", "Mohammadpur"]} />
              <FilterSelect label="Teaching Mode" value={mode} onChange={setMode} options={["Any mode", "Online", "In-person"]} />
              <FilterSelect label="Fee Range" value={fee} onChange={setFee} options={["Any fee", "Under ৳1000", "৳1000 – ৳1500", "৳1500 – ৳2000", "Above ৳2000"]} />
              <FilterSelect label="Rating" value={rating} onChange={setRating} options={["Any rating", "4.5+", "4.0+", "3.5+"]} />
              <FilterSelect label="Gender" value={gender} onChange={setGender} options={["Any gender", "Male", "Female"]} />
              <div className="sm:ml-auto">
                <FilterSelect
                  label="Sort by"
                  value={sortLabel(sort)}
                  onChange={(v) => setSort(sortValue(v))}
                  options={["Top rated", "Most reviewed", "Fee: low to high", "Fee: high to low"]}
                />
              </div>
            </div>
          </section>

          {/* Tutor list */}
          <section className="space-y-3">
            {filtered.map((t) => {
              const avail = availabilityMeta[t.availability];
              const isSaved = !!saved[t.id];
              return (
                <article
                  key={t.id}
                  className="rounded-2xl border border-border bg-surface p-4 transition hover:border-foreground/15 hover:shadow-sm sm:p-5"
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={t.photo}
                        alt={t.name}
                        loading="lazy"
                        className="h-12 w-12 rounded-full object-cover ring-1 ring-border sm:h-16 sm:w-16"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                      {t.verified && (
                        <span
                          title="Verified tutor"
                          className="absolute -top-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-surface ring-2 ring-surface"
                        >
                          <BadgeCheck className="h-4 w-4 text-primary" />
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="truncate text-[15px] font-semibold text-foreground">{t.name}</h3>
                          </div>

                          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{t.headline}</p>
                        </div>
                        <FavoriteButton
                          item={{
                            id: t.id,
                            type: "tutor",
                            title: t.name,
                            image: t.photo,
                            userData: {
                              role: "tutor",
                              headline: t.headline,
                              institute: t.location,
                              subjects: t.subjects,
                            }
                          }}
                          compact
                        />
                      </div>

                      {/* Meta row */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-foreground">{t.rating.toFixed(1)}</span>
                          <span>({t.reviews})</span>
                        </span>
                        <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {t.board}</span>
                        <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {t.experience}</span>
                        <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t.location}</span></span>
                        <span className="inline-flex items-center gap-1">
                          {t.mode === "Online" ? <Video className="h-3.5 w-3.5" /> : t.mode === "In-person" ? <Home className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                          {t.mode}
                        </span>
                      </div>

                      {/* Subjects */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {t.subjects.map((s) => (
                          <span
                            key={s}
                            className="rounded-md bg-muted px-2 py-0.5 text-[11.5px] font-medium text-foreground/75"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Footer row */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold text-foreground">
                            ৳{t.fee.toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground"> / hour</span>
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${avail.className}`}>
                            {avail.label}
                          </span>
                        </div>
                        <div className="flex w-full gap-2 sm:w-auto">
                          <Link
                            to="/message"
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[13px] font-medium text-foreground transition hover:border-foreground/25 sm:flex-none sm:py-1.5"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Message
                          </Link>
                          <button
                            type="button"
                            className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 sm:flex-none sm:py-1.5"
                          >
                            View profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
                <p className="text-sm font-medium text-foreground">No tutors match your search</p>
                <p className="mt-1 text-xs text-muted-foreground">Try clearing filters or searching a different subject.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label?: string; value: string; onChange: (v: string) => void; options: string[] }) {
  void label;
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-full border border-border bg-surface pl-3 pr-8 text-[12.5px] font-medium text-foreground outline-none transition hover:border-foreground/25 focus:border-primary focus:ring-2 focus:ring-primary/15"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function sortLabel(s: "top" | "fee-low" | "fee-high" | "new") {
  return s === "top" ? "Top rated" : s === "new" ? "Most reviewed" : s === "fee-low" ? "Fee: low to high" : "Fee: high to low";
}
function sortValue(v: string): "top" | "fee-low" | "fee-high" | "new" {
  if (v === "Most reviewed") return "new";
  if (v === "Fee: low to high") return "fee-low";
  if (v === "Fee: high to low") return "fee-high";
  return "top";
}
