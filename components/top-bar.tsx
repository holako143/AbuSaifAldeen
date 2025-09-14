"use client";

import { useState } from "react";
import { Menu, Moon, Sun, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "./ui/use-toast";
import { useAppContext } from "@/components/app-provider";
import { useTranslation } from "@/hooks/use-translation";

export function TopBar() {
  const {
    setActiveView,
    isPasswordEnabled,
    setIsPasswordEnabled,
  } = useAppContext();
  const { t } = useTranslation();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogoClick = () => {
    setActiveView("encoder-decoder");
  };

  const handleLogoDoubleClick = () => {
    setIsPasswordEnabled(prev => {
        const newState = !prev;
        if (newState) {
            toast({ title: t('topbar.safeModeEnabled'), description: t('topbar.safeModeEnabledDesc') });
        } else {
            toast({ title: t('topbar.safeModeDisabled'), description: t('topbar.safeModeDisabledDesc') });
        }
        return newState;
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="animate-in">
            <button
              onClick={handleLogoClick}
              onDoubleClick={handleLogoDoubleClick}
              className="flex items-center gap-2 mr-6 rtl:mr-0 rtl:ml-6"
            >
              <ShieldCheck className={cn("h-6 w-6 text-primary transition-colors", isPasswordEnabled && "text-green-500")} />
              <h1 className="text-xl font-bold">{t('topbar.appName')}</h1>
            </button>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 rtl:space-x-reverse">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="animate-in" style={{ animationDelay: "0.3s" }}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">{t('topbar.toggleThemeSr')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('topbar.toggleTheme')}</p>
            </TooltipContent>
          </Tooltip>

          <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="animate-in" style={{ animationDelay: "0.4s" }}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">{t('topbar.openMenuSr')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <Sidebar closeSidebar={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
