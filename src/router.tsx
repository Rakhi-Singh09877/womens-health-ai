import { Navigate } from "react-router-dom";
import { RequireSession } from "@/components/session/require-session";
import Auth from "./pages/auth";
import Onboarding from "./pages/onboarding";
import Home from "./pages/home";
import LogSymptoms from "./pages/log-symptoms";
import Processing from "./pages/processing";
import Insights from "./pages/insights";
import Timeline from "./pages/timeline";
import History from "./pages/history";
import Profile from "./pages/profile";
import Doctor from "./pages/doctor";
import Architecture from "./pages/architecture";

export const routers = [
  { path: "/", name: "auth", element: <Auth /> },
  {
    path: "/onboarding",
    name: "onboarding",
    element: (
      <RequireSession>
        <Onboarding />
      </RequireSession>
    ),
  },
  {
    path: "/home",
    name: "home",
    element: (
      <RequireSession>
        <Home />
      </RequireSession>
    ),
  },
  {
    path: "/log",
    name: "log",
    element: (
      <RequireSession>
        <LogSymptoms />
      </RequireSession>
    ),
  },
  {
    path: "/processing",
    name: "processing",
    element: (
      <RequireSession>
        <Processing />
      </RequireSession>
    ),
  },
  {
    path: "/insights",
    name: "insights",
    element: (
      <RequireSession>
        <Insights />
      </RequireSession>
    ),
  },
  {
    path: "/timeline",
    name: "timeline",
    element: (
      <RequireSession>
        <Timeline />
      </RequireSession>
    ),
  },
  {
    path: "/history",
    name: "history",
    element: (
      <RequireSession>
        <History />
      </RequireSession>
    ),
  },
  {
    path: "/profile",
    name: "profile",
    element: (
      <RequireSession>
        <Profile />
      </RequireSession>
    ),
  },
  {
    path: "/doctor",
    name: "doctor",
    element: (
      <RequireSession>
        <Doctor />
      </RequireSession>
    ),
  },
  {
    path: "/architecture",
    name: "architecture",
    element: (
      <RequireSession>
        <Architecture />
      </RequireSession>
    ),
  },
  { path: "*", name: "not-found", element: <Navigate to="/" replace /> },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
