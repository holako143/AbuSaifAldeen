"use client";

import { useState } from "react";
import { Menu, Moon, Sun, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar, View } from "./sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EncryptionType } from "@/app/encoding";

interface TopBarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isPasswordEnabled: boolean;
  setIsPasswordEnabled: (enabled: boolean | ((prevState: boolean) => boolean)) => void;
  setEncryptionType: (type: EncryptionType) => void;
}

export function TopBar({ activeView, setActiveView, isPasswordEnabled, setIsPasswordEnabled, setEncryptionType }: TopBarProps) {
  const { setTheme, theme } = useTheme();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogoClick = () => {
    setActiveView("encoder-decoder");
  };

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <button onClick={handleLogoClick} className="flex items-center gap-2 mr-6 rtl:mr-0 rtl:ml-6">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">شفريشن</h1>
          </button>

          <div className="flex flex-1 items-center justify-end space-x-2 rtl:space-x-reverse">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تغيير المظهر</p>
              </TooltipContent>
            </Tooltip>

            <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <Sidebar
                  setActiveView={setActiveView}
                  closeSidebar={() => setSidebarOpen(false)}
                  setIsPasswordEnabled={setIsPasswordEnabled}
                  setEncryptionType={setEncryptionType}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
