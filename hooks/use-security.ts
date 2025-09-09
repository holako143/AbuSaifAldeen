import { useState, useEffect } from 'react';

const SECURITY_SETTINGS_KEY = 'security-settings';

export interface SecuritySettings {
  isPasswordEnabled: boolean;
  password: string; // In a real app, this should be a hash or derived key.
}

export function useSecurity() {
  const [settings, setSettings] = useState<SecuritySettings>({
    isPasswordEnabled: false,
    password: '',
  });

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SECURITY_SETTINGS_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error("Error reading security settings from localStorage", error);
    }
  }, []);

  const updateSettings = (newSettings: Partial<SecuritySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(updated));
  };

  return { settings, updateSettings };
}
