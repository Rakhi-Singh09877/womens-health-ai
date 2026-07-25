import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { BatteryCharging, Bell, ChevronRight, Flame, Moon, Plus, Smile } from "lucide-react";
import { api } from "@/lib/convex-client";
import { useSession } from "@/context/session-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { OverviewCard } from "./overview-card";
import type { CycleDayPhase, CyclePhase, SymptomLog } from "@/types/health";

const phaseLabels: Record<CyclePhase, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
};

const avg = (nums: number[]) =>
  nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;

const Home = () => {
  const navigate = useNavigate();
  const { userId } = useSession();

  const cycle = useQuery(
    api.cycles.getCycleDayAndPhase,
    userId ? { userId } : "skip",
  ) as CycleDayPhase | null | undefined;
  const logs = useQuery(
    api.symptomLogs.listSymptomLogs,
    userId ? { userId } : "skip",
  ) as SymptomLog[] | undefined;

  const latest = useMemo<SymptomLog | null>(() => {
    if (!logs || logs.length === 0) return null;
    return logs.reduce((a, b) => (b._creationTime > a._creationTime ? b : a));
  }, [logs]);

  const pain = latest ? avg(Object.values(latest.severities ?? {})) : null;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const cycleLoading = cycle === undefined;
  const logsLoading = logs === undefined;

  return (
    <AppShell showNav>
      <div className="flex items-center justify-between px-5 pb-2 pt-6">
        <div>
          <p className="text-xs text-muted-foreground">{greeting}</p>
          <h1 className="text-xl font-bold text-foreground">Your snapshot</h1>
        </div>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-5 px-5 pb-8">
        {/* Cycle banner */}
        <div className="bg-gradient-hero relative overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-soft">
          <div className="relative z-10">
            <p className="text-xs text-primary-foreground/80">Today</p>
            {cycleLoading ? (
              <div className="shimmer mt-2 h-8 w-40 animate-shimmer rounded-md" />
            ) : cycle ? (
              <>
                <p className="text-2xl font-bold">Day {cycle.day}</p>
                <span className="mt-2 inline-block rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium backdrop-blur">
                  {cycle.phaseLabel ?? phaseLabels[cycle.phase] ?? cycle.phase}
                </span>
              </>
            ) : (
              <>
                <p className="text-lg font-bold">Cycle not set</p>
                <p className="mt-1 text-xs text-primary-foreground/80">
                  Log symptoms to start tracking your cycle.
                </p>
              </>
            )}
          </div>
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-foreground/10" />
          <div className="absolute -bottom-8 right-10 h-20 w-20 rounded-full bg-primary-foreground/10" />
        </div>

        {/* Overview */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Today's overview</h2>
            <button
              type="button"
              onClick={() => navigate("/history")}
              className="flex items-center text-xs font-medium text-primary"
            >
              History <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {logsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="shimmer h-28 animate-shimmer rounded-2xl" />
              ))}
            </div>
          ) : latest ? (
            <div className="grid grid-cols-2 gap-3">
              <OverviewCard
                label="Pain"
                tone="pain"
                icon={Flame}
                value={pain != null ? pain.toFixed(1) : "—"}
                hint={pain != null ? "avg / 5" : "no rating"}
              />
              <OverviewCard
                label="Energy"
                tone="energy"
                icon={BatteryCharging}
                value={latest.energy != null ? `${latest.energy}` : "—"}
                hint={latest.energy != null ? "/ 5" : "no rating"}
              />
              <OverviewCard
                label="Mood"
                tone="mood"
                icon={Smile}
                value={latest.mood ? latest.mood : "—"}
                hint={latest.mood ? "self-reported" : "no rating"}
              />
              <OverviewCard
                label="Sleep"
                tone="sleep"
                icon={Moon}
                value={latest.sleep != null ? `${latest.sleep}` : "—"}
                hint={latest.sleep != null ? "hours" : "no rating"}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Plus className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">No logs yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Log your first symptoms to see your overview.
              </p>
            </div>
          )}
        </div>

        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          onClick={() => navigate("/log")}
        >
          <Plus className="h-4 w-4" /> Log symptoms
        </Button>
      </div>
    </AppShell>
  );
};

export default Home;
