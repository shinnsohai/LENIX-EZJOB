import en from './en';
import zh from './zh';
import bn from './bn';
import ta from './ta';
import ms from './ms';
import my from './my';

/** Every locale file must provide exactly these keys — `en` is authoritative. */
export type UIStrings = Record<keyof typeof en, string>;

export interface LocaleOption {
    code: string;
    label: string;
    strings: UIStrings;
}

/**
 * Same language set as data/languages.ts (job-content translations), plus
 * English as the base/default. Kept as a separate list rather than reusing
 * TRANSLATION_LANGUAGES directly: job-content translations are optional
 * per-job data filled in by the employer, while these are the app's own
 * shipped UI strings — a language only belongs here once someone has
 * actually written (and ideally reviewed) the dictionary for it.
 */
export const SUPPORTED_LOCALES: LocaleOption[] = [
    { code: 'en', label: 'English', strings: en },
    { code: 'zh', label: '中文', strings: zh },
    { code: 'bn', label: 'বাংলা', strings: bn },
    { code: 'ta', label: 'தமிழ்', strings: ta },
    { code: 'ms', label: 'Bahasa Melayu', strings: ms },
    { code: 'my', label: 'မြန်မာ', strings: my },
];

export const DEFAULT_LOCALE = 'en';
