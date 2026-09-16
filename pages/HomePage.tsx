import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteContent } from '../contexts/SiteContentContext';
import { useLocale } from '../contexts/LocaleContext';
import { UserRole } from '../types';
import { generateJobWithAI } from '../services/geminiService';
import {
    Zap,
    ArrowRight,
    PlusCircle,
    Sparkles,
    Bot,
    ShieldCheck,
    Shield,
    Globe,
    FileDown,
    Check,
    X,
    Plus,
    Minus,
    IdCard,
    Video,
    UserPlus,
    Search,
    Eye,
    Gem,
    ArrowDown,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Motion helpers (CSS-only, no animation library per project constraints).
// A small IntersectionObserver hook drives scroll-reveal; it resolves
// instantly (no animated transition) for prefers-reduced-motion so users who
// asked for less motion never see the reveal happen.
// ---------------------------------------------------------------------------
function useInView<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState<boolean>(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        if (inView || !ref.current) return;
        const node = ref.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        observer.observe(node);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { ref, inView };
}

/** Fade-and-rise reveal wrapper, with a variant anchor so entrances aren't
 * identical across every section (`up` is the original, unchanged default).
 * Communicates hierarchy by sequencing content into view as the user
 * scrolls; degrades to static under reduced motion. Transform + opacity
 * only, never width/height/top/left. */
const Reveal: React.FC<{
    children: React.ReactNode;
    className?: string;
    delayMs?: number;
    from?: 'up' | 'left' | 'right' | 'scale';
    style?: React.CSSProperties;
}> = ({ children, className = '', delayMs = 0, from = 'up', style }) => {
    const { ref, inView } = useInView<HTMLDivElement>();
    const hidden = {
        up: 'opacity-0 translate-y-6',
        left: 'opacity-0 -translate-x-8',
        right: 'opacity-0 translate-x-8',
        scale: 'opacity-0 scale-95',
    }[from];
    return (
        <div
            ref={ref}
            // Scoped to opacity/transform only (never `transition-all`) so any
            // other scroll-linked inline style a caller passes in `style`
            // (border color, shadow, etc.) writes instantly per frame instead
            // of being dragged through this element's own 700ms easing.
            className={`transition-[opacity,transform] duration-700 ease-out ${
                inView ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : hidden
            } ${className}`}
            style={{ transitionDelay: inView ? `${delayMs}ms` : '0ms', ...style }}
        >
            {children}
        </div>
    );
};

/** Wipes a large element in via clip-path rather than fading it — "a wipe is
 * a change of state", reserved for one full-width element per use, not
 * scattered across small ones. Settles fully open under reduced motion.
 * Driven off scroll progress (defined below) rather than
 * IntersectionObserver: a full-width panel stuck permanently clipped shut
 * is a much worse failure than a fade that's a beat late, so this avoids
 * IO's async, compositor-tied callback timing entirely. Latches open once
 * crossed and never re-clips on scrolling back up. */
const WipeReveal: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
    const { ref, progress } = useScrollProgress<HTMLDivElement>(1);
    const [revealed, setRevealed] = useState(false);
    useEffect(() => {
        if (progress > 0.05 && !revealed) setRevealed(true);
    }, [progress, revealed]);
    return (
        <div
            ref={ref}
            className={`transition-[clip-path] duration-[900ms] ease-out ${className}`}
            style={{ clipPath: revealed ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)' }}
        >
            {children}
        </div>
    );
};

/** 0..1 progress of an element's traversal through the viewport (0 = top
 * edge at the viewport's bottom, 1 = bottom edge at the viewport's top),
 * rAF-throttled off a passive scroll listener. Drives continuous
 * scroll-linked effects (depth, intensity) as an alternative to the binary
 * in/out of useInView. Settles at a fixed neutral value under reduced
 * motion so dependent transforms resolve to their rest position instead of
 * animating. */
function useScrollProgress<T extends HTMLElement>(neutral = 0.5) {
    const ref = useRef<T | null>(null);
    const [progress, setProgress] = useState(neutral);

    useEffect(() => {
        const reduced =
            typeof window !== 'undefined' && window.matchMedia
                ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
                : false;
        if (reduced || !ref.current) return;

        const node = ref.current;
        let raf = 0;
        const measure = () => {
            raf = 0;
            const rect = node.getBoundingClientRect();
            const vh = window.innerHeight || 1;
            const total = rect.height + vh;
            const traveled = vh - rect.top;
            setProgress(Math.min(1, Math.max(0, traveled / total)));
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(measure);
        };

        measure();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    return { ref, progress };
}

/** Raw page scrollY, rAF-throttled and capped to `cap` px so a parallax
 * layer's travel stays bounded regardless of total scroll distance. Reads 0
 * (no motion, correct resting composition) under reduced motion. */
function useScrollY(cap = 400) {
    const [y, setY] = useState(0);
    useEffect(() => {
        const reduced =
            typeof window !== 'undefined' && window.matchMedia
                ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
                : false;
        if (reduced) return;
        let raf = 0;
        const measure = () => {
            raf = 0;
            setY(Math.min(cap, window.scrollY));
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(measure);
        };
        measure();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [cap]);
    return y;
}

/** Ticks a displayed number from 0 to `target` once, starting when `active`
 * flips true (paired with useInView). Cubic ease-out over ~1.5s, matching
 * the "numbers that land" pattern: most of the distance covered early, the
 * last digits settling slowly. Reduced motion writes the final value with
 * no animation. */
function useCountUp(target: number, active: boolean, durationMs = 1500) {
    const [value, setValue] = useState(0);
    const startedRef = useRef(false);

    useEffect(() => {
        if (!active || startedRef.current) return;
        startedRef.current = true;

        const reduced =
            typeof window !== 'undefined' && window.matchMedia
                ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
                : false;
        if (reduced) {
            setValue(target);
            return;
        }

        const start = performance.now();
        let raf = 0;
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(target * eased));
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [active, target, durationMs]);

    return value;
}

/** A stat that ticks up once it scrolls into view instead of sitting there
 * static. `suffix` (k+, %, h) renders untouched — only the numeric part
 * counts. */
const StatCounter: React.FC<{ target: number; suffix: string; active: boolean; className?: string }> = ({
    target,
    suffix,
    active,
    className = '',
}) => {
    const value = useCountUp(target, active);
    return (
        <span className={className}>
            {value}
            {suffix}
        </span>
    );
};

/** Strips a leading hyphen/en-dash/em-dash (and any surrounding whitespace) that legacy attribution strings may carry, so nothing in this file ever renders a dash as a design flourish. */
const stripLeadingDash = (text: string) => text.replace(/^[\s–—-]+/, '');

const CREW_PHOTO_COUNT = 12;
const CREW_PHOTOS = Array.from(
    { length: CREW_PHOTO_COUNT },
    (_, i) => `/assets/crew/worker-${String(i + 1).padStart(2, '0')}.webp`
);

/** Twelve verified crew members standing in a row over a background photo
 * whose edges fade into the hero's own background (a radial mask, not a
 * hard-edged box) rather than a boxed-off strip. Hovering one crew member
 * brings them forward at full clarity while every other member fades back
 * — plain React hover state per figure, not CSS :has(): tried the pure-CSS
 * version first, but this environment's Chromium build matches :has() via
 * `.matches()` without actually invalidating computed style for it (a real,
 * known class of bug in early :has() implementations), so the fade silently
 * never painted. Per-image onMouseEnter/onMouseLeave has no such ambiguity. */
const CrewLineup = () => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="relative h-64 sm:h-72 lg:h-80">
            {/* Background photo, faded at every edge via a radial mask so it
                dissolves into the hero section instead of reading as a
                separate dark box. */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url(/assets/crew/lineup-bg.webp)',
                    WebkitMaskImage: 'radial-gradient(ellipse 70% 75% at 50% 50%, black 50%, transparent 100%)',
                    maskImage: 'radial-gradient(ellipse 70% 75% at 50% 50%, black 50%, transparent 100%)',
                }}
                aria-hidden="true"
            />
            {/* Gentle dark gradient so the crew cutouts stay legible standing
                on the photo, strongest low where their boots meet the ground. */}
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0.1) 45%, transparent 70%)' }}
                aria-hidden="true"
            />

            <div
                className="absolute inset-0 flex items-end overflow-x-auto sm:overflow-visible"
                role="img"
                aria-label="Photos of EZJOB's verified skilled trades workforce"
                onMouseLeave={() => setHoveredIndex(null)}
            >
                {CREW_PHOTOS.map((src, i) => {
                    const isHovered = hoveredIndex === i;
                    const isDimmed = hoveredIndex !== null && !isHovered;
                    return (
                        <img
                            key={i}
                            src={src}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            draggable={false}
                            onMouseEnter={() => setHoveredIndex(i)}
                            className={`flex-none w-20 sm:w-auto sm:flex-1 sm:min-w-0 h-[92%] object-contain object-bottom select-none transition-[opacity,filter,transform] duration-300 ease-out ${
                                isDimmed ? 'opacity-40 grayscale' : 'opacity-100'
                            } ${isHovered ? 'relative z-10 motion-safe:scale-110 motion-safe:-translate-y-2' : ''}`}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const HeroSection = () => {
    const navigate = useNavigate();
    const { t } = useLocale();
    const { homepageContent } = useSiteContent();
    const { ref: statsRef, inView: statsInView } = useInView<HTMLDivElement>();
    // Two-plane depth: the ambient wallpaper is the back plane (moves against
    // scroll direction, slower), the photo is the front plane (moves with
    // scroll, slightly faster). Copy and CTAs ride at 1x — untouched — so
    // nothing the visitor is reading ever moves relative to itself. Capped at
    // a few dozen px, per parallax's "subtle or nothing" ceiling.
    const scrollY = useScrollY(320);
    const backOffset = -scrollY * 0.09;
    const frontOffset = scrollY * 0.06;

    return (
        <section className="relative w-full pt-16 sm:pt-20 pb-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
            {/* Ambient brand-gradient wallpaper. Decorative background only, not a
                functional accent, so it keeps the site's established tri-color
                brand identity (see .text-gradient-lenix in index.css) while every
                interactive element below stays locked to a single cyan accent.
                Back parallax plane: no transition on transform (a direct
                per-frame write, eased transitions lag behind the scroll). */}
            <div
                className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-20"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 80% -20%, #3b82f6 0%, transparent 45%), radial-gradient(circle at 20% 120%, #d946ef 0%, transparent 45%), radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 60%)',
                    transform: `translate3d(0, ${backOffset}px, 0)`,
                }}
            />

            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10 items-center">
                <div className="lg:col-span-7 flex flex-col gap-6 text-left">
                    {/* Eyebrow badge (1 of 3 allowed on this page) */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-cyan-500/30 rounded-full w-fit shadow-sm">
                        <Zap size={16} className="text-cyan-600 dark:text-cyan-400" />
                        <span className="font-mono text-xs uppercase tracking-widest text-cyan-700 dark:text-cyan-300 font-semibold">
                            {t('homepage.badge')}
                        </span>
                    </div>

                    {/* Headline: 2 lines max, single locked accent for the emphasis word */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-slate-900 dark:text-white max-w-2xl">
                        {t('homepage.heroHeadlinePrefix')} <span className="text-gradient-cyan-blue">{t('homepage.heroHeadlineAccent')}</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
                        {homepageContent.hero.subheadline || t('homepage.heroSubheadlineFallback')}
                    </p>

                    {/* CTAs: one primary (browse), one secondary (post a role) */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <button
                            onClick={() => navigate('/jobs')}
                            className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs uppercase tracking-wider px-8 py-4 rounded-full font-bold shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center gap-2 group cursor-pointer active:scale-[0.98]"
                        >
                            {t('homepage.findOpportunities')}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/register', { state: { role: UserRole.EMPLOYER } })}
                            className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 hover:border-cyan-400/60 font-mono text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                        >
                            <PlusCircle size={18} className="text-cyan-600 dark:text-cyan-400" />
                            {t('homepage.postARole')}
                        </button>
                    </div>

                    {/* Quick stats: tick up once, the first time they're on screen */}
                    <div ref={statsRef} className="grid grid-cols-3 gap-6 pt-8 mt-2 border-t border-slate-200 dark:border-slate-800/90">
                        <div>
                            <StatCounter
                                target={12}
                                suffix="k+"
                                active={statsInView}
                                className="block text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums"
                            />
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {t('homepage.statActiveProjects')}
                            </span>
                        </div>
                        <div>
                            <StatCounter
                                target={98}
                                suffix="%"
                                active={statsInView}
                                className="block text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400 tabular-nums"
                            />
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {t('homepage.statMatchRate')}
                            </span>
                        </div>
                        <div>
                            <StatCounter
                                target={24}
                                suffix="h"
                                active={statsInView}
                                className="block text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400 tabular-nums"
                            />
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {t('homepage.statAvgPlacement')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Hero visual: a real photograph, not a fabricated dashboard preview.
                    Front parallax plane — travels slightly faster than the page. */}
                <div
                    className="lg:col-span-5 relative hidden lg:block"
                    style={{ transform: `translate3d(0, ${frontOffset}px, 0)` }}
                >
                    <div
                        className="absolute -inset-6 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent rounded-[2rem] blur-2xl pointer-events-none"
                        aria-hidden="true"
                    />
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
                        <img
                            src="https://picsum.photos/seed/ezjob-industrial-crew/900/1100"
                            alt="A certified skilled trades professional on an active industrial worksite"
                            className="w-full h-full object-cover aspect-[4/5]"
                            loading="eager"
                        />
                    </div>
                </div>

                {/* Crew glow lineup — full width, below both columns. */}
                <div className="lg:col-span-12">
                    <CrewLineup />
                </div>
            </div>
        </section>
    );
};

type HowItWorksAudience = 'worker' | 'employer';

/** Worker/Employer toggle over a 3-step journey plus a 4-item feature grid.
 * Tab switch re-triggers this file's one approved keyframe (animate-fade-in-up)
 * via a `key` remount rather than introducing a second one. The connecting
 * arrow between step cards is a real flex sibling (ArrowRight desktop /
 * ArrowDown mobile), not an absolutely-positioned pseudo-element with a
 * guessed pixel offset — centers correctly regardless of card width. */
const HowItWorksSection = () => {
    const { t } = useLocale();
    const [audience, setAudience] = useState<HowItWorksAudience>('worker');

    const workerSteps = [
        { icon: IdCard, title: t('homepage.howItWorksWorkerStep1Title'), desc: t('homepage.howItWorksWorkerStep1Desc') },
        { icon: Video, title: t('homepage.howItWorksWorkerStep2Title'), desc: t('homepage.howItWorksWorkerStep2Desc') },
        { icon: UserPlus, title: t('homepage.howItWorksWorkerStep3Title'), desc: t('homepage.howItWorksWorkerStep3Desc') },
    ];
    const employerSteps = [
        { icon: Search, title: t('homepage.howItWorksEmployerStep1Title'), desc: t('homepage.howItWorksEmployerStep1Desc') },
        { icon: Eye, title: t('homepage.howItWorksEmployerStep2Title'), desc: t('homepage.howItWorksEmployerStep2Desc') },
        { icon: ShieldCheck, title: t('homepage.howItWorksEmployerStep3Title'), desc: t('homepage.howItWorksEmployerStep3Desc') },
    ];
    const steps = audience === 'worker' ? workerSteps : employerSteps;

    const features = [
        { icon: IdCard, title: t('homepage.howItWorksFeaturePassportTitle'), desc: t('homepage.howItWorksFeaturePassportDesc') },
        { icon: Shield, title: t('homepage.howItWorksFeatureBondTitle'), desc: t('homepage.howItWorksFeatureBondDesc') },
        { icon: Bot, title: t('homepage.howItWorksFeatureAiTitle'), desc: t('homepage.howItWorksFeatureAiDesc') },
        { icon: Gem, title: t('homepage.howItWorksFeatureFreemiumTitle'), desc: t('homepage.howItWorksFeatureFreemiumDesc') },
    ];

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-colors duration-300">
            <Reveal className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('homepage.howItWorksHeading')}</h2>
            </Reveal>

            <Reveal className="flex justify-center mb-12">
                <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full shadow-inner">
                    {(['worker', 'employer'] as const).map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setAudience(tab)}
                            aria-pressed={audience === tab}
                            className={`px-6 sm:px-8 py-3 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer min-w-[140px] ${
                                audience === tab
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            {tab === 'worker' ? t('homepage.howItWorksForWorkers') : t('homepage.howItWorksForEmployers')}
                        </button>
                    ))}
                </div>
            </Reveal>

            <div key={audience} className="mb-16 animate-fade-in-up">
                <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0">
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <React.Fragment key={i}>
                                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-cyan-400/60 dark:hover:border-cyan-500/50 hover:-translate-y-1 transition-all p-7 flex flex-col items-center text-center">
                                    <span className="w-8 h-8 rounded-full bg-slate-900 dark:bg-cyan-500 text-cyan-400 dark:text-slate-950 font-mono font-bold text-sm flex items-center justify-center mb-4">
                                        {i + 1}
                                    </span>
                                    <Icon size={40} strokeWidth={1.5} className="text-slate-900 dark:text-white mb-4" aria-hidden="true" />
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="flex items-center justify-center shrink-0 px-1 md:px-2" aria-hidden="true">
                                        <ArrowRight size={20} className="hidden md:block text-slate-300 dark:text-slate-700" />
                                        <ArrowDown size={20} className="md:hidden text-slate-300 dark:text-slate-700" />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((f, i) => {
                    const Icon = f.icon;
                    return (
                        <Reveal key={i} from="scale" delayMs={i * 70}>
                            <div className="h-full bg-slate-50 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border-l-4 border-transparent hover:border-cyan-500 rounded-xl p-6 flex items-start gap-4 transition-all hover:shadow-lg">
                                <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-cyan-400 flex items-center justify-center">
                                    <Icon size={20} aria-hidden="true" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{f.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        </Reveal>
                    );
                })}
            </div>
        </section>
    );
};

const HighVelocityRolesSection = () => {
    const navigate = useNavigate();
    const { t } = useLocale();
    const { ref, inView } = useInView<HTMLDivElement>();

    const sampleRoles = [
        {
            title: t('homepage.role1Title'),
            desc: t('homepage.role1Desc'),
            category: t('jobSearch.badgeImmediateStart'),
            rate: "$95 - $120 / hr",
            location: "Singapore CBD",
        },
        {
            title: t('homepage.role2Title'),
            desc: t('homepage.role2Desc'),
            category: t('jobSearch.badgeHotRole'),
            rate: "$65 - $80 / hr",
            location: "Jurong Island, SG",
        },
        {
            title: t('homepage.role3Title'),
            desc: t('homepage.role3Desc'),
            category: t('homepage.badgeVerifiedTalent'),
            rate: "$55 - $75 / hr",
            location: "Johor Bahru / SG",
        },
    ];

    const [featured, ...rest] = sampleRoles;

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-colors duration-300">
            <div
                ref={ref}
                className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 transition-all duration-700 ease-out ${
                    inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
            >
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('homepage.rolesHeading')}</h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 max-w-md">
                        {t('homepage.rolesSubheading')}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/jobs')}
                    className="inline-flex items-center gap-2 text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 font-mono text-xs uppercase font-bold transition-colors self-start md:self-auto cursor-pointer active:scale-[0.98]"
                >
                    {t('homepage.viewAllRoles')}
                    <ArrowRight size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Featured role: larger, asymmetric weight against the two stacked roles.
                    Enters from the left, the side roles from the right — anchor
                    variety instead of every card fading up the same way. */}
                <Reveal from="left" className="lg:col-span-3">
                    <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-shadow p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
                                    {featured.category}
                                </span>
                                <span className="text-slate-400 text-xs font-mono">{featured.location}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{featured.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                                {featured.desc}
                            </p>
                        </div>
                        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{featured.rate}</span>
                            <button
                                onClick={() => navigate('/jobs')}
                                className="bg-slate-900 dark:bg-cyan-500 hover:bg-cyan-600 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-mono text-xs uppercase px-5 py-2.5 rounded-full font-semibold transition-colors cursor-pointer active:scale-[0.98]"
                            >
                                {t('jobSearch.applyNow')}
                            </button>
                        </div>
                    </div>
                </Reveal>

                <div className="lg:col-span-2 flex flex-col gap-6">
                    {rest.map((role, idx) => (
                        <Reveal key={idx} from="right" delayMs={(idx + 1) * 90} className="flex-1">
                            <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            {role.category}
                                        </span>
                                        <span className="text-slate-400 text-xs font-mono">{role.location}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{role.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                        {role.desc}
                                    </p>
                                </div>
                                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{role.rate}</span>
                                    <button
                                        onClick={() => navigate('/jobs')}
                                        className="text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 font-mono text-xs uppercase font-bold transition-colors cursor-pointer active:scale-[0.98]"
                                    >
                                        {t('jobSearch.applyNow')}
                                    </button>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FeaturesSection = () => {
    const { t } = useLocale();
    const features = [
        { icon: Bot, name: t('homepage.featureAiStudioName'), desc: t('homepage.featureAiStudioDesc') },
        { icon: ShieldCheck, name: t('homepage.featurePassportName'), desc: t('homepage.featurePassportDesc') },
        { icon: Zap, name: t('homepage.featureMatchName'), desc: t('homepage.featureMatchDesc') },
        { icon: Shield, name: t('homepage.featureIntegrityName'), desc: t('homepage.featureIntegrityDesc') },
        { icon: Globe, name: t('homepage.featureMobilityName'), desc: t('homepage.featureMobilityDesc') },
        { icon: FileDown, name: t('homepage.featureExportName'), desc: t('homepage.featureExportDesc') },
    ];

    return (
        <section className="py-20 bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <Reveal className="max-w-2xl mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('homepage.featuresHeading')}</h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">
                        {t('homepage.featuresSubheading')}
                    </p>
                </Reveal>

                {/* Bento grid: 6 items, 6 cells, 2 wide "feature" tiles carry real
                    background variation so the grid isn't 6 identical white cards. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((f, i) => {
                        const isWide = i === 0 || i === 3;
                        const isDarkTile = i === 0;
                        const isTintedTile = i === 3;
                        const Icon = f.icon;
                        return (
                            <Reveal key={i} from="scale" delayMs={i * 70} className={isWide ? 'lg:col-span-2' : ''}>
                                <div
                                    className={`h-full rounded-2xl p-6 border transition-all hover:-translate-y-1 ${
                                        isDarkTile
                                            ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white shadow-lg'
                                            : isTintedTile
                                            ? 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/50'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                                            isDarkTile
                                                ? 'bg-white/10 text-cyan-300'
                                                : 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400'
                                        }`}
                                    >
                                        <Icon size={24} />
                                    </div>
                                    <h3 className={`text-lg font-bold mb-1 ${isDarkTile ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        {f.name}
                                    </h3>
                                    <p className={`text-sm leading-relaxed ${isDarkTile ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {f.desc}
                                    </p>
                                </div>
                            </Reveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const AiInActionSection = () => {
    const { t } = useLocale();
    const [jobTitle, setJobTitle] = useState('Heavy Machinery Operator');
    const [generatedJD, setGeneratedJD] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [genError, setGenError] = useState('');

    // Signature move for this page: the demo panel "spools up" as it centers
    // in the viewport, rather than simply fading in like every other
    // section. `focus` peaks at 1 when the section is dead-center on screen
    // and falls off toward its edges, driving the ambient glow's intensity —
    // this is the page's one engineered peak, tied to its most interactive
    // moment (the live AI generator), not a generic scroll flourish.
    const { ref: engineRef, progress: engineProgress } = useScrollProgress<HTMLElement>(0.5);
    const focus = Math.max(0, 1 - Math.abs(engineProgress - 0.5) * 2.2);

    const handleGenerate = async () => {
        if (!jobTitle) return;
        setIsGenerating(true);
        setGenError('');
        try {
            const { description, required_skills } = await generateJobWithAI(jobTitle, 'a leading EZJOB employer');
            if (!description || description === 'Could not generate description.') {
                setGenError(t('homepage.aiDemoError'));
                setGeneratedJD('');
                return;
            }
            const skillsBlock = required_skills.length > 0
                ? `\n\nCORE REQUIREMENTS:\n${required_skills.map(s => `• ${s}`).join('\n')}`
                : '';
            setGeneratedJD(`REQUISITION: ${jobTitle}\n\n${description}${skillsBlock}`);
        } catch (error) {
            console.error('Error generating demo job description:', error);
            setGenError(t('homepage.aiDemoError'));
            setGeneratedJD('');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <section ref={engineRef} className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-colors duration-300">
            <Reveal
                className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white rounded-2xl p-8 sm:p-12 border relative overflow-hidden shadow-2xl"
                style={{
                    borderColor: `rgba(34, 211, 238, ${0.15 + focus * 0.35})`,
                    boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 ${40 + focus * 60}px rgba(6, 182, 212, ${focus * 0.25})`,
                }}
            >
                {/* Ambient glow: opacity and scale rise as the panel centers in the
                    viewport, reading as the engine "powering up". Transform +
                    opacity only, written directly off scroll progress — no eased
                    transition on transform, so it never lags a frame behind. */}
                <div
                    className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 blur-3xl pointer-events-none"
                    style={{
                        opacity: 0.6 + focus * 0.9,
                        transform: `scale(${0.85 + focus * 0.35})`,
                    }}
                />

                <div className="max-w-3xl mx-auto text-center mb-8 relative z-10">
                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">{t('homepage.aiDemoBadge')}</span>
                    <h2 className="text-3xl font-bold tracking-tight text-white mt-1">{t('homepage.aiDemoHeading')}</h2>
                    <p className="text-slate-300 text-sm mt-2">{t('homepage.aiDemoSubheading')}</p>
                </div>

                <div className="max-w-2xl mx-auto relative z-10">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder={t('homepage.aiDemoPlaceholder')}
                            className="flex-grow px-5 py-3.5 bg-slate-950/80 border border-slate-700 text-white rounded-full focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 font-mono text-sm placeholder:text-slate-500"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs uppercase px-8 py-3.5 rounded-full font-bold shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <span>{t('homepage.aiDemoGenerating')}</span>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    {t('homepage.aiDemoGenerateAd')}
                                </>
                            )}
                        </button>
                    </div>

                    {genError && (
                        <div className="mt-6 p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-sm text-red-300">
                            {genError}
                        </div>
                    )}

                    {generatedJD && (
                        <div className="mt-6 p-6 rounded-2xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed shadow-xl">
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs text-cyan-400 font-mono">
                                <span>{t('homepage.aiDemoOutputLabel')}</span>
                                <span>Engine: Gemini 2.5 Flash</span>
                            </div>
                            {generatedJD}
                        </div>
                    )}
                </div>
            </Reveal>
        </section>
    );
};

const ComparisonSection = () => {
    const { t } = useLocale();
    const rows = [
        {
            capability: t('homepage.compRow1Capability'),
            ezjob: t('homepage.compRow1Ezjob'),
            generic: t('homepage.compRow1Generic'),
        },
        {
            capability: t('homepage.compRow2Capability'),
            ezjob: t('homepage.compRow2Ezjob'),
            generic: t('homepage.compRow2Generic'),
        },
        {
            capability: t('homepage.compRow3Capability'),
            ezjob: t('homepage.compRow3Ezjob'),
            generic: t('homepage.compRow3Generic'),
        },
        {
            capability: t('homepage.compRow4Capability'),
            ezjob: t('homepage.compRow4Ezjob'),
            generic: t('homepage.compRow4Generic'),
        },
    ];

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-colors duration-300">
            <Reveal className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('homepage.comparisonHeading')}</h2>
            </Reveal>

            {/* A wipe, not a fade — dramatizes the comparison as a change of
                state rather than just introducing an image, and it's used on
                one big element (the whole table), not scattered across rows. */}
            <WipeReveal className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                                <th className="py-4 px-6 font-semibold">{t('homepage.comparisonCapabilityHeader')}</th>
                                <th className="py-4 px-6 font-semibold text-cyan-600 dark:text-cyan-400 text-center">{t('homepage.comparisonEzjobHeader')}</th>
                                <th className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400 text-center">{t('homepage.comparisonGenericHeader')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                            {rows.map((row, idx) => (
                                <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60 dark:bg-slate-950/40' : ''}>
                                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{row.capability}</td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
                                            <Check size={16} />
                                            {row.ezjob}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="inline-flex items-center gap-1.5 text-slate-400">
                                            <X size={16} />
                                            {row.generic}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </WipeReveal>
        </section>
    );
};

const TestimonialsSection = () => {
    const { t } = useLocale();
    const { homepageContent } = useSiteContent();

    return (
        <section className="py-20 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <Reveal className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('homepage.testimonialsHeading')}</h2>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {homepageContent.testimonials.map((t, idx) => (
                        <Reveal
                            key={t.id}
                            delayMs={idx * 90}
                            className="md:[&>div]:hover:-translate-y-1 md:[&:nth-child(3n+2)]:-translate-y-4"
                        >
                            <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform flex flex-col justify-between">
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">
                                    &ldquo;{t.quote}&rdquo;
                                </p>
                                <p className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400 text-right">
                                    {stripLeadingDash(t.author)}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FaqSection = () => {
    const { t } = useLocale();
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const { homepageContent } = useSiteContent();

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full transition-colors duration-300">
            <Reveal className="text-center mb-10">
                <span className="font-mono text-xs uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-bold">
                    {t('homepage.faqEyebrow')}
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">{t('homepage.faqHeading')}</h2>
            </Reveal>

            <div className="space-y-3">
                {homepageContent.faqs.map((faq, index) => (
                    <div key={faq.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full flex justify-between items-center gap-4 text-left p-5 font-semibold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                            aria-expanded={openIndex === index}
                        >
                            <span className="text-sm">{faq.q}</span>
                            <span className="shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                {openIndex === index ? <Minus size={14} /> : <Plus size={14} />}
                            </span>
                        </button>
                        {openIndex === index && (
                            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                                <p>{faq.a}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

const FinalCtaSection = () => {
    const navigate = useNavigate();
    const { t } = useLocale();

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950 text-white relative overflow-hidden transition-colors duration-300">
            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 60%)',
                }}
            />

            <Reveal className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-white mb-4">{t('homepage.ctaHeading')}</h2>
                <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
                    {t('homepage.ctaSubheading')}
                </p>
                {/* Converging close: the two final actions arrive from opposite
                    edges and meet at center as the page resolves, instead of
                    trailing off into a plain footer-like block. */}
                <div className="flex flex-wrap justify-center items-center gap-4">
                    <Reveal from="left" delayMs={100}>
                        <button
                            onClick={() => navigate('/register', { state: { role: UserRole.WORKER } })}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs uppercase tracking-wider font-bold py-3.5 px-8 rounded-full shadow-lg transition-all cursor-pointer active:scale-[0.98]"
                        >
                            {t('homepage.ctaCreatePassport')}
                        </button>
                    </Reveal>
                    <Reveal from="right" delayMs={100}>
                        <button
                            onClick={() => navigate('/register', { state: { role: UserRole.EMPLOYER } })}
                            className="bg-slate-950 dark:bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-mono text-xs uppercase tracking-wider font-semibold py-3.5 px-8 rounded-full transition-all cursor-pointer active:scale-[0.98]"
                        >
                            {t('homepage.postARole')}
                        </button>
                    </Reveal>
                </div>
            </Reveal>
        </section>
    );
};

const HomePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <HeroSection />
            <HowItWorksSection />
            <HighVelocityRolesSection />
            <FeaturesSection />
            <AiInActionSection />
            <ComparisonSection />
            <TestimonialsSection />
            <FaqSection />
            <FinalCtaSection />
        </div>
    );
};

export default HomePage;
