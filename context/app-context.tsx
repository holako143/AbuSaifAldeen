"use client";

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [activeView, setActiveView] = useState<View>('encoder-decoder');
    const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
    const [encryptionType, setEncryptionType] = useState<EncryptionType>('simple');
    const [isVaultVisible, setIsVaultVisible] = useState(false);
    const [textToDecode, setTextToDecode] = useState<string | null>(null);

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
