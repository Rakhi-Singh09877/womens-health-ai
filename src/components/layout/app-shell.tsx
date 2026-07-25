import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
  children: ReactNode;
  /** Show the 5-tab bottom navigation (Home/History/Insights/Doctor/Profile). */
  showNav?: boolean;
  className?: string;
}

/**
 * Recreates the centered, rounded "phone card" look from the screenshots:
 * a soft lavender page with a single white card (max-w-sm) holding the screen.
 */
export const AppShell = ({ children, showNav = false, className }: AppShellProps) => {
  return (
    <div className="bg-page flex min-h-dvh w-full justify-center">
      <div className="relative flex min-h-dvh w-full max-w-sm flex-col overflow-hidden bg-card shadow-soft ring-1 ring-foreground/5 sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2rem]">
        <main className={cn("flex flex-1 flex-col", showNav && "pb-28", className)}>{children}</main>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
};
