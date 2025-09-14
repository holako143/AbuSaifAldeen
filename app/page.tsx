"use client";

import { Suspense } from "react";
import dynamic from 'next/dynamic';
import { Card, CardContent } from "@/components/ui/card";
import { AppProvider, useAppContext } from "@/context/app-context";

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

const TopBar = dynamic(() => import('@/components/top-bar').then(mod => mod.TopBar), { ssr: false, loading: () => <div className="h-14" /> });
const Base64EncoderDecoderContent = dynamic(() => import('./encoder-decoder-content').then(mod => mod.Base64EncoderDecoderContent), { ssr: false, loading: () => <LoadingFallback /> });
const HistoryView = dynamic(() => import('./history-view').then(mod => mod.HistoryView), { ssr: false, loading: () => <LoadingFallback /> });
const EmojiManagementView = dynamic(() => import('./emoji-management-view').then(mod => mod.EmojiManagementView), { ssr: false, loading: () => <LoadingFallback /> });
const SettingsView = dynamic(() => import('./settings-view').then(mod => mod.SettingsView), { ssr: false, loading: () => <LoadingFallback /> });
const VaultPage = dynamic(() => import('./vault-page').then(mod => mod.VaultPage), { ssr: false, loading: () => <LoadingFallback /> });


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
        return <Base64EncoderDecoderContent />;
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
