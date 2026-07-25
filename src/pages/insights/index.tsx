import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { Info, Sparkles } from "lucide-react";
import { api } from "@/lib/convex-client";
import { useSession } from "@/context/session-context";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { InsightCard } from "./insight-card";
import type { AiInsight } from "@/types/health";

const Insights = () => {
  const navigate = useNavigate();
  const { userId } = useSession();

  const insights = useQuery(
    api.aiInsights.getAiInsightsByUserId,
    userId ? { userId } : "skip",
  ) as AiInsight[] | undefined;

  const loading = insights === undefined;
  const count = insights?.length ?? 0;

  return (
    <AppShell showNav>
      <PageHeader
        title="Insights"
        subtitle={
          loading ? "Loading…" : `${count} ${count === 1 ? "pattern" : "patterns"} found`
        }
        right={
          <button
            type="button"
            onClick={() => navigate("/architecture")}
            className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Info className="h-3.5 w-3.5" /> How it works
          </button>
        }
      />

      <div className="space-y-3 px-5 pb-8">
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-40 animate-shimmer rounded-2xl" />
          ))
        ) : count > 0 ? (
          insights.map((insight) => (
            <InsightCard key={insight._id} insight={insight} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">No insights yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Log a few symptoms and your AI analysis will appear here.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Insights;
