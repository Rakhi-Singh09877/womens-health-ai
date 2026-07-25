import { useState } from "react";
import {
  ChevronDown,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AiInsight, InsightStatus } from "@/types/health";

const statusMeta: Record<
  InsightStatus,
  { label: string; icon: LucideIcon; classes: string }
> = {
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    classes: "bg-success-soft text-success",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    classes: "bg-warning-soft text-warning",
  },
  contradicted: {
    label: "Contradicted",
    icon: ShieldAlert,
    classes: "bg-pain-soft text-pain",
  },
};

interface InsightCardProps {
  insight: AiInsight;
}

export const InsightCard = ({ insight }: InsightCardProps) => {
  const [open, setOpen] = useState(false);
  const meta = statusMeta[insight.status] ?? statusMeta.pending;
  const StatusIcon = meta.icon;
  const rawConfidence = insight.confidence ?? 0;
  const confidence = Math.round(rawConfidence > 1 ? rawConfidence : rawConfidence * 100);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold leading-tight text-foreground">
                {insight.title}
              </h3>
              {insight.category ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{insight.category}</p>
              ) : null}
            </div>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
              meta.classes,
            )}
          >
            <StatusIcon className="h-3 w-3" /> {meta.label}
          </span>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{insight.description}</p>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-medium text-foreground">{confidence}%</span>
          </div>
          <Progress value={confidence} className="h-1.5" />
        </div>

        <div className="text-xs text-muted-foreground">
          {insight.evidenceCount} similar {insight.evidenceCount === 1 ? "log" : "logs"}
        </div>

        {insight.agentDebateSummary ? (
          <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-foreground"
            >
              View agent debate
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
              />
            </button>
            {open && (
              <p className="border-t border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                {insight.agentDebateSummary}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
