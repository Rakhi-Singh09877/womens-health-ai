import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Provide to render a back button; receives the click handler. */
  onBack?: () => void;
  right?: ReactNode;
  className?: string;
}

/** Shared screen header: optional back button, title/subtitle, optional right slot. */
export const PageHeader = ({ title, subtitle, onBack, right, className }: PageHeaderProps) => {
  return (
    <div className={cn("flex items-center gap-3 px-5 pb-3 pt-5", className)}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
        {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
};
