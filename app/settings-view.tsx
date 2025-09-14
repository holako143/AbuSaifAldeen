"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useAppContext } from "@/context/app-context";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { changeMasterPassword } from "@/lib/vault";

function ChangePasswordForm() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { masterPassword, setMasterPassword, setIsVaultUnlocked } = useAppContext();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            toast({ variant: "destructive", title: t('settings.vault.errorMismatch') });
            return;
        }
        if (!masterPassword) return; // Should not happen if this form is visible

        setIsLoading(true);
        try {
            await changeMasterPassword(masterPassword, newPassword);
            toast({ title: t('settings.vault.success'), description: t('settings.vault.successDescription') });
            // Lock the vault
            setMasterPassword(null);
            setIsVaultUnlocked(false);
            // Clear fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            const errorMessage = error.message.includes("decryption failed")
                ? t('settings.vault.errorWrongPassword')
                : error.message;
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    // This component assumes masterPassword is not null, as it's only shown when vault is unlocked.
    // The check for currentPassword is done by `changeMasterPassword` which uses the real masterPassword from context.
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-medium">{t('settings.vault.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.vault.description')}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="new-password">{t('settings.vault.newPassword')}</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('settings.vault.confirmPassword')}</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handlePasswordChange} disabled={isLoading || !newPassword || !confirmPassword}>
                {isLoading ? "جاري التغيير..." : t('settings.vault.button')}
            </Button>
        </div>
    );
}

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


function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const themes = [
    { name: t('settings.themes.light'), value: "light", class: "bg-gray-100" },
    { name: t('settings.themes.dark'), value: "dark", class: "bg-gray-800" },
    { name: t('settings.themes.dusk'), value: "theme-dusk", class: "theme-dusk-gradient" },
    { name: t('settings.themes.oceanic'), value: "theme-oceanic", class: "theme-oceanic-gradient" },
    { name: t('settings.themes.mirage'), value: "theme-mirage", class: "theme-mirage-gradient" },
    { name: t('settings.themes.sakura'), value: "theme-sakura", class: "theme-sakura-gradient" },
    { name: t('settings.themes.matrix'), value: "theme-matrix", class: "theme-matrix-gradient" },
    { name: t('settings.themes.sunset'), value: "theme-sunset", class: "theme-sunset-gradient" },
    { name: t('settings.themes.emerald'), value: "theme-emerald", class: "theme-emerald-gradient" },
    { name: t('settings.themes.amethyst'), value: "theme-amethyst", class: "theme-amethyst-gradient" },
    { name: t('settings.themes.ruby'), value: "theme-ruby", class: "theme-ruby-gradient" },
    { name: t('settings.themes.midnight'), value: "theme-midnight", class: "theme-midnight-gradient" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{t('settings.standardThemes')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.standardThemesDescription')}
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          {themes.slice(0, 2).map((t) => (
            <ThemeCard key={t.value} {...t} />
          ))}
           <div className="w-24 h-24"> {/* Placeholder for system theme */}
             <button
                onClick={() => setTheme('system')}
                className={cn(
                  "w-full h-full rounded-lg border-2 flex flex-col items-center justify-center transition-all",
                  theme === 'system' ? "border-primary scale-105" : "border-muted hover:border-muted-foreground",
                )}
              >
                <div className="h-10 w-16 rounded-md bg-gradient-to-br from-gray-100 from-50% to-gray-800 to-50%"></div>
                <span className="mt-2 text-sm font-medium">{t('settings.themes.system')}</span>
              </button>
           </div>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-medium">{t('settings.premiumThemes')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.premiumThemesDescription')}
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          {themes.slice(2).map((t) => (
            <ThemeCard key={t.value} {...t} />
          ))}
        </div>
      </div>
    </div>
  );

  function ThemeCard({ name, value, class: themeClass }: { name: string, value: string, class: string }) {
    if (!isMounted) {
      return null; // or a skeleton loader
    }

    const isSelected = theme === value;
    return (
      <div className="w-24">
        <button
          onClick={() => setTheme(value)}
          className={cn(
            "w-full h-24 rounded-lg border-2 flex items-center justify-center transition-all relative overflow-hidden",
            isSelected ? "border-primary ring-2 ring-primary" : "border-muted hover:border-muted-foreground",
          )}
        >
          <div className={cn("h-full w-full", themeClass)} />
           {isSelected && (
            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                <Check className="h-6 w-6 text-primary-foreground" />
            </div>
           )}
        </button>
        <p className="text-center text-sm font-medium mt-2">{name}</p>
      </div>
    );
  }
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
        {isVaultUnlocked && (
            <>
                <ChangePasswordForm />
                <Separator />
            </>
        )}
        <LanguageSwitcher />
        <Separator />
        <ThemeSwitcher />
      </CardContent>
    </Card>
  );
}
