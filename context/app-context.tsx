"use client";

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { View } from '@/components/sidebar';
import { EncryptionType } from '@/app/encoding';

export type Locale = 'ar' | 'en';

interface AppContextType {
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

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [locale, setLocale] = useState<Locale>('ar');
    const [activeView, setActiveView] = useState<View>('encoder-decoder');
    const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
    const [isVaultVisible, setIsVaultVisible] = useState(false);
    const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
    const [masterPassword, setMasterPassword] = useState<string | null>(null);
    const [textToDecode, setTextToDecode] = useState<string | null>(null);
    const [autoCopy, setAutoCopy] = useState(true); // Default to true

    // Load settings from localStorage on initial mount
    useEffect(() => {
        const storedAutoCopy = localStorage.getItem("shifrishan-auto-copy");
        if (storedAutoCopy !== null) setAutoCopy(JSON.parse(storedAutoCopy));

        const storedLocale = localStorage.getItem("shifrishan-locale") as Locale;
        if (storedLocale) setLocale(storedLocale);
    }, []);

    // Persist settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("shifrishan-auto-copy", JSON.stringify(autoCopy));
    }, [autoCopy]);

    useEffect(() => {
        localStorage.setItem("shifrishan-locale", locale);
        document.documentElement.lang = locale;
        document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }, [locale]);

    const value = {
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
