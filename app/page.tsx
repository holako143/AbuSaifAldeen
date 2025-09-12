"use client";

import { Suspense } from "react";
import { TopBar } from "@/components/top-bar";
import { Base64EncoderDecoderContent } from "./encoder-decoder-content";
import { HistoryView } from "./history-view";
import { EmojiManagementView } from "./emoji-management-view";
import { SettingsView } from "./settings-view";
import { VaultPage } from "./vault-page";
import { Card, CardContent } from "@/components/ui/card";
import { AppProvider, useAppContext } from "@/context/app-context";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

function LoadingFallback() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <div className="text-center p-12">
          <p>جارٍ التحميل...</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AppContent() {
  const { activeView } = useAppContext();

  const renderContent = () => {
    switch (activeView) {
      case "history":
        return <HistoryView />;
      case "emoji-management":
        return <EmojiManagementView />;
      case "settings":
        return <SettingsView />;
      case "vault":
        return <VaultPage />;
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
      <TopBar />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
      <PwaInstallPrompt />
    </div>
  );
}


export default function HomePage() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
