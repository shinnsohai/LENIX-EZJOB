import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Briefcase, ArrowRight } from 'lucide-react';
import { getCompanyDirectory, type CompanyDirectoryEntry } from '../services/db';
import { useLocale } from '../contexts/LocaleContext';
import Spinner from '../components/Spinner';

// Same deterministic brand-hue avatar as the Find Jobs cards, for
// companies without an uploaded logo.
const AVATAR_STYLES = ['bg-cyan-500', 'bg-blue-500', 'bg-fuchsia-500', 'bg-orange-500'];
const avatarStyle = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return AVATAR_STYLES[hash % AVATAR_STYLES.length];
};

const companyPath = (entry: CompanyDirectoryEntry) =>
    entry.slug ? `/company/${entry.slug}` : `/employer/profile/${entry.profile.user_id}`;

/** Public directory of every active company on EZJOB, hiring ones first. */
const CompaniesPage: React.FC = () => {
    const { t } = useLocale();
    const [companies, setCompanies] = useState<CompanyDirectoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        getCompanyDirectory()
            .then(setCompanies)
            .catch(err => {
                console.error('Failed to load companies:', err);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, []);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return companies
            .filter(c => !term
                || c.profile.company_name.toLowerCase().includes(term)
                || (c.profile.industry ?? '').toLowerCase().includes(term))
            .sort((a, b) => b.openRoles - a.openRoles || a.profile.company_name.localeCompare(b.profile.company_name));
    }, [companies, search]);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t('companies.heading')}</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('companies.subheading')}</p>
                    <div className="relative mt-5">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('companies.searchPlaceholder')}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 text-sm placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
                ) : error ? (
                    <p className="py-20 text-center text-slate-500 dark:text-slate-400">Couldn't load companies. Please refresh to try again.</p>
                ) : (
                    <>
                        <p className="mb-5 px-1 text-sm text-slate-600 dark:text-slate-400">{t('companies.count', { count: visible.length })}</p>
                        {visible.length === 0 ? (
                            <p className="py-16 text-center text-slate-500 dark:text-slate-400">{t('companies.empty')}</p>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {visible.map(entry => {
                                    const { profile } = entry;
                                    const blurb = entry.tagline || profile.description;
                                    return (
                                        <Link
                                            key={profile.user_id}
                                            to={companyPath(entry)}
                                            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-700"
                                        >
                                            <div className="flex items-center gap-4">
                                                {profile.company_logo_url ? (
                                                    <img src={profile.company_logo_url} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1 dark:border-slate-700" />
                                                ) : (
                                                    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white ${avatarStyle(profile.company_name)}`}>
                                                        {profile.company_name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                                <div className="min-w-0">
                                                    <h2 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900 group-hover:text-cyan-700 dark:text-white dark:group-hover:text-cyan-400">{profile.company_name}</h2>
                                                    {profile.industry && <p className="truncate text-sm text-slate-500 dark:text-slate-400">{profile.industry}</p>}
                                                </div>
                                            </div>
                                            {blurb && <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{blurb}</p>}
                                            <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${entry.openRoles > 0
                                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
                                                >
                                                    <Briefcase size={13} />
                                                    {entry.openRoles > 0 ? t('companies.openRoles', { count: entry.openRoles }) : t('companies.noOpenRoles')}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 dark:text-cyan-400">
                                                    {t('companies.viewCompany')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CompaniesPage;
