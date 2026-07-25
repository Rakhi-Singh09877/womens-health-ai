import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toneClasses, type SymptomTone } from "@/lib/symptom-tokens";

interface OverviewCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: SymptomTone;
  loading?: boolean;
}

export const OverviewCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
}: OverviewCardProps) => {
  const t = toneClasses[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", t.soft)}>
        <Icon className={cn("h-5 w-5", t.text)} />
      </span>
      <div className="mt-3">
        {loading ? (
          <div className="shimmer h-7 w-16 animate-shimmer rounded-md" />
        ) : (
          <div className="text-2xl font-bold leading-none text-foreground">{value}</div>
        )}
        <div className="mt-1 text-xs font-medium text-muted-foreground">{label}</div>
        {hint ? (
          <div className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</div>
        ) : null}
      </div>
    </div>
  );
};
