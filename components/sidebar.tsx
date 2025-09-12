"use client";

import { Button } from "@/components/ui/button";
import { History, Settings, Smile, Home, Archive } from "lucide-react";
import { useAppContext } from "@/context/app-context";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export type View = "encoder-decoder" | "history" | "emoji-management" | "settings" | "vault";

interface SidebarProps {
  closeSidebar: () => void;
}

export function Sidebar({ closeSidebar }: SidebarProps) {
  const { setActiveView, isVaultVisible, setIsVaultVisible, autoCopy, setAutoCopy } = useAppContext();

  const handleNavigation = (view: View) => {
    setActiveView(view);
    if (view !== 'vault') {
        setIsVaultVisible(false);
    }
    closeSidebar();
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">القائمة</h2>
      <nav className="flex flex-col space-y-2 flex-1">
        <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation("encoder-decoder")}>
          <Home className="ml-2 h-4 w-4" />
          <span>الرئيسية</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation("history")}>
          <History className="ml-2 h-4 w-4" />
          <span>سجل التشفير</span>
        </Button>
        {isVaultVisible && (
            <Button variant="ghost" className="w-full justify-start animate-in" onClick={() => handleNavigation("vault")}>
                <Archive className="ml-2 h-4 w-4" />
                <span>الخزنة السرية</span>
            </Button>
        )}
        <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation("emoji-management")}>
          <Smile className="ml-2 h-4 w-4" />
          <span>إدارة الإيموجي</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation("settings")}>
          <Settings className="ml-2 h-4 w-4" />
          <span>الإعدادات</span>
        </Button>
      </nav>
      <Separator />
      <div className="pt-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox id="auto-copy" checked={autoCopy} onCheckedChange={(checked) => setAutoCopy(!!checked)} />
            <Label htmlFor="auto-copy" className="cursor-pointer">
                نسخ تلقائي للناتج
            </Label>
        </div>
      </div>
    </div>
  );
}
