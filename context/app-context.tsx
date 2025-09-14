"use client";

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { View } from '@/components/sidebar';
import { EncryptionType } from '@/app/encoding';

export type Locale = 'ar' | 'en';

interface AppContextType {
    // Theme Customization
    primaryColor: string;
    setPrimaryColor: Dispatch<SetStateAction<string>>;
    backgroundColor: string;
    setBackgroundColor: Dispatch<SetStateAction<string>>;
    textColor: string;
    setTextColor: Dispatch<SetStateAction<string>>;

    // Language Management
    locale: Locale;
    setLocale: Dispatch<SetStateAction<Locale>>;

    // View Management
    activeView: View;
    setActiveView: Dispatch<SetStateAction<View>>;

    // Security Management
    isPasswordEnabled: boolean;
    setIsPasswordEnabled: Dispatch<SetStateAction<boolean>>;

    // Vault Management
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to convert hex to HSL string
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


export const AppProvider = ({ children }: { children: ReactNode }) => {
    // App State
    const [locale, setLocale] = useState<Locale>('ar');
    const [activeView, setActiveView] = useState<View>('encoder-decoder');
    const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
    const [isVaultVisible, setIsVaultVisible] = useState(false);
    const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
    const [masterPassword, setMasterPassword] = useState<string | null>(null);
    const [textToDecode, setTextToDecode] = useState<string | null>(null);
    const [autoCopy, setAutoCopy] = useState(true);

    // Theme State
    const [primaryColor, setPrimaryColor] = useState('#3b82f6'); // blue-500
    const [backgroundColor, setBackgroundColor] = useState('#ffffff'); // white
    const [textColor, setTextColor] = useState('#0a0a0a'); // near-black

    // Load settings from localStorage on initial mount
    useEffect(() => {
        const storedAutoCopy = localStorage.getItem("shifrishan-auto-copy");
        if (storedAutoCopy !== null) setAutoCopy(JSON.parse(storedAutoCopy));

        const storedLocale = localStorage.getItem("shifrishan-locale") as Locale;
        if (storedLocale) setLocale(storedLocale);

        const storedPrimary = localStorage.getItem("shifrishan-color-primary");
        if (storedPrimary) setPrimaryColor(storedPrimary);
        const storedBg = localStorage.getItem("shifrishan-color-bg");
        if (storedBg) setBackgroundColor(storedBg);
        const storedText = localStorage.getItem("shifrishan-color-text");
        if (storedText) setTextColor(storedText);

    }, []);

    // Persist settings to localStorage whenever they change
    useEffect(() => { localStorage.setItem("shifrishan-auto-copy", JSON.stringify(autoCopy)); }, [autoCopy]);
    useEffect(() => { localStorage.setItem("shifrishan-locale", locale); }, [locale]);
    useEffect(() => { localStorage.setItem("shifrishan-color-primary", primaryColor); }, [primaryColor]);
    useEffect(() => { localStorage.setItem("shifrishan-color-bg", backgroundColor); }, [backgroundColor]);
    useEffect(() => { localStorage.setItem("shifrishan-color-text", textColor); }, [textColor]);

    // Apply theme colors and locale direction
    useEffect(() => {
        const root = document.documentElement;
        root.lang = locale;
        root.dir = locale === 'ar' ? 'rtl' : 'ltr';

        root.style.setProperty('--background', hexToHslString(backgroundColor));
        root.style.setProperty('--foreground', hexToHslString(textColor));
        root.style.setProperty('--primary', hexToHslString(primaryColor));
        // Simple foreground for primary color (e.g., button text)
        // This is a basic contrast check. A real implementation would be more complex.
        const primaryL = parseFloat(hexToHslString(primaryColor).split(' ')[2]);
        const primaryFg = primaryL > 50 ? '0 0% 3.9%' : '0 0% 98%';
        root.style.setProperty('--primary-foreground', primaryFg);

    }, [locale, primaryColor, backgroundColor, textColor]);


    const value = {
        primaryColor,
        setPrimaryColor,
        backgroundColor,
        setBackgroundColor,
        textColor,
        setTextColor,
        locale,
        setLocale,
        activeView,
        setActiveView,
        isPasswordEnabled,
        setIsPasswordEnabled,
        isVaultVisible,
        setIsVaultVisible,
        isVaultUnlocked,
        setIsVaultUnlocked,
        masterPassword,
        setMasterPassword,
        textToDecode,
        setTextToDecode,
        autoCopy,
        setAutoCopy,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
