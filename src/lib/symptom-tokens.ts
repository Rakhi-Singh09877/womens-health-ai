/** Shared tone tokens for symptom/overview UI: soft background + solid icon color. */

export type SymptomTone = "pain" | "energy" | "mood" | "sleep";

export const toneClasses: Record<
  SymptomTone,
  { soft: string; text: string; ring: string }
> = {
  pain: { soft: "bg-pain-soft", text: "text-pain", ring: "ring-pain/30" },
  energy: { soft: "bg-energy-soft", text: "text-energy", ring: "ring-energy/30" },
  mood: { soft: "bg-mood-soft", text: "text-mood", ring: "ring-mood/30" },
  sleep: { soft: "bg-sleep-soft", text: "text-sleep", ring: "ring-sleep/30" },
};
