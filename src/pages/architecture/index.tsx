import { useNavigate } from "react-router-dom";
import { ArrowDown, Brain, Database, ShieldCheck, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";

interface Node {
  icon: LucideIcon;
  title: string;
  description: string;
}

const nodes: Node[] = [
  {
    icon: Database,
    title: "Convex Database",
    description:
      "Stores your symptom logs, cycle data, and AI insights. Every entry is queryable in real time, so the app updates the moment data changes.",
  },
  {
    icon: Brain,
    title: "Claude Sonnet 5 — Insight Agent",
    description:
      "Reads your logs and proposes patterns: what's recurring, what correlates, and what might matter for you.",
  },
  {
    icon: ShieldCheck,
    title: "Claude Sonnet 5 — Verifier Agent",
    description:
      "Independently reviews the insight agent's claims against your raw data before anything reaches you.",
  },
];

const Architecture = () => {
  const navigate = useNavigate();

  return (
    <AppShell>
      <PageHeader
        title="How it works"
        subtitle="The AI behind your insights"
        onBack={() => navigate("/insights")}
      />

      <div className="px-5 pb-8">
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Every time you log symptoms, two independent Claude agents review your entry. Here's the
          pipeline.
        </p>

        <div>
          {nodes.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.title}>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-semibold leading-tight text-foreground">
                      {node.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {node.description}
                  </p>
                </div>
                {i < nodes.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          Only insights that survive the verifier agent are marked Verified in your Insights list.
          The rest stay Pending or are marked Contradicted.
        </div>
      </div>
    </AppShell>
  );
};

export default Architecture;
