import React from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';
import { SUPPORTED_LOCALES } from '../locales';

/** Header-chrome language switcher. Styled to sit next to the theme toggle
 * button (same pill/border treatment) rather than as a full menu, since it's
 * one native <select> — keyboard- and screen-reader-accessible for free. */
const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { locale, setLocale, t } = useLocale();

    return (
        <div
            className={`flex items-center gap-1.5 px-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm ${className}`}
        >
            <Languages size={16} className="text-slate-700 dark:text-cyan-400 flex-shrink-0" aria-hidden="true" />
            <label htmlFor="app-language" className="sr-only">{t('header.language')}</label>
            <select
                id="app-language"
                value={locale}
                onChange={e => setLocale(e.target.value)}
                aria-label={t('header.language')}
                className="bg-transparent text-slate-700 dark:text-slate-200 text-xs font-mono py-2.5 focus:outline-none cursor-pointer"
            >
                {SUPPORTED_LOCALES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSwitcher;
