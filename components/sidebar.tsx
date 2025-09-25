"use client";

import { Button } from "@/components/ui/button";
import { History, Settings, Smile, Home, Archive, ImageIcon } from "lucide-react";
import { useAppContext } from "@/components/app-provider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/use-translation";

export type View = "encoder-decoder" | "history" | "emoji-management" | "settings" | "vault" | "qr-reader" | "steganography";

interface SidebarProps {
  closeSidebar: () => void;
}

export function Sidebar({ closeSidebar }: SidebarProps) {
  const { setActiveView, isVaultVisible, setIsVaultVisible, autoCopy, setAutoCopy, isSteganographyVisible } = useAppContext();
  const { t } = useTranslation();

  const handleNavigation = (view: View) => {
    setActiveView(view);
    if (view !== 'vault') {
        setIsVaultVisible(false);
    }
    closeSidebar();
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4 animate-in">{t('sidebar.title')}</h2>
      <nav className="flex flex-col space-y-2 flex-1">
        <Button variant="ghost" className="w-full justify-start animate-in" style={{ animationDelay: "0.1s" }} onClick={() => handleNavigation("encoder-decoder")}>
          <Home className="ml-2 h-4 w-4" />
          <span>{t('sidebar.home')}</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start animate-in" style={{ animationDelay: "0.2s" }} onClick={() => handleNavigation("history")}>
          <History className="ml-2 h-4 w-4" />
          <span>{t('sidebar.history')}</span>
        </Button>
        {isSteganographyVisible && (
            <Button variant="ghost" className="w-full justify-start animate-in" style={{ animationDelay: "0.3s" }} onClick={() => handleNavigation("steganography")}>
                <ImageIcon className="ml-2 h-4 w-4" />
                <span>{t('sidebar.steganography')}</span>
            </Button>
        )}
        {isVaultVisible && (
            <Button variant="ghost" className="w-full justify-start animate-in" style={{ animationDelay: "0.3s" }} onClick={() => handleNavigation("vault")}>
                <Archive className="ml-2 h-4 w-4" />
                <span>{t('sidebar.vault')}</span>
            </Button>
        )}
        <Button variant="ghost" className="w-full justify-start animate-in" style={{ animationDelay: "0.4s" }} onClick={() => handleNavigation("emoji-management")}>
          <Smile className="ml-2 h-4 w-4" />
          <span>{t('sidebar.emojiManagement')}</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start animate-in" style={{ animationDelay: "0.5s" }} onClick={() => handleNavigation("settings")}>
          <Settings className="ml-2 h-4 w-4" />
          <span>{t('sidebar.settings')}</span>
        </Button>
      </nav>
      <div className="animate-in" style={{ animationDelay: "0.6s" }}>
        <Separator />
        <div className="pt-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox id="auto-copy" checked={autoCopy} onCheckedChange={(checked) => setAutoCopy(!!checked)} />
              <Label htmlFor="auto-copy" className="cursor-pointer">
                  {t('sidebar.autoCopy')}
              </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
