import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { useShouldPlayHeroVideo } from '../../hooks/useShouldPlayHeroVideo';

const DEFAULT_HERO_VIDEO = '/assets/hero/promo-loop.mp4';
const DEFAULT_HERO_POSTER = '/assets/hero/promo-poster.jpg';

/** The company name inside an animated, glowing box: a soft pulsing glow
 * around the border plus a highlight that sweeps across it. Both loops are
 * dropped under prefers-reduced-motion (the box itself still renders). */
const GlowingCompanyBox: React.FC<{ name: string }> = ({ name }) => {
    const reduceMotion = useReducedMotion();
    return (
        <motion.span
            className="relative mt-2 inline-block max-w-full overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-50 via-white to-blue-50 px-4 py-1 align-top dark:border-cyan-500/40 dark:from-cyan-950/60 dark:via-slate-900 dark:to-blue-950/60"
            animate={reduceMotion ? undefined : {
                boxShadow: [
                    '0 0 0px rgba(6,182,212,0.0)',
                    '0 0 28px rgba(6,182,212,0.35)',
                    '0 0 0px rgba(6,182,212,0.0)',
                ],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
            {!reduceMotion && (
                <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-cyan-300/20"
                    initial={{ x: '-120%' }}
                    animate={{ x: '260%' }}
                    transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
                />
            )}
            <span className="relative text-gradient-cyan-blue">{name}</span>
        </motion.span>
    );
};

interface CompanyHeroProps {
    companyName: string;
    logoUrl?: string;
    videoUrl?: string;
    onViewCompany: () => void;
    onOpenRoles: () => void;
    onAbout: () => void;
    onJoinTeam: () => void;
}

const CompanyHero: React.FC<CompanyHeroProps> = ({ companyName, logoUrl, videoUrl, onViewCompany, onOpenRoles, onAbout, onJoinTeam }) => {
    const shouldPlayVideo = useShouldPlayHeroVideo();
    const reduceMotion = useReducedMotion();
    const enter = reduceMotion ? undefined : { opacity: 0, y: 16 };

    // Fixed 600px from md up; on phones a long company name wraps to more
    // lines, so the hero may grow rather than slide the button under the
    // floating navbar (the content's pb-32 reserves its space).
    return (
        <section className="relative w-full max-w-[1400px] mx-auto rounded-[48px] bg-white border border-slate-200/50 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] overflow-hidden min-h-[600px] md:h-[600px] flex flex-col dark:bg-slate-900 dark:border-slate-800">
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
                {shouldPlayVideo ? (
                    <video
                        className="h-full w-full object-cover"
                        src={videoUrl || DEFAULT_HERO_VIDEO}
                        poster={videoUrl ? undefined : DEFAULT_HERO_POSTER}
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                ) : (
                    !videoUrl && <img src={DEFAULT_HERO_POSTER} alt="" className="h-full w-full object-cover" />
                )}
                {/* Keeps the headline side legible over any footage. */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/40 md:bg-gradient-to-r md:from-white md:via-white/85 md:to-white/20 dark:from-slate-900 dark:via-slate-900/85 dark:to-slate-900/40 md:dark:from-slate-900 md:dark:via-slate-900/85 md:dark:to-slate-900/20" />
            </div>

            <div className="relative z-20 flex-1 px-8 md:px-16 pt-12 md:pt-16 pb-32 flex flex-col items-start">
                <motion.div
                    initial={enter}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-3xl"
                >
                    <h1 className="font-display text-[42px] md:text-[56px] font-medium tracking-tight leading-[1.05] text-[#0a1b33] dark:text-white">
                        Empowering the workforce at{' '}
                        <GlowingCompanyBox name={companyName} />
                    </h1>
                    <p className="mt-5 max-w-md font-sans text-[14px] md:text-[15px] leading-relaxed text-[#64748b] dark:text-slate-400">
                        Connecting skilled talents, powering operations, and building the foundation of industry across Asia.
                    </p>
                    <motion.button
                        type="button"
                        onClick={onViewCompany}
                        whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        className="mt-8 rounded-full bg-[#0a152d] px-6 py-3 text-[13px] font-semibold text-white shadow-md dark:bg-white dark:text-[#0a152d]"
                    >
                        View Company
                    </motion.button>
                </motion.div>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
                <motion.nav
                    aria-label="Company page sections"
                    initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center whitespace-nowrap bg-white/90 backdrop-blur-2xl px-1.5 py-1.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-slate-200/40 dark:bg-slate-800/90 dark:border-slate-700/60"
                >
                    <span className="flex w-9 h-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white border border-slate-100 shadow-sm text-[#0a1b33] dark:border-slate-700">
                        {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full bg-white object-contain p-0.5" /> : '✦'}
                    </span>
                    <button type="button" onClick={onOpenRoles} className="px-3 sm:px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-[#0a1b33] transition-colors dark:text-slate-400 dark:hover:text-white">
                        Open Roles
                    </button>
                    <button type="button" onClick={onAbout} className="px-3 sm:px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-[#0a1b33] transition-colors dark:text-slate-400 dark:hover:text-white">
                        About Us
                    </button>
                    <button
                        type="button"
                        onClick={onJoinTeam}
                        className="flex items-center gap-1 bg-white px-4 sm:px-5 py-2 rounded-full text-[12px] font-semibold text-[#0a1b33] border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all dark:bg-slate-900 dark:text-white dark:border-slate-700"
                    >
                        Join Team <ChevronRight size={14} />
                    </button>
                </motion.nav>
            </div>
        </section>
    );
};

export default CompanyHero;
