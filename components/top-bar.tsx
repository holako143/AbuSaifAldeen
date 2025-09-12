"use client";

import { useState } from "react";
import { Menu, Moon, Sun, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar, View } from "./sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EncryptionType } from "@/app/encoding";
import { cn } from "@/lib/utils";
import { useToast } from "./ui/use-toast";

interface TopBarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isPasswordEnabled: boolean;
  setIsPasswordEnabled: (enabled: boolean | ((prevState: boolean) => boolean)) => void;
  setEncryptionType: (type: EncryptionType) => void;
}

export function TopBar({ activeView, setActiveView, isPasswordEnabled, setIsPasswordEnabled, setEncryptionType }: TopBarProps) {
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
            setEncryptionType("aes256");
            toast({ title: "تم تفعيل الوضع الآمن", description: "نوع التشفير الآن هو AES-256." });
        } else {
            setEncryptionType("simple");
            toast({ title: "تم تعطيل الوضع الآمن", description: "نوع التشفير الآن هو إخفاء بسيط." });
        }
        return newState;
    });
  };

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogoClick}
                onDoubleClick={handleLogoDoubleClick}
                className="flex items-center gap-2 mr-6 rtl:mr-0 rtl:ml-6"
              >
                <ShieldCheck className={cn("h-6 w-6 text-primary transition-colors", isPasswordEnabled && "text-green-500")} />
                <h1 className="text-xl font-bold">شفريشن</h1>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>اضغط مرة للرئيسية، ومرتين للوضع الآمن</p>
            </TooltipContent>
          </Tooltip>

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
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
