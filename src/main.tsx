import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { App } from "./App";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/lib/i18n";
import "@/styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider delayDuration={250}>
            <BrowserRouter>
              <App />
              <Toaster position="bottom-right" richColors />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
