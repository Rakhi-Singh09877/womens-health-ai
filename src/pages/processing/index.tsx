import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAction } from "convex/react";
import {
  Brain,
  CheckCircle2,
  Circle,
  Database,
  Loader2,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/convex-client";
import { getErrorMessage } from "@/lib/convex-error";
import { useSession } from "@/context/session-context";
import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type StepState = "pending" | "active" | "done";

interface Step {
  label: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  { label: "Reading your symptom log", icon: Database },
  { label: "Insight agent analyzing patterns", icon: Brain },
  { label: "Verifier agent reviewing", icon: ShieldCheck },
  { label: "Finalizing your insights", icon: Sparkles },
];

const Processing = () => {
  const navigate = useNavigate();
  const { userId } = useSession();
  const runAnalysis = useAction(api.aiAgents.runDualAgentAnalysis);

  const [steps, setSteps] = useState<StepState[]>(STEPS.map(() => "pending"));
  const [actionDone, setActionDone] = useState(false);
  const firedRef = useRef(false);

  // Fire the dual-agent analysis once (parallel to the animation).
  useEffect(() => {
    if (firedRef.current || !userId) return;
    firedRef.current = true;

    let cancelled = false;
    const hardTimeout = window.setTimeout(() => {
      if (!cancelled) setActionDone(true);
    }, 12000);

    runAnalysis({ userId })
      .then(() => {
        if (!cancelled) setActionDone(true);
      })
      .catch((err) => {
        const message = getErrorMessage(err);
        console.error("[Processing] runDualAgentAnalysis failed:", message, err);
        if (!cancelled) {
          toast.error(message);
          setActionDone(true);
        }
      })
      .finally(() => window.clearTimeout(hardTimeout));

    return () => {
      cancelled = true;
      window.clearTimeout(hardTimeout);
    };
  }, [userId, runAnalysis]);

  // Animate the 4-step checklist on a timer.
  useEffect(() => {
    const timers: number[] = [];
    STEPS.forEach((_, i) => {
      const startAt = 400 + i * 950;
      timers.push(
        window.setTimeout(() => {
          setSteps((prev) => prev.map((s, idx) => (idx === i ? "active" : s)));
          timers.push(
            window.setTimeout(() => {
              setSteps((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
            }, 750),
          );
        }, startAt),
      );
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  // Navigate to Insights once the animation finished AND the action resolved.
  useEffect(() => {
    if (actionDone && steps.every((s) => s === "done")) {
      const t = window.setTimeout(() => navigate("/insights", { replace: true }), 650);
      return () => window.clearTimeout(t);
    }
  }, [actionDone, steps, navigate]);

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        {/* Pulsing emblem */}
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
          <span
            className="absolute inset-2 rounded-full bg-primary/10 animate-pulse-ring"
            style={{ animationDelay: "0.3s" }}
          />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-soft">
            <Brain className="h-10 w-10 text-primary-foreground" />
          </span>
        </div>

        <h1 className="text-xl font-bold text-foreground">AI is analyzing</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Two independent Claude agents are reviewing your entry. This usually takes a few seconds.
        </p>

        <div className="mt-8 w-full max-w-sm space-y-2">
          {STEPS.map((step, i) => {
            const state = steps[i];
            const Icon = step.icon;
            return (
              <div
                key={step.label}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                  state === "done"
                    ? "border-success/30 bg-success-soft"
                    : state === "active"
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-card",
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center">
                  {state === "done" ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : state === "active" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </span>
                <p
                  className={cn(
                    "flex-1 text-left text-sm font-medium",
                    state === "pending" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.label}
                </p>
                <Icon
                  className={cn(
                    "h-4 w-4",
                    state === "pending" ? "text-muted-foreground/30" : "text-muted-foreground",
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
};

export default Processing;
