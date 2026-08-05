import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import logoAsset from "@/assets/learns-academy-logo.png.asset.json";
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  GraduationCap,
  BookOpen,
  Users,
  Camera as CameraIcon,
  Upload,
  X,
  Heart,
  Code2,
  Languages,
  Palette,
  Calculator,
  FlaskConical,
  Music,
  Camera,
  Sparkles,
  BarChart3,
  Award,
  MapPin,
  Phone as PhoneIcon,
  Building2,
  Baby,
  Briefcase,
  Clock,
  DollarSign,
  FileText,
  UserCircle2,
  IdCard,
  ShieldCheck,
} from "lucide-react";


import { AuthShell, Field, SocialBtn } from "./login";
import { AvatarCropper } from "@/components/AvatarCropper";
import { signIn } from "@/lib/session";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Learns Academy" },
      { name: "description", content: "Join Learns Academy in three quick steps." },
    ],
  }),
  component: RegisterPage,
});

type Role = "student" | "tutor" | "parent";

const TOPICS = [
  { id: "math", label: "Mathematics", icon: Calculator },
  { id: "physics", label: "Physics", icon: FlaskConical },
  { id: "chem", label: "Chemistry", icon: FlaskConical },
  { id: "bio", label: "Biology", icon: FlaskConical },
  { id: "english", label: "English", icon: Languages },
  { id: "bangla", label: "Bangla", icon: Languages },
  { id: "ict", label: "ICT", icon: Code2 },
  { id: "web", label: "Web Development", icon: Code2 },
  { id: "data", label: "Data Science", icon: BarChart3 },
  { id: "programming", label: "Programming", icon: Code2 },
  { id: "emerging", label: "Emerging Tech", icon: Sparkles },
  { id: "biz", label: "Business", icon: BookOpen },
  { id: "design", label: "Design", icon: Palette },
  { id: "photo", label: "Photography", icon: Camera },
  { id: "music", label: "Music", icon: Music },
  { id: "sports", label: "Sports", icon: Award },
  { id: "motivation", label: "Motivation", icon: Heart },
  { id: "social", label: "Social Studies", icon: Users },
];

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Step 2: Profile
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [institute, setInstitute] = useState("");
  const [address, setAddress] = useState("");
  const [agree, setAgree] = useState(false);
  const [role, setRole] = useState<Role | "">("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [rawAvatar, setRawAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Student-specific
  const [grade, setGrade] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  // Tutor-specific
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [subjectsTaught, setSubjectsTaught] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bio, setBio] = useState("");

  // Parent-specific
  const [childName, setChildName] = useState("");
  const [childGrade, setChildGrade] = useState("");
  const [relation, setRelation] = useState("");


  const onPickAvatar = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setRawAvatar(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Step 2: OTP verification (demo — any 4 digits accepted)
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendIn, setResendIn] = useState(0);
  const otpValue = otp.join("");
  const otpValid = /^\d{4}$/.test(otpValue);

  // Step 3: Interests
  const [topics, setTopics] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pwStrength = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const profileBaseValid =
    name.trim().length > 1 &&
    lastName.trim().length > 0 &&
    /^01\d{9}$/.test(phone) &&
    !!gender &&
    address.trim().length > 3 &&
    agree &&
    !!avatar;

  const profileRoleValid =
    (role === "student" &&
      institute.trim().length > 1 &&
      grade.trim().length > 0 &&
      /^01\d{9}$/.test(guardianPhone)) ||
    (role === "tutor" &&
      institute.trim().length > 1 &&
      qualification.trim().length > 1 &&
      experience.trim().length > 0 &&
      subjectsTaught.trim().length > 1 &&
      hourlyRate.trim().length > 0 &&
      bio.trim().length > 10) ||
    (role === "parent" &&
      childName.trim().length > 1 &&
      childGrade.trim().length > 0 &&
      !!relation);

  const canNext =
    (step === 0 && !!role) ||
    (step === 1 && email.includes("@") && password.length >= 6) ||
    (step === 2 && profileBaseValid && profileRoleValid) ||
    (step === 3 && otpValid) ||
    (step === 4 && topics.length >= 1);

  const next = () => {
    if (!canNext) return;
    if (step === 4) return submit();
    // Entering OTP step: start resend cooldown
    if (step === 2) setResendIn(30);

    setDir(1);
    setStep((s) => s + 1);
  };
  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  // Countdown for OTP resend
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const setOtpAt = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const n = [...prev];
      n[i] = digit;
      return n;
    });
    if (digit && i < 3) otpRefs.current[i + 1]?.focus();
  };

  const onOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 3) otpRefs.current[i + 1]?.focus();
  };

  const onOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    otpRefs.current[Math.min(text.length, 3)]?.focus();
  };

  const submit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      signIn({ email, name });
      setTimeout(() => navigate({ to: "/" }), 1400);
    }, 900);
  };

  const toggleTopic = (id: string) =>
    setTopics((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  return (
    <AuthShell
      side={
        <>
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Three quick steps.{" "}
            <em className="text-accent not-italic">A lifetime of learning.</em>
          </h2>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/75">
            Tell us who you are and what you love. We'll shape your feed and
            match you with the right people.
          </p>
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2">
          <img src={logoAsset.url} alt="Learns Academy" className="h-11 w-auto" />
        </div>


        <div className="mt-8 flex items-baseline justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Create account</h1>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            Step {step + 1} of 5
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Already have one?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>

        {/* Journey Stepper — advanced */}
        <JourneyStepper
          step={step}
          total={5}
          onJump={(i) => {
            if (i < step) {
              setDir(-1);
              setStep(i);
            }
          }}
        />


        {/* Steps */}
        <div className="relative mt-5">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="grid place-items-center py-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  className="grid h-16 w-16 place-items-center rounded-full bg-tutor text-tutor-foreground"
                >
                  <Check className="h-8 w-8" strokeWidth={3} />
                </motion.div>
                <h3 className="mt-4 font-display text-xl font-semibold">
                  You're in, {name || "learner"}.
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Taking you to your feed…
                </p>
              </motion.div>
            ) : step === 0 ? (
              <StepPane key="s-role" dir={dir}>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Pick the role that fits you best — we'll tailor the next steps for you.
                  </p>
                  <div className="grid gap-3">
                    <BigRoleCard
                      label="Student"
                      desc="Learn, ask doubts, join classes"
                      icon={BookOpen}
                      accent="from-primary/15 to-primary/5"
                      active={role === "student"}
                      onClick={() => setRole("student")}
                    />
                    <BigRoleCard
                      label="Tutor"
                      desc="Teach subjects, mentor learners, earn"
                      icon={GraduationCap}
                      accent="from-tutor/20 to-tutor/5"
                      active={role === "tutor"}
                      onClick={() => setRole("tutor")}
                    />
                    <BigRoleCard
                      label="Parent"
                      desc="Track & guide your child's learning"
                      icon={Heart}
                      accent="from-accent/20 to-accent/5"
                      active={role === "parent"}
                      onClick={() => setRole("parent")}
                    />
                  </div>
                </div>
              </StepPane>
            ) : step === 1 ? (
              <StepPane key="s-account" dir={dir}>

                <div className="space-y-4">
                  <Field
                    id="email"
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@school.edu"
                    required
                  />
                  <div>
                    <Field
                      id="password"
                      label="Password"
                      icon={Lock}
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={setPassword}
                      placeholder="At least 6 characters"
                      required
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                    <div className="mt-2 flex items-center gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={false}
                          animate={{
                            backgroundColor:
                              i < pwStrength
                                ? pwStrength >= 3
                                  ? "var(--tutor)"
                                  : "var(--accent)"
                                : "var(--muted)",
                          }}
                          className="h-1.5 flex-1 rounded-full"
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {pwStrength >= 3
                        ? "Strong password"
                        : pwStrength >= 1
                          ? "Add a number or symbol to strengthen"
                          : "Use 8+ chars with a mix"}
                    </p>
                  </div>

                  <div className="pt-1">
                    <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="h-px flex-1 bg-border" />
                      or continue with
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <SocialBtn label="Google" compact />
                      <SocialBtn label="Apple" compact />
                      <SocialBtn label="Facebook" compact />
                      <SocialBtn label="LinkedIn" compact />
                      <SocialBtn label="GitHub" compact />
                      <SocialBtn label="X" compact />
                      <SocialBtn label="Microsoft" compact />
                      <SocialBtn label="Discord" compact />
                    </div>
                  </div>
                </div>
              </StepPane>
            ) : step === 2 ? (
              <StepPane key="s-profile" dir={dir}>

                <div className="space-y-5">
                  {/* Avatar upload — polished, drag-and-drop */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.dataset.drag = "on";
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.dataset.drag = "off";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.dataset.drag = "off";
                      onPickAvatar(e.dataTransfer.files?.[0]);
                    }}
                    className="group/upload relative flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-gradient-to-br from-surface to-muted/40 p-5 transition data-[drag=on]:border-primary data-[drag=on]:bg-primary/5"
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        Profile picture
                      </p>
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                        Required
                      </span>
                    </div>

                    {/* Big clickable avatar */}
                    <div className="relative">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => fileRef.current?.click()}
                        className="relative grid h-32 w-32 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-tutor/15 ring-2 ring-background"
                        aria-label={avatar ? "Change profile picture" : "Upload profile picture"}
                      >
                        {/* Rotating dashed ring */}
                        <motion.span
                          aria-hidden
                          animate={{ rotate: 360 }}
                          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                        />
                        {avatar ? (
                          <img
                            src={avatar}
                            alt="Profile preview"
                            className="relative h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="relative flex flex-col items-center gap-1 text-primary/70">
                            <CameraIcon className="h-8 w-8" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                              Tap to upload
                            </span>
                          </div>
                        )}
                        {/* Hover overlay */}
                        <span className="absolute inset-0 grid place-items-center rounded-full bg-foreground/60 text-background opacity-0 backdrop-blur-sm transition group-hover/upload:opacity-100">
                          <Upload className="h-6 w-6" />
                        </span>
                      </motion.button>
                      {/* Status dot */}
                      <span
                        className={`absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full ring-2 ring-background transition ${
                          avatar
                            ? "bg-tutor text-tutor-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {avatar ? (
                          <Check className="h-4 w-4" strokeWidth={3} />
                        ) : (
                          <CameraIcon className="h-3.5 w-3.5" />
                        )}
                      </span>
                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar(null)}
                          className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background shadow-md transition hover:scale-110"
                          aria-label="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        onPickAvatar(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />

                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setRawAvatar(avatar)}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Re-crop photo
                      </button>
                    )}
                  </div>

                  <AvatarCropper
                    src={rawAvatar}
                    onCancel={() => setRawAvatar(null)}
                    onApply={(url) => {
                      setAvatar(url);
                      setRawAvatar(null);
                    }}
                  />



                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      id="firstName"
                      label="First name"
                      icon={UserIcon}
                      value={name}
                      onChange={setName}
                      placeholder="Ayesha"
                      required
                    />
                    <Field
                      id="lastName"
                      label="Last name"
                      icon={UserIcon}
                      value={lastName}
                      onChange={setLastName}
                      placeholder="Rahman"
                      required
                    />
                  </div>

                  <Field
                    id="phone"
                    label="Phone number"
                    icon={PhoneIcon}
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="01XXXXXXXXX"
                    required
                  />

                  <div>
                    <label htmlFor="gender" className="mb-1.5 block text-xs font-semibold text-foreground/80">
                      Gender
                    </label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        required
                        className="h-11 w-full appearance-none rounded-xl border border-border bg-surface pl-10 pr-8 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                      >
                        <option value="">Select gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                        <option value="na">Prefer not to say</option>
                      </select>
                      <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-muted-foreground" />
                    </div>
                  </div>

                  <Field
                    id="address"
                    label="Full address"
                    icon={MapPin}
                    value={address}
                    onChange={setAddress}
                    placeholder="House, road, area, city"
                    required
                  />

                  {/* Role badge */}
                  <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                      {role === "tutor" ? (
                        <GraduationCap className="h-4 w-4" />
                      ) : role === "parent" ? (
                        <Heart className="h-4 w-4" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                        Joining as {role || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Fields below are tailored for {role || "you"}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDir(-1);
                        setStep(0);
                      }}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* STUDENT-specific */}
                  {role === "student" && (
                    <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Student details
                      </p>
                      <Field
                        id="institute"
                        label="School / College"
                        icon={Building2}
                        value={institute}
                        onChange={setInstitute}
                        placeholder="e.g. Notre Dame College"
                        required
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="grade" className="mb-1.5 block text-xs font-semibold text-foreground/80">
                            Class / Grade
                          </label>
                          <div className="relative">
                            <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <select
                              id="grade"
                              value={grade}
                              onChange={(e) => setGrade(e.target.value)}
                              required
                              className="h-11 w-full appearance-none rounded-xl border border-border bg-surface pl-10 pr-8 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                            >
                              <option value="">Select class</option>
                              {["6","7","8","9","10","11","12","Undergrad","Postgrad"].map((c) => (
                                <option key={c} value={c}>Class {c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <Field
                          id="guardianPhone"
                          label="Guardian phone"
                          icon={PhoneIcon}
                          type="tel"
                          value={guardianPhone}
                          onChange={setGuardianPhone}
                          placeholder="01XXXXXXXXX"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* TUTOR-specific */}
                  {role === "tutor" && (
                    <div className="space-y-4 rounded-2xl border border-tutor/30 bg-tutor/5 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-tutor">
                        Tutor profile
                      </p>
                      <Field
                        id="institute"
                        label="University / Institute"
                        icon={Building2}
                        value={institute}
                        onChange={setInstitute}
                        placeholder="e.g. University of Dhaka"
                        required
                      />
                      <Field
                        id="qualification"
                        label="Highest qualification"
                        icon={Award}
                        value={qualification}
                        onChange={setQualification}
                        placeholder="e.g. BSc in Mathematics"
                        required
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field
                          id="experience"
                          label="Experience (years)"
                          icon={Clock}
                          type="number"
                          value={experience}
                          onChange={setExperience}
                          placeholder="e.g. 3"
                          required
                        />
                        <Field
                          id="hourlyRate"
                          label="Hourly rate (৳)"
                          icon={DollarSign}
                          type="number"
                          value={hourlyRate}
                          onChange={setHourlyRate}
                          placeholder="e.g. 500"
                          required
                        />
                      </div>
                      <Field
                        id="subjectsTaught"
                        label="Subjects you teach"
                        icon={BookOpen}
                        value={subjectsTaught}
                        onChange={setSubjectsTaught}
                        placeholder="Math, Physics, Chemistry"
                        required
                      />
                      <div>
                        <label htmlFor="bio" className="mb-1.5 block text-xs font-semibold text-foreground/80">
                          Short bio
                        </label>
                        <div className="relative">
                          <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell students about your teaching style, achievements…"
                            rows={3}
                            required
                            className="w-full resize-none rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {bio.length}/300 — minimum 10 characters
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PARENT-specific */}
                  {role === "parent" && (
                    <div className="space-y-4 rounded-2xl border border-accent/30 bg-accent/5 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                        Your child
                      </p>
                      <Field
                        id="childName"
                        label="Child's full name"
                        icon={Baby}
                        value={childName}
                        onChange={setChildName}
                        placeholder="e.g. Rahim Ahmed"
                        required
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="childGrade" className="mb-1.5 block text-xs font-semibold text-foreground/80">
                            Child's class
                          </label>
                          <div className="relative">
                            <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <select
                              id="childGrade"
                              value={childGrade}
                              onChange={(e) => setChildGrade(e.target.value)}
                              required
                              className="h-11 w-full appearance-none rounded-xl border border-border bg-surface pl-10 pr-8 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                            >
                              <option value="">Select class</option>
                              {["1","2","3","4","5","6","7","8","9","10","11","12"].map((c) => (
                                <option key={c} value={c}>Class {c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="relation" className="mb-1.5 block text-xs font-semibold text-foreground/80">
                            Relation
                          </label>
                          <div className="relative">
                            <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <select
                              id="relation"
                              value={relation}
                              onChange={(e) => setRelation(e.target.value)}
                              required
                              className="h-11 w-full appearance-none rounded-xl border border-border bg-surface pl-10 pr-8 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                            >
                              <option value="">Select</option>
                              <option value="mother">Mother</option>
                              <option value="father">Father</option>
                              <option value="guardian">Guardian</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  <label className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs text-foreground/80">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                    />
                    <span>
                      I agree to the <Link to="/terms" className="font-semibold text-primary hover:underline">Terms</Link> and <Link to="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
                    </span>
                  </label>
                </div>
              </StepPane>
            ) : step === 3 ? (
              <StepPane key="s-otp" dir={dir}>
                <div className="space-y-5">
                  <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-surface to-muted/40 p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Check your phone
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          We sent a 4-digit code to{" "}
                          <span className="font-medium text-foreground">
                            {phone || "your number"}
                          </span>
                          . Enter it below to verify.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-2 sm:gap-3">
                      {otp.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            otpRefs.current[i] = el;
                          }}
                          value={d}
                          onChange={(e) => setOtpAt(i, e.target.value)}
                          onKeyDown={(e) => onOtpKeyDown(i, e)}
                          onPaste={onOtpPaste}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          aria-label={`Digit ${i + 1}`}
                          className={`h-14 w-12 rounded-xl border-2 bg-surface text-center font-display text-2xl font-semibold tabular-nums text-foreground transition focus:outline-none sm:h-16 sm:w-14 sm:text-3xl ${
                            d
                              ? "border-primary shadow-md shadow-primary/20"
                              : "border-border focus:border-primary/60"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-accent" />
                        Demo — any 4 digits work
                      </span>
                      {resendIn > 0 ? (
                        <span>Resend in {resendIn}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOtp(["", "", "", ""]);
                            setResendIn(30);
                            otpRefs.current[0]?.focus();
                          }}
                          className="font-semibold text-primary hover:underline"
                        >
                          Resend code
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={back}
                    className="mx-auto flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Wrong number? Go back
                  </button>
                </div>
              </StepPane>
            ) : (
              <StepPane key="s3" dir={dir}>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pick at least one topic —{" "}
                    <span className="font-medium text-foreground">
                      {topics.length} selected
                    </span>
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {TOPICS.map((t, i) => {
                      const on = topics.includes(t.id);
                      return (
                        <motion.button
                          key={t.id}
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => toggleTopic(t.id)}
                          className={`relative flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition ${
                            on
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-surface text-foreground/80 hover:border-foreground/30"
                          }`}
                        >
                          <t.icon className="h-4 w-4" />
                          {t.label}
                          <AnimatePresence>
                            {on && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"
                              >
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </StepPane>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        {!done && (
          <div className="mt-6 flex items-center gap-2">
            {step > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={back}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={next}
              disabled={!canNext || loading}
              className="ml-auto inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                  Creating…
                </>
              ) : step === 4 ? (

                <>
                  Finish <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </div>
        )}

      </motion.div>
    </AuthShell>
  );
}

function StepPane({
  children,
  dir,
}: {
  children: React.ReactNode;
  dir: number;
}) {
  return (
    <motion.div
      custom={dir}
      initial={{ opacity: 0, x: 30 * dir, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -30 * dir, filter: "blur(4px)", position: "absolute" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

function RoleCard({
  label,
  desc,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  desc: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative rounded-xl border p-3 text-left transition ${
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-surface hover:border-foreground/30"
      }`}
    >
      <Icon
        className={`h-5 w-5 ${active ? "text-primary" : "text-foreground/70"}`}
      />
      <div className="mt-2 text-sm font-semibold text-foreground">{label}</div>
      <div className="text-[11px] text-muted-foreground">{desc}</div>
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="role-check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function BigRoleCard({
  label,
  desc,
  icon: Icon,
  accent,
  active,
  onClick,
}: {
  label: string;
  desc: string;
  icon: React.ElementType;
  accent: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left transition ${
        active
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-foreground/30"
      }`}
    >
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent} ${
          active ? "text-primary" : "text-foreground/70"
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-[12px] text-muted-foreground">{desc}</div>
      </div>
      <div
        className={`grid h-6 w-6 place-items-center rounded-full border-2 transition ${
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border"
        }`}
      >
        {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </div>
    </motion.button>
  );
}

const JOURNEY_STEPS = [
  { label: "Role", hint: "Who you are", icon: UserCircle2 },
  { label: "Account", hint: "Email & password", icon: Mail },
  { label: "Profile", hint: "Your details", icon: IdCard },
  { label: "Verify", hint: "Confirm code", icon: ShieldCheck },
  { label: "Interests", hint: "What you love", icon: Sparkles },
] as const;

function JourneyStepper({
  step,
  total,
  onJump,
}: {
  step: number;
  total: number;
  onJump: (i: number) => void;
}) {
  const pct = Math.round((step / (total - 1)) * 100);
  const current = JOURNEY_STEPS[step];

  return (
    <div className="mt-7">
      {/* Meta row */}
      <div className="mb-3 flex items-end justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Step {step + 1} / {total}
          </p>
          <motion.p
            key={current.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-0.5 truncate font-display text-base font-semibold text-foreground sm:text-lg"
          >
            {current.label}{" "}
            <span className="text-muted-foreground/70">— {current.hint}</span>
          </motion.p>
        </div>
        <div className="shrink-0 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-bold tabular-nums text-primary">
          {pct}%
        </div>
      </div>

      {/* Track */}
      <div className="relative">
        {/* dashed base line */}
        <svg
          className="absolute left-6 right-6 top-1/2 h-[2px] -translate-y-1/2"
          width="calc(100% - 3rem)"
          preserveAspectRatio="none"
          viewBox="0 0 100 2"
          aria-hidden
        >
          <line
            x1="0"
            y1="1"
            x2="100"
            y2="1"
            stroke="var(--border)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* animated gradient progress */}
        <motion.div
          initial={false}
          animate={{ width: `calc(${pct}% - ${pct > 0 ? "3rem" : "0rem"} * ${pct / 100})` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-6 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full"
          style={{ maxWidth: "calc(100% - 3rem)" }}
        >
          <div className="h-full w-full bg-gradient-to-r from-tutor via-primary to-accent" />
          <motion.div
            aria-hidden
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent mix-blend-overlay"
          />
        </motion.div>

        {/* nodes */}
        <div className="relative flex items-center justify-between">
          {JOURNEY_STEPS.map((s, i) => {
            const active = step === i;
            const done = step > i;
            const clickable = done;
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="relative flex flex-col items-center"
                style={{ width: 48 }}
              >
                <motion.button
                  type="button"
                  disabled={!clickable && !active}
                  onClick={() => clickable && onJump(i)}
                  initial={false}
                  animate={{
                    scale: active ? 1 : done ? 0.92 : 0.85,
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  whileHover={clickable ? { scale: 1 } : undefined}
                  className={`relative grid place-items-center rounded-2xl transition-colors ${
                    active
                      ? "h-12 w-12 bg-[linear-gradient(135deg,#6366f1_0%,#a855f7_45%,#ec4899_100%)] text-white shadow-xl shadow-fuchsia-500/40 ring-2 ring-white/40"
                      : done
                        ? "h-11 w-11 bg-tutor text-tutor-foreground shadow-md shadow-tutor/30 cursor-pointer"
                        : "h-11 w-11 border-2 border-dashed border-border bg-surface text-muted-foreground"
                  }`}
                  aria-label={s.label}
                >
                  {/* pulsing ring on active */}
                  {active && (
                    <>
                      <motion.span
                        aria-hidden
                        initial={{ scale: 1, opacity: 0.55 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-2xl border-2 border-fuchsia-400"
                      />
                    </>
                  )}


                  {done ? (
                    <motion.span
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Check className="h-5 w-5" strokeWidth={3} />
                    </motion.span>
                  ) : (
                    <Icon className={active ? "h-5 w-5" : "h-4 w-4"} />
                  )}

                  {/* index badge */}
                  <span
                    className={`absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold tabular-nums ring-2 ring-background ${
                      active
                        ? "bg-foreground text-background"
                        : done
                          ? "bg-tutor text-tutor-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                </motion.button>

                <motion.span
                  initial={false}
                  animate={{
                    opacity: active ? 1 : done ? 0.85 : 0.55,
                  }}
                  className={`mt-2.5 text-[10px] font-semibold uppercase tracking-wide ${
                    active
                      ? "text-primary"
                      : done
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </motion.span>

                {/* spark under active */}
                {active && (
                  <motion.span
                    aria-hidden
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -bottom-1 left-1/2 h-0.5 w-8 -translate-x-1/2 origin-center rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


