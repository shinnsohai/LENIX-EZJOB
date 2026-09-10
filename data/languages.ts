// Common languages across the region's skilled-trades/work-permit workforce
// (Singapore/Malaysia construction, marine, and process sectors). Shared
// between EmployerDashboard's translations CSV export/import and the public
// job pages' locale switcher. Not exhaustive — Job.translations is a
// free-form jsonb map, this is just the curated starting set.
export const TRANSLATION_LANGUAGES: { code: string; label: string }[] = [
    { code: 'zh', label: 'Chinese (Mandarin)' },
    { code: 'bn', label: 'Bengali' },
    { code: 'ta', label: 'Tamil' },
    { code: 'ms', label: 'Malay' },
    { code: 'my', label: 'Myanmar (Burmese)' },
];

export const languageLabel = (code: string): string =>
    TRANSLATION_LANGUAGES.find(l => l.code === code)?.label ?? code;
