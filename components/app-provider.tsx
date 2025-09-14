"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={['light', 'dark', 'system', 'theme-dusk', 'theme-oceanic', 'theme-mirage', 'theme-sakura', 'theme-matrix']}
    >
      <TooltipProvider>
        {children}
        <SonnerToaster richColors />
      </TooltipProvider>
    </ThemeProvider>
  );
}
