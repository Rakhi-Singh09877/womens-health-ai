import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider } from "convex/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { convexClient } from "./lib/convex-client";
import { SessionProvider } from "./context/session-context";
import { routers } from "./router";

const queryClient = new QueryClient();

const App = () => {
  const router = createBrowserRouter(routers);
  return (
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <RouterProvider router={router} />
          </TooltipProvider>
        </SessionProvider>
      </QueryClientProvider>
    </ConvexProvider>
  );
};

export default App;
