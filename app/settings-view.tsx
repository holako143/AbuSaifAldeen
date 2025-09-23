"use client";

import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Palette, Languages, History, Database, DownloadCloud } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useAppContext } from "@/components/app-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { changeMasterPassword } from "@/lib/vault";
import { exportAllData, importAllData } from "@/lib/backup";

function InstallPwaManager() {
    const { t } = useTranslation();
    const { installPrompt, setInstallPrompt } = useAppContext();

    const handleInstall = async () => {
        if (!installPrompt) return;
        (installPrompt as any).prompt();
        // The prompt can only be used once.
        setInstallPrompt(null);
    };

    if (!installPrompt) return null;

    return (
        <div className="space-y-4">
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="install-app" className="text-base">{t('settings.pwa.installTitle')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.pwa.installDescription')}</p>
                </div>
                <Button id="install-app" onClick={handleInstall}>
                    <DownloadCloud className="ml-2 h-4 w-4" />
                    {t('settings.pwa.installButton')}
                </Button>
            </div>
        </div>
    );
}

function DataBackupManager() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        const result = await exportAllData();
        if (result.success) {
            toast({ title: t('settings.backup.exportSuccess') });
        } else {
            toast({ variant: "destructive", title: t('settings.backup.exportError'), description: result.message });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const result = await importAllData(text);
                if (result.success) {
                    toast({ title: t('settings.backup.importSuccess'), description: t('settings.backup.importSuccessDesc') });
                    // Reload the page to apply all restored settings
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    throw new Error(result.message);
                }
            } catch (error: any) {
                toast({ variant: "destructive", title: t('settings.backup.importError'), description: error.message });
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('settings.backup.description')}</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleExport} className="w-full sm:w-auto">{t('settings.backup.exportButton')}</Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">{t('settings.backup.importButton')}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('settings.backup.importConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('settings.backup.importConfirmDesc')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('settings.backup.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleImportClick}>{t('settings.backup.confirm')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
            </div>
        </div>
    );
}

function LanguageSwitcher() {
    const { t } = useTranslation();
    const { locale, setLocale } = useAppContext();

    return (
        <div className="space-y-2 pt-2">
            <ToggleGroup
                type="single"
                value={locale}
                onValueChange={(value) => {
                    if (value) setLocale(value as 'ar' | 'en');
                }}
                className="justify-start"
            >
                <ToggleGroupItem value="en" aria-label={t('settings.languages.en')}>
                    {t('settings.languages.en')}
                </ToggleGroupItem>
                <ToggleGroupItem value="ar" aria-label={t('settings.languages.ar')}>
                    {t('settings.languages.ar')}
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}

function ThemeCustomizer() {
    const { t } = useTranslation();
    const {
        themeMode, setThemeMode,
        primaryColor, setPrimaryColor,
        backgroundColorStart, setBackgroundColorStart,
        backgroundColorEnd, setBackgroundColorEnd,
        textColor, setTextColor
    } = useAppContext();

    const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
        <div className="flex items-center justify-between p-2 border rounded-lg">
            <Label>{label}</Label>
            <div className="relative">
                <input
                    type="color"
                    value={value}
                    onChange={onChange}
                    className="w-8 h-8 p-0 border-none appearance-none bg-transparent cursor-pointer"
                    style={{'--color': value} as React.CSSProperties}
                />
                 <div className="absolute inset-0 rounded-full pointer-events-none" style={{backgroundColor: value, border: '1px solid #88888844'}}></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 pt-2">
            <ToggleGroup
                type="single"
                value={themeMode}
                onValueChange={(value) => { if (value) setThemeMode(value as 'light' | 'dark' | 'custom'); }}
                className="justify-start"
            >
                <ToggleGroupItem value="light">{t('settings.theme.light')}</ToggleGroupItem>
                <ToggleGroupItem value="dark">{t('settings.theme.dark')}</ToggleGroupItem>
                <ToggleGroupItem value="custom">{t('settings.theme.custom')}</ToggleGroupItem>
            </ToggleGroup>

            {themeMode === 'custom' && (
                <div className="space-y-2 p-4 border rounded-lg animate-in">
                    <ColorInput label={t('settings.theme.primary')} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                    <ColorInput label={t('settings.theme.backgroundStart')} value={backgroundColorStart} onChange={(e) => setBackgroundColorStart(e.target.value)} />
                    <ColorInput label={t('settings.theme.backgroundEnd')} value={backgroundColorEnd} onChange={(e) => setBackgroundColorEnd(e.target.value)} />
                    <ColorInput label={t('settings.theme.text')} value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                </div>
            )}
        </div>
    );
}

export function SettingsView() {
    const { t } = useTranslation();
    const { isVaultUnlocked, isHistoryEnabled, setIsHistoryEnabled, autoCopy, setAutoCopy } = useAppContext();
  return (
    <Card className="w-full sm:max-w-4xl mx-auto animate-in">
      <CardHeader>
        <CardTitle>{t('settings.title')}</CardTitle>
        <CardDescription>
          {t('settings.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Accordion type="single" collapsible className="w-full" defaultValue="language">
            <AccordionItem value="language">
                <AccordionTrigger>
                    <div className="flex items-center gap-3">
                        <Languages className="h-5 w-5" />
                        <span className="font-semibold">{t('settings.language')}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <LanguageSwitcher />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="theme">
                <AccordionTrigger>
                    <div className="flex items-center gap-3">
                        <Palette className="h-5 w-5" />
                        <span className="font-semibold">{t('settings.theme.title')}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <p className="text-sm text-muted-foreground pb-4">{t('settings.theme.description')}</p>
                    <ThemeCustomizer />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="history">
                <AccordionTrigger>
                    <div className="flex items-center gap-3">
                        <History className="h-5 w-5" />
                        <span className="font-semibold">{t('settings.history.title')}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="history-switch" className="text-base">{t('settings.history.enable')}</Label>
                                <p className="text-sm text-muted-foreground">{t('settings.history.description')}</p>
                            </div>
                            <Switch
                                id="history-switch"
                                checked={isHistoryEnabled}
                                onCheckedChange={setIsHistoryEnabled}
                            />
                        </div>
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="autocopy-switch" className="text-base">{t('settings.autocopy.enable')}</Label>
                                <p className="text-sm text-muted-foreground">{t('settings.autocopy.description')}</p>
                            </div>
                            <Switch
                                id="autocopy-switch"
                                checked={autoCopy}
                                onCheckedChange={setAutoCopy}
                            />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="backup">
                <AccordionTrigger>
                    <div className="flex items-center gap-3">
                        <Database className="h-5 w-5" />
                        <span className="font-semibold">{t('settings.backup.title')}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <DataBackupManager />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="app">
                <AccordionTrigger>
                    <div className="flex items-center gap-3">
                        <DownloadCloud className="h-5 w-5" />
                        <span className="font-semibold">{t('settings.pwa.title')}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <InstallPwaManager />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
