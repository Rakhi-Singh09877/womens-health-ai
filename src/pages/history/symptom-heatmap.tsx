import { cn } from "@/lib/utils";

const cellClass = (count: number) => {
  if (count <= 0) return "bg-muted text-muted-foreground/60";
  if (count === 1) return "bg-primary/30 text-foreground";
  if (count === 2) return "bg-primary/55 text-primary-foreground";
  if (count === 3) return "bg-primary/75 text-primary-foreground";
  return "bg-primary text-primary-foreground";
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

interface SymptomHeatmapProps {
  /** index 0 unused; index 1..daysInMonth holds the log count for that day */
  counts: number[];
  year: number;
  /** 1-12 */
  month: number;
}

export const SymptomHeatmap = ({ counts, year, month }: SymptomHeatmapProps) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-medium text-muted-foreground">
        {WEEKDAYS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => (
          <div key={i} className="aspect-square">
            {d === null ? null : (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center rounded-md text-[10px] font-medium",
                  cellClass(counts[d] ?? 0),
                )}
              >
                {d}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        <span className="h-3 w-3 rounded-sm bg-muted" />
        <span className="h-3 w-3 rounded-sm bg-primary/30" />
        <span className="h-3 w-3 rounded-sm bg-primary/55" />
        <span className="h-3 w-3 rounded-sm bg-primary/75" />
        <span className="h-3 w-3 rounded-sm bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
};
