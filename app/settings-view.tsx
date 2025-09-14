"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useAppContext } from "@/components/app-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { changeMasterPassword } from "@/lib/vault";

function LanguageSwitcher() {
    const { t } = useTranslation();
    const { locale, setLocale } = useAppContext();

    return (
        <div className="space-y-2">
            <h3 className="text-lg font-medium">{t('settings.language')}</h3>
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
        <div className="space-y-4">
             <div>
                <h3 className="text-lg font-medium">{t('settings.theme.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.theme.description')}</p>
            </div>
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
    const { isVaultUnlocked } = useAppContext();
  return (
    <Card className="w-full max-w-4xl mx-auto animate-in">
      <CardHeader>
        <CardTitle>{t('settings.title')}</CardTitle>
        <CardDescription>
          {t('settings.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <LanguageSwitcher />
        <Separator />
        <ThemeCustomizer />
      </CardContent>
    </Card>
  );
}
