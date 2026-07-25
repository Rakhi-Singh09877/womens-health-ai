import { NavLink } from "react-router-dom";
import { History, Home, Sparkles, Stethoscope, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/history", label: "History", icon: History },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/doctor", label: "Doctor", icon: Stethoscope },
  { to: "/profile", label: "Profile", icon: User },
] as const;

/** 5-tab bottom navigation pinned to the bottom of the AppShell card. */
export const BottomNav = () => {
  return (
    <nav className="absolute inset-x-0 bottom-0 border-t border-border/70 bg-card/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="flex items-center justify-around">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="flex flex-1 flex-col items-center gap-1 py-1">
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
