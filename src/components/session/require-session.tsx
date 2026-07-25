import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/context/session-context";

/** Auth gate: redirects to `/` (Auth) when no userId is set in session. */
export const RequireSession = ({ children }: { children: ReactNode }) => {
  const { userId } = useSession();
  if (!userId) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
