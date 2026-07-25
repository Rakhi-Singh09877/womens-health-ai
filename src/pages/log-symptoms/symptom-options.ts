import {
  Activity,
  BatteryLow,
  Brain,
  Cloud,
  Cookie,
  Flame,
  Heart,
  Moon,
  Smile,
  Sparkle,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { SymptomTone } from "@/lib/symptom-tokens";

export type { SymptomTone } from "@/lib/symptom-tokens";
export { toneClasses } from "@/lib/symptom-tokens";

export interface SymptomOption {
  /**
   * Canonical value sent to the backend as both a `symptoms[]` entry and the
   * matching key in `severities`. Must be EXACTLY the same string in both
   * places — this is also what's shown on the chip, so there is only one
   * source of truth and no risk of a label/value mismatch.
   */
  label: string;
  icon: LucideIcon;
  tone: SymptomTone;
}

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  { label: "Cramps", icon: Flame, tone: "pain" },
  { label: "Headache", icon: Brain, tone: "pain" },
  { label: "Back Pain", icon: Activity, tone: "pain" },
  { label: "Bloating", icon: Cloud, tone: "energy" },
  { label: "Fatigue", icon: BatteryLow, tone: "energy" },
  { label: "Nausea", icon: Waves, tone: "energy" },
  { label: "Cravings", icon: Cookie, tone: "energy" },
  { label: "Mood Swings", icon: Smile, tone: "mood" },
  { label: "Anxiety", icon: Wind, tone: "mood" },
  { label: "Breast Tenderness", icon: Heart, tone: "mood" },
  { label: "Acne", icon: Sparkle, tone: "mood" },
  { label: "Insomnia", icon: Moon, tone: "sleep" },
];
