import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Search, Smartphone, ArrowRight } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';
import type { UIStrings } from '../locales';
import LayeredScene, { SceneId } from '../components/illustrations/LayeredScene';

const ASSET_BASE = '/assets/services';

interface FeatureRowProps {
    index: string;
    titleKey: keyof UIStrings;
    bodyKey: keyof UIStrings;
    bulletKeys: [keyof UIStrings, keyof UIStrings, keyof UIStrings];
    sceneId: SceneId;
    altKey: keyof UIStrings;
    reversed: boolean;
}

const FeatureRow: React.FC<FeatureRowProps> = ({ index, titleKey, bodyKey, bulletKeys, sceneId, altKey, reversed }) => {
    const { t } = useLocale();
    const finalSlug: Record<SceneId, string> = {
        '01': 'verified-video-id',
        '02': 'multilingual-job-post',
        '03': 'messaging-route',
        '04': 'match-found',
        '05': 'fast-reach',
        '06': 'split-and-reach',
        '07': 'verification-ring',
        '08': 'trust-badges',
        '09': 'meeting-spark',
    };

    return (
        <div className={`flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 md:gap-12 items-center animate-fade-in-up`}>
            <div className="w-full md:w-[45%] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <LayeredScene
                    id={sceneId}
                    baseSrc={`${ASSET_BASE}/${sceneId}-base.webp`}
                    finalSrc={`${ASSET_BASE}/${sceneId}-${finalSlug[sceneId]}.webp`}
                    alt={t(altKey)}
                />
            </div>
            <div className="w-full md:flex-1">
                <span className="inline-grid place-items-center w-9 h-9 rounded-full border-2 border-slate-900 dark:border-slate-100 font-mono text-xs font-bold mb-4">
                    {index}
                </span>
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
                    {t(titleKey)}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
                    {t(bodyKey)}
                </p>
                <ul className="space-y-2.5">
                    {bulletKeys.map((key) => (
                        <li key={key} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                            <span className="mt-0.5 w-4 h-4 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex-shrink-0" />
                            {t(key)}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const ServicesPage: React.FC = () => {
    const { t } = useLocale();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 50% 10%, #06b6d4 0%, transparent 60%)' }}
            />

            <div className="max-w-5xl mx-auto space-y-16 sm:space-y-24 relative z-10">
                <div className="text-center space-y-4 animate-fade-in-up">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">
                        <Sparkles size={14} /> {t('services.eyebrow')}
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-semibold tracking-tighter leading-[1.05] max-w-3xl mx-auto">
                        {t('services.title')}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        {t('services.subtitle')}
                    </p>
                </div>

                {/* Section 01 — no generated illustration; simple icon card, matches site's existing feature-grid pattern. */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-sm animate-fade-in-up">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                            <Search size={22} className="text-white" />
                        </div>
                        <div>
                            <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{t('services.s1.num')}</span>
                            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mt-1 mb-3">
                                {t('services.s1.title')}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-5 leading-relaxed max-w-2xl">
                                {t('services.s1.body')}
                            </p>
                            <ul className="grid sm:grid-cols-3 gap-3">
                                {(['services.s1.bullet1', 'services.s1.bullet2', 'services.s1.bullet3'] as const).map((key) => (
                                    <li key={key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2">
                                        <Smartphone size={14} className="text-cyan-500 flex-shrink-0" />
                                        {t(key)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <FeatureRow
                    index="02"
                    titleKey="services.s2.title"
                    bodyKey="services.s2.body"
                    bulletKeys={['services.s2.bullet1', 'services.s2.bullet2', 'services.s2.bullet3']}
                    sceneId="01"
                    altKey="services.s2.alt"
                    reversed={false}
                />

                <FeatureRow
                    index="03"
                    titleKey="services.s3.title"
                    bodyKey="services.s3.body"
                    bulletKeys={['services.s3.bullet1', 'services.s3.bullet2', 'services.s3.bullet3']}
                    sceneId="02"
                    altKey="services.s3.alt"
                    reversed
                />

                <FeatureRow
                    index="04"
                    titleKey="services.s4.title"
                    bodyKey="services.s4.body"
                    bulletKeys={['services.s4.bullet1', 'services.s4.bullet2', 'services.s4.bullet3']}
                    sceneId="03"
                    altKey="services.s4.alt"
                    reversed={false}
                />

                <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white p-8 sm:p-12 text-center animate-fade-in-up">
                    <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">{t('services.cta.title')}</h3>
                    <p className="text-slate-300 mb-6 max-w-xl mx-auto">{t('services.cta.body')}</p>
                    <Link
                        to="/employer/dashboard"
                        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:opacity-90 transition-opacity"
                    >
                        {t('services.cta.button')} <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ServicesPage;
