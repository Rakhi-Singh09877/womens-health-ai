import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { AlertTriangle, CalendarRange } from "lucide-react";
import { api } from "@/lib/convex-client";
import { useSession } from "@/context/session-context";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import type { TimelineEntry } from "@/types/health";

const Timeline = () => {
  const navigate = useNavigate();
  const { userId } = useSession();

  const entries = useQuery(
    api.symptomLogs.getSymptomTimeline,
    userId ? { userId } : "skip",
  ) as TimelineEntry[] | undefined;

  const loading = entries === undefined;
  const count = entries?.length ?? 0;

  return (
    <AppShell>
      <PageHeader
        title="Doctor timeline"
        subtitle="Self-reported symptom history"
        onBack={() => navigate(-1)}
      />

      <div className="space-y-4 px-5 pb-8">
        {/* Disclaimer banner */}
        <div className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-xs leading-relaxed text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This timeline summarizes your self-reported symptoms to support conversations with your
            clinician. It is not a diagnosis.
          </p>
        </div>

        {/* Factual summary — no fabricated verified/contradicted counts */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarRange className="h-4 w-4" />
          {loading ? "Loading…" : `${count} ${count === 1 ? "month" : "months"} tracked`}
        </div>

        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-20 animate-shimmer rounded-2xl" />
          ))
        ) : count > 0 ? (
          <div className="relative">
            <div className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
            <div className="space-y-3">
              {entries.map((entry, i) => {
                const sev = Number(entry.severityTrend);
                const sevLabel = Number.isFinite(sev) ? sev.toFixed(1) : "—";
                return (
                  <div key={`${entry.monthLabel}-${i}`} className="relative pl-7">
                    <span className="absolute left-0 top-2 h-[11px] w-[11px] rounded-full border-2 border-primary bg-card" />
                    <div className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {entry.monthLabel}
                        </span>
                        <span className="rounded-full bg-pain-soft px-2 py-0.5 text-[11px] font-medium text-pain">
                          avg {sevLabel}
                        </span>
                      </div>
                      {entry.keySymptom ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Key symptom:{" "}
                          <span className="font-medium text-foreground">{entry.keySymptom}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <p className="text-sm font-medium text-foreground">No timeline yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your tracked months will appear here as you log symptoms.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Timeline;
