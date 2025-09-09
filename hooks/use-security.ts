"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const SECURITY_SETTINGS_KEY = 'security-settings';

export interface SecuritySettings {
  isPasswordEnabled: boolean;
  password: string;
}

interface SecurityContextType {
  settings: SecuritySettings;
  setSettings: (settings: SecuritySettings) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<SecuritySettings>({
    isPasswordEnabled: false,
    password: '',
  });

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SECURITY_SETTINGS_KEY);
      if (storedSettings) {
        setSettingsState(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error("Error reading security settings from localStorage", error);
    }
  }, []);

  const setSettings = (newSettings: SecuritySettings) => {
    setSettingsState(newSettings);
    localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  return (
    <SecurityContext.Provider value={{ settings, setSettings }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
