"use client";

import { Button } from "@/components/ui/button";
import { History, Settings, Smile, Home, Archive } from "lucide-react";

export type View = "encoder-decoder" | "history" | "emoji-management" | "settings" | "vault";

interface SidebarProps {
  setActiveView: (view: View) => void;
  closeSidebar: () => void;
}

export function Sidebar({ setActiveView, closeSidebar }: SidebarProps) {

  const handleNavigation = (view: View) => {
    setActiveView(view);
    closeSidebar();
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">القائمة</h2>
      <nav className="flex flex-col space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleNavigation("encoder-decoder")}
        >
          <Home className="ml-2 h-4 w-4" />
          <span>الرئيسية</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleNavigation("history")}
        >
          <History className="ml-2 h-4 w-4" />
          <span>سجل التشفير</span>
        </Button>
        <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation("vault")}
        >
            <Archive className="ml-2 h-4 w-4" />
            <span>الخزنة السرية</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleNavigation("emoji-management")}
        >
          <Smile className="ml-2 h-4 w-4" />
          <span>إدارة الإيموجي</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleNavigation("settings")}
        >
          <Settings className="ml-2 h-4 w-4" />
          <span>الإعدادات</span>
        </Button>
      </nav>
    </div>
  );
}
