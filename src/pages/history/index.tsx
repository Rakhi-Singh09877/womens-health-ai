import { useMemo } from "react";
import { useQuery } from "convex/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame } from "lucide-react";
import { api } from "@/lib/convex-client";
import { useSession } from "@/context/session-context";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SymptomHeatmap } from "./symptom-heatmap";
import type { SymptomLog } from "@/types/health";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const History = () => {
  const { userId } = useSession();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const logs = useQuery(
    api.symptomLogs.getMonthlySymptomHistory,
    userId ? { userId, year, month } : "skip",
  ) as SymptomLog[] | undefined;

  const loading = logs === undefined;

  const { counts, chartData, totalLogs, activeDays } = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const counts = new Array(daysInMonth + 1).fill(0);
    const sumByDay = new Array(daysInMonth + 1).fill(0);
    const cntByDay = new Array(daysInMonth + 1).fill(0);
    let total = 0;

    logs?.forEach((l) => {
      const d = new Date(l._creationTime);
      const day = d.getDate();
      counts[day] = (counts[day] ?? 0) + 1;
      total++;
      const sev = Object.values(l.severities ?? {});
      if (sev.length) {
        sumByDay[day] += sev.reduce((a, b) => a + b, 0) / sev.length;
        cntByDay[day]++;
      }
    });

    const chartData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      chartData.push({
        day: d,
        pain: cntByDay[d] ? Number((sumByDay[d] / cntByDay[d]).toFixed(2)) : null,
      });
    }

    const activeDays = counts.filter((c: number) => c > 0).length;
    return { counts, chartData, totalLogs: total, activeDays };
  }, [logs, year, month]);

  return (
    <AppShell showNav>
      <PageHeader title="History" subtitle={`${MONTH_NAMES[month - 1]} ${year}`} />

      <div className="space-y-5 px-5 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="text-2xl font-bold text-foreground">
              {loading ? "—" : totalLogs}
            </div>
            <div className="text-xs text-muted-foreground">logs this month</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="text-2xl font-bold text-foreground">
              {loading ? "—" : activeDays}
            </div>
            <div className="text-xs text-muted-foreground">active days</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Daily activity</h2>
          {loading ? (
            <div className="shimmer h-40 animate-shimmer rounded-md" />
          ) : (
            <SymptomHeatmap counts={counts} year={year} month={month} />
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pain-soft">
              <Flame className="h-4 w-4 text-pain" />
            </span>
            <h2 className="text-sm font-semibold text-foreground">Pain trend</h2>
          </div>
          {loading ? (
            <div className="shimmer h-40 animate-shimmer rounded-md" />
          ) : (
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    interval={3}
                  />
                  <YAxis
                    domain={[0, 5]}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pain"
                    name="Pain"
                    stroke="hsl(var(--pain))"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default History;
