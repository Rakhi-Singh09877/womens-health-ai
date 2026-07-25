import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { Activity, ChevronRight, ShieldCheck, Sparkles, Stethoscope, type LucideIcon } from "lucide-react";
import { api } from "@/lib/convex-client";
import { useSession } from "@/context/session-context";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InsightCard } from "@/pages/insights/insight-card";
import type { AiInsight, SymptomLog, User } from "@/types/health";

type StatTone = "primary" | "success";

const Stat = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: StatTone;
}) => {
  const toneCls =
    tone === "success" ? "bg-success-soft text-success" : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneCls)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="mt-2 text-lg font-bold leading-none text-foreground">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
};

const Doctor = () => {
  const navigate = useNavigate();
  const { userId } = useSession();

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip") as
    | User
    | null
    | undefined;
  const insights = useQuery(
    api.aiInsights.getAiInsightsByUserId,
    userId ? { userId } : "skip",
  ) as AiInsight[] | undefined;
  const logs = useQuery(
    api.symptomLogs.listSymptomLogs,
    userId ? { userId } : "skip",
  ) as SymptomLog[] | undefined;

  const loading = insights === undefined || logs === undefined;

  const confirmed = useMemo(
    () => (insights ?? []).filter((i) => i.status === "verified"),
    [insights],
  );
  const totalLogs = logs?.length ?? 0;
  const toPct = (v: number) => (v > 1 ? v : v * 100);
  const avgConfidence = confirmed.length
    ? Math.round(
        confirmed.reduce((a, b) => a + toPct(b.confidence ?? 0), 0) / confirmed.length,
      )
    : 0;

  const name = user?.name ?? "Patient";

  return (
    <AppShell showNav>
      <PageHeader
        title="Doctor view"
        subtitle={user === undefined ? "Loading…" : name}
      />

      <div className="space-y-5 px-5 pb-8">
        <div className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-xs leading-relaxed text-warning">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Observed patterns are derived from self-reported data. Use clinical judgment before
            acting on them.
          </p>
        </div>

        {/* Stats: real counts only — no Risk Level, no DoB */}
        <div className="grid grid-cols-3 gap-2">
          <Stat
            label="Confirmed"
            value={loading ? "—" : `${confirmed.length}`}
            icon={ShieldCheck}
            tone="success"
          />
          <Stat
            label="Total logs"
            value={loading ? "—" : `${totalLogs}`}
            icon={Activity}
            tone="primary"
          />
          <Stat
            label="Avg conf."
            value={loading ? "—" : `${avgConfidence}%`}
            icon={Sparkles}
            tone="primary"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Observed patterns</h2>
            <button
              type="button"
              onClick={() => navigate("/timeline")}
              className="flex items-center text-xs font-medium text-primary"
            >
              Timeline <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            [0, 1].map((i) => (
              <div key={i} className="shimmer mb-3 h-40 animate-shimmer rounded-2xl" />
            ))
          ) : confirmed.length ? (
            <div className="space-y-3">
              {confirmed.map((ins) => (
                <InsightCard key={ins._id} insight={ins} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
              <p className="text-sm font-medium text-foreground">No confirmed patterns</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Verified insights will appear here once the verifier agent confirms them.
              </p>
            </div>
          )}
        </div>

        <Button variant="outline" className="w-full" onClick={() => navigate("/timeline")}>
          View full timeline <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </AppShell>
  );
};

export default Doctor;
