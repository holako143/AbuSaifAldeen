"use client";

import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { View } from "@/components/sidebar";
import { Base64EncoderDecoderContent } from "./encoder-decoder-content";
import { HistoryView } from "./history-view";
import { EmojiManagementView } from "./emoji-management-view";
import { SettingsView } from "./settings-view";

export default function HomePage() {
  const [activeView, setActiveView] = useState<View>("encoder-decoder");

  const renderContent = () => {
    switch (activeView) {
      case "history":
        return <HistoryView />;
      case "emoji-management":
        return <EmojiManagementView />;
      case "settings":
        return <SettingsView />;
      case "encoder-decoder":
      default:
        return <Base64EncoderDecoderContent />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <TopBar setActiveView={setActiveView} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}
