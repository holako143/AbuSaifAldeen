"use client";

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { View } from '@/components/sidebar';
import { EncryptionType } from '@/app/encoding';

interface AppContextType {
    // View Management
    activeView: View;
    setActiveView: Dispatch<SetStateAction<View>>;

    // Security Management
    isPasswordEnabled: boolean;
    setIsPasswordEnabled: Dispatch<SetStateAction<boolean>>;
    encryptionType: EncryptionType;
    setEncryptionType: Dispatch<SetStateAction<EncryptionType>>;

    // Vault Management
    isVaultVisible: boolean;
    setIsVaultVisible: Dispatch<SetStateAction<boolean>>;

    // Data passing
    textToDecode: string | null;
    setTextToDecode: Dispatch<SetStateAction<string | null>>;

    // Settings
    autoCopy: boolean;
    setAutoCopy: Dispatch<SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [activeView, setActiveView] = useState<View>('encoder-decoder');
    const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
    const [encryptionType, setEncryptionType] = useState<EncryptionType>('simple');
    const [isVaultVisible, setIsVaultVisible] = useState(false);
    const [textToDecode, setTextToDecode] = useState<string | null>(null);
    const [autoCopy, setAutoCopy] = useState(true); // Default to true

    // Load settings from localStorage on initial mount
    useEffect(() => {
        const storedEncType = localStorage.getItem("shifrishan-encryption-type") as EncryptionType;
        if (storedEncType) setEncryptionType(storedEncType);

        const storedAutoCopy = localStorage.getItem("shifrishan-auto-copy");
        // Only set from storage if a value actually exists, otherwise keep the default
        if (storedAutoCopy !== null) {
            setAutoCopy(JSON.parse(storedAutoCopy));
        }
    }, []);

    // Persist auto-copy setting to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("shifrishan-auto-copy", JSON.stringify(autoCopy));
    }, [autoCopy]);

    const value = {
        activeView,
        setActiveView,
        isPasswordEnabled,
        setIsPasswordEnabled,
        encryptionType,
        setEncryptionType,
        isVaultVisible,
        setIsVaultVisible,
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
