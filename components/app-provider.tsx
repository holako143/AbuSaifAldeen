"use client";

import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { db } from '@/lib/db';
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { View } from '@/components/sidebar';

// TYPE DEFINITIONS
export type Locale = 'ar' | 'en';
export type ThemeMode = 'light' | 'dark' | 'custom';

interface AppContextType {
    // Theme
    themeMode: ThemeMode;
    setThemeMode: Dispatch<SetStateAction<ThemeMode>>;
    primaryColor: string;
    setPrimaryColor: Dispatch<SetStateAction<string>>;
    backgroundColorStart: string;
    setBackgroundColorStart: Dispatch<SetStateAction<string>>;
    backgroundColorEnd: string;
    setBackgroundColorEnd: Dispatch<SetStateAction<string>>;
    textColor: string;
    setTextColor: Dispatch<SetStateAction<string>>;
    // Language
    locale: Locale;
    setLocale: Dispatch<SetStateAction<Locale>>;
    // View
    activeView: View;
    setActiveView: Dispatch<SetStateAction<View>>;
    // Security
    isPasswordEnabled: boolean;
    setIsPasswordEnabled: Dispatch<SetStateAction<boolean>>;
    // Vault
    isVaultVisible: boolean;
    setIsVaultVisible: Dispatch<SetStateAction<boolean>>;
    isVaultUnlocked: boolean;
    setIsVaultUnlocked: Dispatch<SetStateAction<boolean>>;
    masterPassword: string | null;
    setMasterPassword: Dispatch<SetStateAction<string | null>>;
    // Data passing
    textToDecode: string | null;
    setTextToDecode: Dispatch<SetStateAction<string | null>>;
    // Settings
    autoCopy: boolean;
    setAutoCopy: Dispatch<SetStateAction<boolean>>;
    // Easter Eggs
    isSteganographyVisible: boolean;
    setIsSteganographyVisible: Dispatch<SetStateAction<boolean>>;
}

// CONTEXT CREATION
const AppContext = createContext<AppContextType | undefined>(undefined);

// HELPER FUNCTIONS
const hexToHslString = (hex: string): string => {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `${(h * 360).toFixed(0)} ${(s * 100).toFixed(0)}% ${(l * 100).toFixed(0)}%`;
};

// MAIN PROVIDER COMPONENT
export function AppProvider({ children }: { children: React.ReactNode }) {
    // State declarations
    const [locale, setLocale] = useState<Locale>('ar');
    const [activeView, setActiveView] = useState<View>('encoder-decoder');
    const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
    const [isVaultVisible, setIsVaultVisible] = useState(false);
    const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
    const [masterPassword, setMasterPassword] = useState<string | null>(null);
    const [textToDecode, setTextToDecode] = useState<string | null>(null);
    const [autoCopy, setAutoCopy] = useState(true);
    const [isSteganographyVisible, setIsSteganographyVisible] = useState(false);
    const [themeMode, setThemeMode] = useState<ThemeMode>('light');
    const [primaryColor, setPrimaryColor] = useState('#3b82f6');
    const [backgroundColorStart, setBackgroundColorStart] = useState('#ffffff');
    const [backgroundColorEnd, setBackgroundColorEnd] = useState('#e2e8f0');
    const [textColor, setTextColor] = useState('#0a0a0a');

    // Data migration from localStorage to IndexedDB
    useEffect(() => {
        const runMigration = async () => {
            const migrationKey = 'shifrishan-migration-v1-complete';
            const isMigrated = localStorage.getItem(migrationKey);

            if (isMigrated) {
                return;
            }

            console.log("Running data migration from localStorage to IndexedDB...");

            try {
                // History migration
                const historyJson = localStorage.getItem("shifrishan-history");
                if (historyJson) {
                    const historyData = JSON.parse(historyJson);
                    if (Array.isArray(historyData) && historyData.length > 0) {
                        // The old ID was a string, new one is a number. We need to strip the old id.
                        const newHistory = historyData.map(({ id, ...rest }) => rest);
                        await db.history.bulkAdd(newHistory);
                        console.log(`Migrated ${historyData.length} history items.`);
                    }
                }

                // Vault migration
                const vaultBlob = localStorage.getItem("shifrishan-vault-encrypted");
                if (vaultBlob) {
                    await db.vault.put({ id: 'main', data: vaultBlob });
                    console.log("Migrated vault data.");
                }
                const vaultHash = localStorage.getItem("shifrishan-vault-hash");
                if (vaultHash) {
                    await db.vault.put({ id: 'hash', data: vaultHash });
                    console.log("Migrated vault hash.");
                }

                // Emoji list migration
                const emojiJson = localStorage.getItem("shifrishan-emoji-list");
                if (emojiJson) {
                    const emojiList = JSON.parse(emojiJson);
                    await db.appState.put({ key: 'emoji-list', value: emojiList });
                    console.log("Migrated emoji list.");
                }

                // Alphabet list migration
                const alphabetJson = localStorage.getItem("shifrishan-alphabet-list");
                if (alphabetJson) {
                    const alphabetList = JSON.parse(alphabetJson);
                    await db.appState.put({ key: 'alphabet-list', value: alphabetList });
                    console.log("Migrated alphabet list.");
                }

                // Mark migration as complete
                localStorage.setItem(migrationKey, 'true');
                console.log("Data migration complete.");

            } catch (error) {
                console.error("Data migration failed:", error);
            }
        };

        runMigration();
    }, []);

    // Load settings from localStorage
    useEffect(() => {
        const storedStegoVisible = localStorage.getItem("shifrishan-stego-visible");
        if (storedStegoVisible) setIsSteganographyVisible(JSON.parse(storedStegoVisible));

        const storedAutoCopy = localStorage.getItem("shifrishan-auto-copy");
        if (storedAutoCopy) setAutoCopy(JSON.parse(storedAutoCopy));
        const storedLocale = localStorage.getItem("shifrishan-locale") as Locale;
        if (storedLocale) setLocale(storedLocale);
        const storedThemeMode = localStorage.getItem("shifrishan-theme-mode") as ThemeMode;
        if (storedThemeMode) setThemeMode(storedThemeMode);
        const storedPrimary = localStorage.getItem("shifrishan-color-primary");
        if (storedPrimary) setPrimaryColor(storedPrimary);
        const storedBgStart = localStorage.getItem("shifrishan-color-bg-start");
        if (storedBgStart) setBackgroundColorStart(storedBgStart);
        const storedBgEnd = localStorage.getItem("shifrishan-color-bg-end");
        if (storedBgEnd) setBackgroundColorEnd(storedBgEnd);
        const storedText = localStorage.getItem("shifrishan-color-text");
        if (storedText) setTextColor(storedText);
    }, []);

    // Persist settings to localStorage
    useEffect(() => { localStorage.setItem("shifrishan-stego-visible", JSON.stringify(isSteganographyVisible)); }, [isSteganographyVisible]);
    useEffect(() => { localStorage.setItem("shifrishan-auto-copy", JSON.stringify(autoCopy)); }, [autoCopy]);
    useEffect(() => { localStorage.setItem("shifrishan-locale", locale); }, [locale]);
    useEffect(() => { localStorage.setItem("shifrishan-theme-mode", themeMode); }, [themeMode]);
    useEffect(() => { localStorage.setItem("shifrishan-color-primary", primaryColor); }, [primaryColor]);
    useEffect(() => { localStorage.setItem("shifrishan-color-bg-start", backgroundColorStart); }, [backgroundColorStart]);
    useEffect(() => { localStorage.setItem("shifrishan-color-bg-end", backgroundColorEnd); }, [backgroundColorEnd]);
    useEffect(() => { localStorage.setItem("shifrishan-color-text", textColor); }, [textColor]);

    // Apply theme and language direction
    useEffect(() => {
        const root = document.documentElement;
        root.lang = locale;
        root.dir = locale === 'ar' ? 'rtl' : 'ltr';

        if (themeMode === 'custom') {
            document.body.style.backgroundImage = `linear-gradient(to bottom right, ${backgroundColorStart}, ${backgroundColorEnd})`;
            root.style.setProperty('--background', '0 0% 100%'); // Reset for card backgrounds etc.
            root.style.setProperty('--foreground', hexToHslString(textColor));
            root.style.setProperty('--primary', hexToHslString(primaryColor));
            const primaryL = parseFloat(hexToHslString(primaryColor).split(' ')[2]);
            const primaryFg = primaryL > 50 ? '0 0% 3.9%' : '0 0% 98%';
            root.style.setProperty('--primary-foreground', primaryFg);
        } else {
            document.body.style.backgroundImage = '';
            root.style.removeProperty('--background');
            root.style.removeProperty('--foreground');
            root.style.removeProperty('--primary');
            root.style.removeProperty('--primary-foreground');
        }
    }, [locale, themeMode, primaryColor, backgroundColorStart, backgroundColorEnd, textColor]);

    const value = {
        themeMode, setThemeMode, primaryColor, setPrimaryColor, backgroundColorStart, setBackgroundColorStart, backgroundColorEnd, setBackgroundColorEnd, textColor, setTextColor,
        locale, setLocale, activeView, setActiveView, isPasswordEnabled, setIsPasswordEnabled, isVaultVisible, setIsVaultVisible,
        isVaultUnlocked, setIsVaultUnlocked, masterPassword, setMasterPassword, textToDecode, setTextToDecode, autoCopy, setAutoCopy,
        isSteganographyVisible, setIsSteganographyVisible,
    };

    return (
        <AppContext.Provider value={value}>
            <NextThemesProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
            forcedTheme={themeMode === 'custom' ? 'light' : undefined}
            >
                <TooltipProvider>
                    {children}
                    <SonnerToaster richColors />
                </TooltipProvider>
            </NextThemesProvider>
        </AppContext.Provider>
    );
}

// CUSTOM HOOK
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
