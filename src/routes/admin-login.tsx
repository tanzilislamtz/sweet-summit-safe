import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — Learns Academy" },
      { name: "description", content: "Secure sign in for Learns Academy administrators and moderators." },
      { property: "og:title", content: "Admin Sign In — Learns Academy" },
      { property: "og:description", content: "Secure sign in for Learns Academy administrators and moderators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handleDemoLogin() {
    setEmail("demo@learnsacademy.com");
    setPassword("demo123");
    setError(null);
    setNotice(null);
    setBusy(true);
    // Note: This assumes a demo account exists in the database. 
    // For a real app, you'd use a server function to handle demo sessions securely.
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: "demo@learnsacademy.com",
        password: "demo123",
      });
      if (err) throw err;
      navigate({ to: "/admin" });
    } catch (err) {
      setError("Demo account is currently unavailable. Please try signing up.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate({ to: "/admin" });
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
            data: { full_name: name },
          },
        });
        if (err) throw err;
        if (data.session) navigate({ to: "/admin" });
        else setNotice("Check your email to confirm the account, then sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-12 text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-xl"
      >
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to site
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Admin Control Panel</h1>
            <p className="text-xs text-muted-foreground">Staff access only — Learns Academy</p>
          </div>
        </div>

        <div className="mt-6 flex gap-1 rounded-full border border-border p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-sm transition",
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Your name"
              />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="admin@learnsacademy.com"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </label>

          {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
          {notice && <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create admin account"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Demo Preview</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={busy}
            className="group flex w-full items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 transition hover:border-primary hover:bg-primary/10 disabled:opacity-60"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-primary">Explore as Guest Admin</p>
              <p className="text-[10px] text-muted-foreground">No credentials required for demo</p>
            </div>
            <div className="rounded-full bg-primary/20 p-1.5 transition group-hover:bg-primary group-hover:text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          The first account created becomes the owner administrator. Everyone else joins as a standard user until an
          admin grants them a role.
        </p>
      </motion.div>
    </main>
  );
}
