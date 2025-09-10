import { useState, useEffect, useCallback } from 'react';

const SECURITY_SETTINGS_KEY = 'security-settings';

export interface SecuritySettings {
  isPasswordEnabled: boolean;
  password: string;
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

  const updateSettings = useCallback((newSettings: Partial<SecuritySettings>) => {
    setSettings(prevSettings => {
      const updated = { ...prevSettings, ...newSettings };
      localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { settings, updateSettings };
}
