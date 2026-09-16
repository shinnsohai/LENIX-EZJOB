import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Star, Clock, Handshake } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';
import type { UIStrings } from '../locales';
import LayeredScene, { SceneId } from '../components/illustrations/LayeredScene';

const ASSET_BASE = '/assets/services';

const FINAL_SLUG: Record<SceneId, string> = {
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

interface CaseStudyProps {
    sceneId: SceneId;
    altKey: keyof UIStrings;
    titleKey: keyof UIStrings;
    problemKey: keyof UIStrings;
    solutionKey: keyof UIStrings;
    impactKey: keyof UIStrings;
    reversed: boolean;
}

const CaseStudy: React.FC<CaseStudyProps> = ({ sceneId, altKey, titleKey, problemKey, solutionKey, impactKey, reversed }) => {
    const { t } = useLocale();
    return (
        <div className={`flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 md:gap-12 items-center animate-fade-in-up`}>
            <div className="w-full md:w-[45%] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <LayeredScene
                    id={sceneId}
                    baseSrc={sceneId === '05' ? undefined : `${ASSET_BASE}/${sceneId}-base.webp`}
                    finalSrc={`${ASSET_BASE}/${sceneId}-${FINAL_SLUG[sceneId]}.webp`}
                    alt={t(altKey)}
                />
            </div>
            <div className="w-full md:flex-1">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-full px-2.5 py-1 mb-3">
                    {t('solutions.illustrativeTag')}
                </span>
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
                    {t(titleKey)}
                </h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-[5.5rem_1fr] gap-3 text-sm">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-0.5">{t('solutions.problemLabel')}</span>
                        <span className="text-slate-600 dark:text-slate-400">{t(problemKey)}</span>
                    </div>
                    <div className="grid grid-cols-[5.5rem_1fr] gap-3 text-sm">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-0.5">{t('solutions.solutionLabel')}</span>
                        <span className="text-slate-600 dark:text-slate-400">{t(solutionKey)}</span>
                    </div>
                    <div className="grid grid-cols-[5.5rem_1fr] gap-3 text-sm">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 pt-0.5">{t('solutions.impactLabel')}</span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium">{t(impactKey)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TRUST_ICONS = [ShieldCheck, Star, Clock, Handshake];

const SolutionsPage: React.FC = () => {
    const { t } = useLocale();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 50% 10%, #3b82f6 0%, transparent 60%)' }}
            />

            <div className="max-w-5xl mx-auto space-y-16 sm:space-y-24 relative z-10">
                <div className="text-center space-y-4 animate-fade-in-up">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">
                        <Sparkles size={14} /> {t('solutions.eyebrow')}
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-semibold tracking-tighter leading-[1.05] max-w-3xl mx-auto">
                        {t('solutions.title')}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        {t('solutions.subtitle')}
                    </p>
                </div>

                {/* Hero — the one deliberately load-triggered scene, greets the page already settling. */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm max-w-2xl mx-auto animate-fade-in-up">
                    <LayeredScene id="04" baseSrc={`${ASSET_BASE}/04-base.webp`} finalSrc={`${ASSET_BASE}/04-match-found.webp`} alt={t('solutions.hero.alt')} trigger="load" />
                </div>

                <div className="space-y-16 sm:space-y-20">
                    <CaseStudy
                        sceneId="05"
                        altKey="solutions.case1.alt"
                        titleKey="solutions.case1.title"
                        problemKey="solutions.case1.problem"
                        solutionKey="solutions.case1.solution"
                        impactKey="solutions.case1.impact"
                        reversed={false}
                    />
                    <CaseStudy
                        sceneId="06"
                        altKey="solutions.case2.alt"
                        titleKey="solutions.case2.title"
                        problemKey="solutions.case2.problem"
                        solutionKey="solutions.case2.solution"
                        impactKey="solutions.case2.impact"
                        reversed
                    />
                    <CaseStudy
                        sceneId="07"
                        altKey="solutions.case3.alt"
                        titleKey="solutions.case3.title"
                        problemKey="solutions.case3.problem"
                        solutionKey="solutions.case3.solution"
                        impactKey="solutions.case3.impact"
                        reversed={false}
                    />
                </div>

                {/* Trust strip */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-sm animate-fade-in-up">
                    <div className="flex flex-col md:flex-row gap-8 md:items-center">
                        <div className="w-full md:w-[38%] rounded-xl overflow-hidden">
                            <LayeredScene id="08" baseSrc={`${ASSET_BASE}/08-base.webp`} finalSrc={`${ASSET_BASE}/08-trust-badges.webp`} alt={t('solutions.trust.alt')} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                                {t('solutions.trust.title')}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-5">{t('solutions.trust.body')}</p>
                            <div className="grid grid-cols-2 gap-3">
                                {([
                                    'solutions.trust.badge1',
                                    'solutions.trust.badge2',
                                    'solutions.trust.badge3',
                                    'solutions.trust.badge4',
                                ] as const).map((key, i) => {
                                    const Icon = TRUST_ICONS[i];
                                    return (
                                        <div key={key} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2.5">
                                            <Icon size={16} className="text-cyan-500 flex-shrink-0" />
                                            {t(key)}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final CTA — the one signature moment reserved for the very end. */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white overflow-hidden animate-fade-in-up">
                    <div className="max-w-xs mx-auto pt-8">
                        <div className="rounded-xl overflow-hidden shadow-lg">
                            <LayeredScene id="09" baseSrc={`${ASSET_BASE}/09-base.webp`} finalSrc={`${ASSET_BASE}/09-meeting-spark.webp`} alt={t('solutions.finalImage.alt')} />
                        </div>
                    </div>
                    <div className="p-8 sm:p-12 text-center">
                        <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">{t('solutions.cta.title')}</h3>
                        <p className="text-slate-300 mb-6 max-w-xl mx-auto">{t('solutions.cta.body')}</p>
                        <Link
                            to="/employer/dashboard"
                            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:opacity-90 transition-opacity"
                        >
                            {t('solutions.cta.button')} <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolutionsPage;
