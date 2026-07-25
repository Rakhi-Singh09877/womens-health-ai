import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { AlertCircle, BatteryCharging, Loader2, Moon, Smile } from "lucide-react";
import { api } from "@/lib/convex-client";
import { getErrorMessage } from "@/lib/convex-error";
import { useSession } from "@/context/session-context";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { toneClasses, type SymptomTone } from "@/lib/symptom-tokens";
import { SYMPTOM_OPTIONS } from "./symptom-options";
import { SymptomChip } from "./symptom-chip";

const severityLabels = ["", "Very mild", "Mild", "Moderate", "Strong", "Severe"];
const MOOD_OPTIONS = ["Low", "Okay", "Calm", "Good", "Great"];

interface MetricSliderProps {
  label: string;
  icon: LucideIcon;
  tone: SymptomTone;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

const MetricSlider = ({
  label,
  icon: Icon,
  tone,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: MetricSliderProps) => {
  const t = toneClasses[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", t.soft)}>
            <Icon className={cn("h-4 w-4", t.text)} />
          </span>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">{display}</span>
      </div>
      <Slider
        className="mt-4"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
};

const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
  <section className="space-y-2">
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
    {children}
  </section>
);

const LogSymptoms = () => {
  const navigate = useNavigate();
  const { userId } = useSession();
  const createSymptomLog = useMutation(api.symptomLogs.createSymptomLog);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [severity, setSeverity] = useState(3);
  const [moodIndex, setMoodIndex] = useState(2);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(7);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggle = (label: string) => {
    setFormError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  // Keys of `severities` are built from the exact same label strings pushed
  // into `symptoms`, so they can never drift apart (chip labels are the only
  // source of truth — see symptom-options.ts).
  const severities = useMemo(() => {
    const out: Record<string, number> = {};
    selected.forEach((label) => {
      out[label] = severity;
    });
    return out;
  }, [selected, severity]);

  const symptomsArray = useMemo(() => Array.from(selected), [selected]);
  const mood = MOOD_OPTIONS[moodIndex];

  const canSubmit = selected.size > 0 && !submitting;

  const handleSubmit = async () => {
    setFormError(null);

    // Client-side validation instead of letting an empty/invalid payload
    // fail silently at the backend call.
    if (symptomsArray.length === 0) {
      setFormError("Select at least one symptom.");
      return;
    }
    if (Object.keys(severities).length === 0) {
      setFormError("Set a severity for your selected symptoms.");
      return;
    }
    if (!userId) {
      setFormError("Your session expired. Please sign in again.");
      return;
    }

    const payload = {
      userId,
      symptoms: symptomsArray,
      severities,
      mood,
      energy,
      sleep,
      notes: notes.trim() || undefined,
    };

    // Log the exact payload before sending so any future symptom/severity key
    // mismatch (or type issue) is visible in the console immediately.
    console.log("[LogSymptoms] createSymptomLog payload:", payload);

    setSubmitting(true);
    try {
      await createSymptomLog(payload);
      navigate("/processing", { replace: true });
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("[LogSymptoms] createSymptomLog failed:", message, err);
      setFormError(message);
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Log symptoms" subtitle="How are you feeling today?" onBack={() => navigate("/home")} />

      <div className="space-y-6 px-5 pb-8">
        <Section title="What are you experiencing?" subtitle="Select all that apply.">
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map((option) => (
              <SymptomChip
                key={option.label}
                option={option}
                selected={selected.has(option.label)}
                onToggle={() => toggle(option.label)}
              />
            ))}
          </div>
        </Section>

        {selected.size > 0 && (
          <Section title="Severity" subtitle="Applies to every selected symptom.">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Overall intensity</span>
                <span className="text-sm font-semibold text-primary">
                  {severityLabels[severity] ?? severity}
                </span>
              </div>
              <Slider
                className="mt-4"
                value={[severity]}
                min={1}
                max={5}
                step={1}
                onValueChange={(v) => setSeverity(v[0])}
              />
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>Mild</span>
                <span>Severe</span>
              </div>
            </div>
          </Section>
        )}

        <Section title="How you're doing">
          <div className="space-y-3">
            <MetricSlider
              label="Mood"
              icon={Smile}
              tone="mood"
              value={moodIndex}
              min={0}
              max={MOOD_OPTIONS.length - 1}
              step={1}
              display={mood}
              onChange={setMoodIndex}
            />
            <MetricSlider
              label="Energy"
              icon={BatteryCharging}
              tone="energy"
              value={energy}
              min={1}
              max={5}
              step={1}
              display={`${energy} / 5`}
              onChange={setEnergy}
            />
            <MetricSlider
              label="Sleep"
              icon={Moon}
              tone="sleep"
              value={sleep}
              min={0}
              max={12}
              step={0.5}
              display={`${sleep} h`}
              onChange={setSleep}
            />
          </div>
        </Section>

        <Section title="Notes" subtitle="Anything else worth remembering?">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Felt fine until late afternoon, then a dull headache set in."
            rows={3}
          />
        </Section>

        {formError ? (
          <div className="flex items-start gap-2 rounded-xl bg-pain-soft p-3 text-xs leading-relaxed text-pain">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{formError}</p>
          </div>
        ) : null}

        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Saving…" : "Save & analyze"}
        </Button>

        <Label className="block text-center text-[11px] leading-relaxed text-muted-foreground">
          Saving creates a log entry and starts a dual-agent AI analysis.
        </Label>
      </div>
    </AppShell>
  );
};

export default LogSymptoms;
