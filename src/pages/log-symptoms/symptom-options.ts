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
  id: string;
  label: string;
  icon: LucideIcon;
  tone: SymptomTone;
}

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  { id: "cramps", label: "Cramps", icon: Flame, tone: "pain" },
  { id: "headache", label: "Headache", icon: Brain, tone: "pain" },
  { id: "back-pain", label: "Back Pain", icon: Activity, tone: "pain" },
  { id: "bloating", label: "Bloating", icon: Cloud, tone: "energy" },
  { id: "fatigue", label: "Fatigue", icon: BatteryLow, tone: "energy" },
  { id: "nausea", label: "Nausea", icon: Waves, tone: "energy" },
  { id: "cravings", label: "Cravings", icon: Cookie, tone: "energy" },
  { id: "mood-swings", label: "Mood Swings", icon: Smile, tone: "mood" },
  { id: "anxiety", label: "Anxiety", icon: Wind, tone: "mood" },
  { id: "breast-tenderness", label: "Breast Tenderness", icon: Heart, tone: "mood" },
  { id: "acne", label: "Acne", icon: Sparkle, tone: "mood" },
  { id: "insomnia", label: "Insomnia", icon: Moon, tone: "sleep" },
];
