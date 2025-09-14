"use client";

import { Suspense } from "react";
import dynamic from 'next/dynamic';
import { HistoryView } from "./history-view";
import { EmojiManagementView } from "./emoji-management-view";
import { SettingsView } from "./settings-view";
import { VaultPage } from "./vault-page";
import { Card, CardContent } from "@/components/ui/card";
import { AppProvider, useAppContext } from "@/context/app-context";
import { useTranslation } from "@/hooks/use-translation";

function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <div className="text-center p-12">
          <p>{t('app.loading')}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const TopBar = dynamic(() => import('@/components/top-bar').then(mod => mod.TopBar), { ssr: false });
const Base64EncoderDecoderContent = dynamic(() => import('./encoder-decoder-content').then(mod => mod.Base64EncoderDecoderContent), { ssr: false });

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
