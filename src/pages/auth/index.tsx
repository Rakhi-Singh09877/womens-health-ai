import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { Apple, ArrowRight, Chrome, Facebook, HeartPulse, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/convex-client";
import { useSession } from "@/context/session-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { User } from "@/types/health";

type Tab = "signin" | "signup";

const providers = [
  { label: "Google", icon: Chrome },
  { label: "Apple", icon: Apple },
  { label: "Facebook", icon: Facebook },
] as const;

const Auth = () => {
  const navigate = useNavigate();
  const { setSession } = useSession();

  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const createUser = useMutation(api.users.createUser);
  const lookup = useQuery(
    api.users.getUserByEmail,
    submittedEmail ? { email: submittedEmail } : "skip",
  );

  const routedRef = useRef(false);

  // Resolve the sign-in lookup: route to Home if found, fall back to create if not.
  useEffect(() => {
    if (routedRef.current || !submittedEmail) return;
    if (lookup === undefined) return; // still loading
    if (lookup) {
      const user = lookup as User;
      routedRef.current = true;
      setSession(user._id, false);
      navigate("/home", { replace: true });
    } else if (lookup === null) {
      setSubmittedEmail(null);
      setTab("signup");
      toast.info("No account found for that email — let's create one.");
    }
  }, [submittedEmail, lookup, setSession, navigate]);

  const handleSignIn = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    routedRef.current = false;
    setSubmittedEmail(email.trim());
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setCreating(true);
    try {
      const result = (await createUser({
        name: name.trim(),
        email: email.trim(),
        age: age ? Number(age) : undefined,
        phone: phone.trim() || undefined,
      })) as unknown;
      const id =
        typeof result === "string"
          ? result
          : (result as { _id?: string } | null | undefined)?._id;
      if (!id) throw new Error("No user id returned");
      setSession(id, true);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Could not create your account. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const lookingUp = submittedEmail !== null && lookup === undefined;

  return (
    <AppShell>
      {/* Hero */}
      <div className="bg-gradient-hero relative px-6 pb-12 pt-14 text-primary-foreground">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">HerLens AI</span>
        </div>
        <h1 className="mt-8 text-[28px] font-bold leading-tight">
          Your health,
          <br />
          seen clearly.
        </h1>
        <p className="mt-2 max-w-[16rem] text-sm text-primary-foreground/80">
          Track symptoms, surface patterns, and share a clear picture with your doctor.
        </p>
      </div>

      {/* Form card */}
      <div className="-mt-6 rounded-t-[2rem] bg-card px-6 pb-8 pt-6 shadow-card">
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          {(["signin", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full py-2 text-sm font-medium transition-colors",
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form
          onSubmit={tab === "signin" ? handleSignIn : handleCreate}
          className="space-y-3"
        >
          {tab === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {tab === "signup" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={1}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="29"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                  autoComplete="tel"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="gradient"
            className="mt-1 w-full"
            disabled={lookingUp || creating}
          >
            {(lookingUp || creating) && <Loader2 className="h-4 w-4 animate-spin" />}
            {tab === "signin" ? "Continue" : "Create account"}
            {!lookingUp && !creating && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or continue with
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {providers.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() =>
                toast.message("Social sign-in isn't available in this preview — please use email.")
              }
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
          By continuing you agree this app provides information, not medical advice.
        </p>
      </div>
    </AppShell>
  );
};

export default Auth;
