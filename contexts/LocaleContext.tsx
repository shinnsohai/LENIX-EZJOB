import React, { createContext, useContext, useState, useMemo } from 'react';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, UIStrings } from '../locales';

interface LocaleContextType {
    locale: string;
    setLocale: (code: string) => void;
    /** Looks up `key` in the active locale, falling back to English so a
     * missing/unreviewed string never renders blank. */
    t: (key: keyof UIStrings) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const STORAGE_KEY = 'lenix_locale';

const isSupported = (code: string | null): code is string =>
    !!code && SUPPORTED_LOCALES.some(l => l.code === code);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<string>(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        return isSupported(stored) ? stored : DEFAULT_LOCALE;
    });

    const setLocale = (code: string) => {
        if (!isSupported(code)) return;
        setLocaleState(code);
        try {
            localStorage.setItem(STORAGE_KEY, code);
        } catch {
            // Private browsing / storage disabled — locale still applies for
            // this session, it just won't persist across reloads.
        }
    };

    const strings = useMemo(
        () => SUPPORTED_LOCALES.find(l => l.code === locale)?.strings ?? SUPPORTED_LOCALES[0].strings,
        [locale]
    );
    const englishStrings = SUPPORTED_LOCALES[0].strings;

    const t = (key: keyof UIStrings): string => strings[key] ?? englishStrings[key] ?? String(key);

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LocaleContext.Provider>
    );
};

export const useLocale = (): LocaleContextType => {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return context;
};
