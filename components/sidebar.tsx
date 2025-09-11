"use client";

import { Button } from "@/components/ui/button";
import { History, Settings, Smile, ShieldQuestion } from "lucide-react";
import { EncryptionType } from "./encoding";
import { useToast } from "./ui/use-toast";

export type View = "encoder-decoder" | "history" | "emoji-management" | "settings";

interface SidebarProps {
  setActiveView: (view: View) => void;
  closeSidebar: () => void;
  setIsPasswordEnabled: (enabled: boolean) => void;
  setEncryptionType: (type: EncryptionType) => void;
}

export function Sidebar({ setActiveView, closeSidebar, setIsPasswordEnabled, setEncryptionType }: SidebarProps) {
  const { toast } = useToast();

  const handleNavigation = (view: View) => {
    setActiveView(view);
    closeSidebar();
  };

  const handleHomeDoubleClick = () => {
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
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">القائمة</h2>
      <nav className="flex flex-col space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleNavigation("encoder-decoder")}
          onDoubleClick={handleHomeDoubleClick}
        >
          <ShieldQuestion className="ml-2 h-4 w-4" />
          <span>الرئيسية (اضغط مرتين للوضع الآمن)</span>
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
