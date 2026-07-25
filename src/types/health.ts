/**
 * Typed shapes for the data returned by the deployed Convex backend. Because we
 * reference functions via `anyApi` (no codegen), every query/mutation/action
 * returns `any`; these interfaces let us cast results at the call site so the
 * UI components stay type-safe.
 */

export type Role = "patient" | "doctor";

export interface User {
  _id: string;
  _creationTime: number;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  role?: Role;
}

export interface Medication {
  name: string;
  dose?: string;
}

export interface HealthProfile {
  _id: string;
  _creationTime: number;
  userId: string;
  chronicConditions: string[];
  medications: Medication[];
  allergies?: string[];
  cycleLength?: number;
  lastPeriodStart?: string;
}

export interface SymptomLog {
  _id: string;
  _creationTime: number;
  userId: string;
  symptoms: string[];
  /** Map of symptom name -> severity 1..5 */
  severities: Record<string, number>;
  /** 1..5 mood rating */
  mood?: number;
  /** 1..5 energy rating */
  energy?: number;
  /** hours slept */
  sleep?: number;
  notes?: string;
}

export type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal";

export interface CycleDayPhase {
  day: number;
  phase: CyclePhase;
  phaseLabel?: string;
}

export type InsightStatus = "verified" | "pending" | "contradicted";

export interface AiInsight {
  _id: string;
  _creationTime: number;
  userId: string;
  title: string;
  description: string;
  status: InsightStatus;
  /** 0..1 */
  confidence: number;
  evidenceCount: number;
  agentDebateSummary?: string;
  category?: string;
}

export interface TimelineEntry {
  monthLabel: string;
  severityTrend: number;
  keySymptom: string;
}

export interface HealthRecord {
  _id: string;
  _creationTime: number;
  userId: string;
  date: string;
  type: string;
  value: string;
  notes?: string;
}
