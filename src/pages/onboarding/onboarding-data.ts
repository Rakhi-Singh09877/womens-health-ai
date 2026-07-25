import { HeartPulse, ShieldCheck, Stethoscope, type LucideIcon } from "lucide-react";

export interface OnboardingSlide {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    icon: HeartPulse,
    title: "Track how you feel",
    description:
      "Quick daily check-ins capture your symptoms, mood, energy, and sleep — no clinical jargon required.",
  },
  {
    icon: ShieldCheck,
    title: "Two agents, one honest read",
    description:
      "Independent Claude agents review every entry and debate what your patterns might mean before you see them.",
  },
  {
    icon: Stethoscope,
    title: "Bring clarity to your visit",
    description:
      "Walk into your next appointment with a real timeline of what you've been experiencing — not guesswork.",
  },
];
