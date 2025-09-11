"use client";

import { useState, Suspense } from "react";
import { TopBar } from "@/components/top-bar";
import { View } from "@/components/sidebar";
import { Base64EncoderDecoderContent } from "./encoder-decoder-content";
import { HistoryView } from "./history-view";
import { EmojiManagementView } from "./emoji-management-view";
import { SettingsView } from "./settings-view";
import { Card, CardContent } from "@/components/ui/card";

// Loading fallback component for Suspense
function LoadingFallback() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <div className="text-center p-12">
          <p>جارٍ التحميل...</p>
        </div>
      </CardContent>
    </Card>
  )
}

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
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Base64EncoderDecoderContent />
          </Suspense>
        );
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
