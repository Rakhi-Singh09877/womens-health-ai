import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { LogOut, Pill, ShieldAlert } from "lucide-react";
import { api } from "@/lib/convex-client";
import { useSession } from "@/context/session-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import type { AiInsight, HealthProfile, Medication, SymptomLog, User } from "@/types/health";

const Profile = () => {
  const navigate = useNavigate();
  const { userId, clearSession } = useSession();

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip") as
    | User
    | null
    | undefined;
  const profile = useQuery(
    api.healthProfiles.getHealthProfileByUserId,
    userId ? { userId } : "skip",
  ) as HealthProfile | null | undefined;
  const logs = useQuery(
    api.symptomLogs.listSymptomLogs,
    userId ? { userId } : "skip",
  ) as SymptomLog[] | undefined;
  const insights = useQuery(
    api.aiInsights.getAiInsightsByUserId,
    userId ? { userId } : "skip",
  ) as AiInsight[] | undefined;

  const loading = user === undefined;
  const name = user?.name ?? "Your profile";
  const email = user?.email ?? "";
  const initials =
    (name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("") || "?").toUpperCase();

  const daysTracked = useMemo(() => {
    const set = new Set<string>();
    logs?.forEach((l) => {
      const d = new Date(l._creationTime);
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return set.size;
  }, [logs]);
  const insightCount = insights?.length ?? 0;

  const conditions = profile?.chronicConditions ?? [];
  const medications = (profile?.medications ?? []) as Array<Medication | string>;

  const signOut = () => {
    clearSession();
    navigate("/", { replace: true });
  };

  return (
    <AppShell showNav>
      {/* Header */}
      <div className="bg-gradient-hero px-5 pb-10 pt-8 text-primary-foreground">
        <h1 className="text-lg font-semibold">Profile</h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/15 text-xl font-bold backdrop-blur">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{loading ? "…" : name}</p>
            <p className="truncate text-xs text-primary-foreground/80">{email || "—"}</p>
          </div>
        </div>
      </div>

      <div className="-mt-4 space-y-5 rounded-t-[1.5rem] bg-card px-5 pt-5 pb-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="text-2xl font-bold text-foreground">{daysTracked}</div>
            <div className="text-xs text-muted-foreground">days tracked</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="text-2xl font-bold text-foreground">{insightCount}</div>
            <div className="text-xs text-muted-foreground">insights</div>
          </div>
        </div>

        {/* Conditions (plain list, no badges) */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Chronic conditions</h2>
          {conditions.length ? (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
              {conditions.map((c) => (
                <li
                  key={c}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-foreground"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 text-pain" />
                  {c}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              None recorded
            </p>
          )}
        </section>

        {/* Medications (plain list) */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Medications</h2>
          {medications.length ? (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
              {medications.map((m, i) => {
                const label = typeof m === "string" ? m : m.name;
                const dose = typeof m === "string" ? undefined : m.dose;
                return (
                  <li
                    key={`${label}-${i}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground"
                  >
                    <Pill className="h-4 w-4 shrink-0 text-primary" />
                    <span className="flex-1">{label}</span>
                    {dose ? (
                      <span className="text-xs text-muted-foreground">{dose}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              None recorded
            </p>
          )}
        </section>

        <Button variant="outline" className="w-full" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          HerLens AI provides information, not medical advice.
        </p>
      </div>
    </AppShell>
  );
};

export default Profile;
