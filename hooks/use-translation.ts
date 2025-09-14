import { useState, useEffect } from 'react';
import { useAppContext } from '@/components/app-provider';
import ar from '@/locales/ar.json';
import en from '@/locales/en.json';

const translations = { ar, en };

// Helper function to get a nested value from an object
function getNestedValue(obj: any, key: string): string | undefined {
    return key.split('.').reduce((acc, part) => acc && acc[part], obj);
}

const createTranslator = (locale: 'ar' | 'en') => {
    return (key: string, options?: Record<string, string | number>): string => {
        const languageJson = translations[locale] || translations.en;
        let translation = getNestedValue(languageJson, key);

        if (!translation) {
            console.warn(`Translation not found for key: ${key} in locale: ${locale}`);
            const fallbackJson = translations.en;
            translation = getNestedValue(fallbackJson, key);
            if (!translation) {
                return key;
            }
        }

        if (options) {
            Object.keys(options).forEach(optionKey => {
                translation = translation!.replace(`{${optionKey}}`, String(options[optionKey]));
            });
        }

        return translation!;
    };
};

export function useTranslation() {
    const { locale } = useAppContext();

    // The translator function is now derived directly from the locale.
    // This avoids the useEffect and useState, simplifying the hook and removing timing issues.
    const t = createTranslator(locale);

    return { t, locale };
}
