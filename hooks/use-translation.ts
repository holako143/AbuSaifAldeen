import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/app-context';
import ar from '@/locales/ar.json';
import en from '@/locales/en.json';

const translations = { ar, en };

// Helper function to get a nested value from an object
function getNestedValue(obj: any, key: string): string | undefined {
    return key.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export function useTranslation() {
    const { locale } = useAppContext();
    const [t, setT] = useState<(key: string, options?: Record<string, string | number>) => string>(() => () => '');

    useEffect(() => {
        const translate = (key: string, options?: Record<string, string | number>): string => {
            const languageJson = translations[locale] || translations.en;
            let translation = getNestedValue(languageJson, key);

            if (!translation) {
                console.warn(`Translation not found for key: ${key} in locale: ${locale}`);
                // Fallback to English
                const fallbackJson = translations.en;
                translation = getNestedValue(fallbackJson, key);
                if (!translation) {
                    return key; // Return the key itself if not found in English either
                }
            }

            if (options) {
                Object.keys(options).forEach(optionKey => {
                    translation = translation!.replace(`{${optionKey}}`, String(options[optionKey]));
                });
            }

            return translation!;
        };

        setT(() => translate);

    }, [locale]);

    return { t, locale };
}
