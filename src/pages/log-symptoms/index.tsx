import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { BatteryCharging, Flame, Loader2, Moon, Smile } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/convex-client";
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
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(7);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const severities = useMemo(() => {
    const out: Record<string, number> = {};
    selected.forEach((id) => {
      out[id] = severity;
    });
    return out;
  }, [selected, severity]);

  const canSubmit = selected.size > 0 && !submitting;

  const handleSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await createSymptomLog({
        userId,
        symptoms: Array.from(selected),
        severities,
        mood,
        energy,
        sleep,
        notes: notes.trim() || undefined,
      });
      navigate("/processing", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Could not save your log. Please try again.");
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
                key={option.id}
                option={option}
                selected={selected.has(option.id)}
                onToggle={() => toggle(option.id)}
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
              value={mood}
              min={1}
              max={5}
              step={1}
              display={`${mood} / 5`}
              onChange={setMood}
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
