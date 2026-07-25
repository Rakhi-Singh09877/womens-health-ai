import { cn } from "@/lib/utils";
import { toneClasses } from "@/lib/symptom-tokens";
import type { SymptomOption } from "./symptom-options";

interface SymptomChipProps {
  option: SymptomOption;
  selected: boolean;
  onToggle: () => void;
}

export const SymptomChip = ({ option, selected, onToggle }: SymptomChipProps) => {
  const Icon = option.icon;
  const t = toneClasses[option.tone];
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
        selected
          ? cn("border-transparent ring-2", t.soft, t.text, t.ring)
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {option.label}
    </button>
  );
};
