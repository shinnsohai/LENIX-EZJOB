import React, { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import type { Job } from '../types';
import { getJobs, getWorkerApplications, createApplication, getWorkerProfile } from '../services/db';
import Spinner from '../components/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Search, MapPin, DollarSign, Building2, CheckCircle2, Clock, Bus, Home, Users, LayoutGrid, Hand, X, Heart, Target, ChevronDown, Bookmark, BookmarkCheck } from 'lucide-react';
import { formatSalaryRange } from '../data/currencies';
import { useLocale } from '../contexts/LocaleContext';
import type { UIStrings } from '../locales';
import { rankJobsByMatch, type SkillMatchResult } from '../utils/jobMatch';

// Category filtering matches against the job's English title/description/
// skills regardless of display locale — job content itself isn't
// translated inline (see jobs.translations), so filtering stays anchored
// to the base English category words while only the visible label switches.
const TRADE_CATEGORIES: { key: keyof UIStrings; match: string }[] = [
    { key: 'jobSearch.categoryAll', match: 'All Roles' },
    { key: 'jobSearch.categoryEngineering', match: 'Engineering' },
    { key: 'jobSearch.categoryHeavyMachinery', match: 'Heavy Machinery' },
    { key: 'jobSearch.categoryElectrical', match: 'Electrical' },
    { key: 'jobSearch.categoryWelding', match: 'Welding & Fabrication' },
    { key: 'jobSearch.categorySafety', match: 'Safety Oversight' },
];

// A job posted within this window gets a real (not decorative) "New" badge.
const NEW_BADGE_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;

// Company "logo" is an initial-letter avatar, not a fabricated image — Job
// records don't carry a logo URL. Color is a deterministic hash into the
// four approved brand hues (design-system.md), never a random/cycled value.
const AVATAR_STYLES = ['bg-cyan-500', 'bg-blue-500', 'bg-fuchsia-500', 'bg-orange-500'];
const getAvatarStyle = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return AVATAR_STYLES[hash % AVATAR_STYLES.length];
};
const CompanyAvatar: React.FC<{ name: string }> = ({ name }) => (
    <div className={`flex-shrink-0 h-11 w-11 sm:h-12 sm:w-12 rounded-xl ${getAvatarStyle(name)} text-white flex items-center justify-center font-bold text-lg shadow-sm`}>
        {name.charAt(0).toUpperCase()}
    </div>
);

// Genuinely locale-aware ("57 mins ago", "2 days ago", ...) via the
// browser's own ICU data — no per-language strings to maintain by hand.
const formatRelativeTime = (iso: string, locale: string): string => {
    const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    try {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        if (Math.abs(diffMinutes) < 60) return rtf.format(-diffMinutes, 'minute');
        const diffHours = Math.round(diffMinutes / 60);
        if (Math.abs(diffHours) < 24) return rtf.format(-diffHours, 'hour');
        const diffDays = Math.round(diffHours / 24);
        if (Math.abs(diffDays) < 30) return rtf.format(-diffDays, 'day');
        const diffMonths = Math.round(diffDays / 30);
        if (Math.abs(diffMonths) < 12) return rtf.format(-diffMonths, 'month');
        return rtf.format(-Math.round(diffMonths / 12), 'year');
    } catch {
        return new Date(iso).toLocaleDateString();
    }
};

const SAVED_JOBS_STORAGE_KEY = 'ezjob_saved_jobs';
// Per-viewer convenience, not shared/authoritative state — localStorage is
// the right home for it (see design conventions on browser storage use).
const useSavedJobs = () => {
    const [savedIds, setSavedIds] = useState<Set<string>>(() => {
        try {
            const raw = localStorage.getItem(SAVED_JOBS_STORAGE_KEY);
            return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch {
            return new Set();
        }
    });

    const toggleSave = useCallback((jobId: string) => {
        setSavedIds(prev => {
            const next = new Set(prev);
            if (next.has(jobId)) next.delete(jobId); else next.add(jobId);
            try {
                localStorage.setItem(SAVED_JOBS_STORAGE_KEY, JSON.stringify(Array.from(next)));
            } catch {
                // Private browsing / storage disabled — save still works for
                // this session, it just won't persist across reloads.
            }
            return next;
        });
    }, []);

    return { savedIds, toggleSave };
};

const JobCard: React.FC<{
    job: Job;
    onApply: (job: Job) => void;
    isApplying: boolean;
    hasApplied: boolean;
    onViewJob: (jobId: string) => void;
    onViewCompany: (employerId: string) => void;
    matchPercent?: number;
    isSaved: boolean;
    onToggleSave: (jobId: string) => void;
}> = ({ job, onApply, isApplying, hasApplied, onViewJob, onViewCompany, matchPercent, isSaved, onToggleSave }) => {
    const { t, locale } = useLocale();
    const isNew = !!job.createdAt && (Date.now() - new Date(job.createdAt).getTime()) < NEW_BADGE_WINDOW_MS;

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-md transition-all duration-200 ${hasApplied ? 'ring-1 ring-emerald-400' : ''}`}>
            <div onClick={() => onViewJob(job.id)} className="p-5 sm:p-6 cursor-pointer flex gap-4">
                <CompanyAvatar name={job.employer_name} />

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors leading-tight">
                                    {job.title}
                                </h3>
                                {isNew && (
                                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 flex-shrink-0">
                                        {t('jobSearch.newBadge')} 🔥
                                    </span>
                                )}
                                {matchPercent !== undefined && (
                                    <span
                                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase border flex items-center gap-1 flex-shrink-0 ${
                                            matchPercent >= 70
                                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                                                : matchPercent >= 40
                                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                                                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <Target size={11} /> {t('jobDetail.matchBadge', { percent: matchPercent })}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onViewCompany(job.employer_id); }}
                                className="text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors mt-0.5"
                            >
                                {job.employer_name}
                            </button>
                        </div>

                        <div className="flex-shrink-0 text-right text-xs text-slate-500 dark:text-slate-400 space-y-1">
                            <div className="flex items-center justify-end gap-1.5">
                                <MapPin size={13} className="text-slate-400" />
                                <span className="truncate max-w-[160px]">{job.location}{job.country ? `, ${job.country}` : ''}</span>
                            </div>
                            {job.createdAt && (
                                <div className="flex items-center justify-end gap-1.5">
                                    <Clock size={13} className="text-slate-400" />
                                    <span>{formatRelativeTime(job.createdAt, locale)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                            <DollarSign size={13} className="text-emerald-600 dark:text-emerald-400" />
                            {formatSalaryRange(job.salary_min ?? 0, job.salary_max ?? 0, job.country)} {t('common.perYear')}
                        </span>
                        {job.transport_provided && (
                            <span className="flex items-center gap-1"><Bus size={13} className="text-cyan-600 dark:text-cyan-400" /> {t('jobSearch.transport')}</span>
                        )}
                        {job.accommodation_provided && (
                            <span className="flex items-center gap-1"><Home size={13} className="text-cyan-600 dark:text-cyan-400" /> {t('jobSearch.housing')}</span>
                        )}
                        {job.available_positions !== undefined && (
                            <span className="flex items-center gap-1">
                                <Users size={13} className="text-cyan-600 dark:text-cyan-400" />
                                {t('jobSearch.positionsOpen', { filled: Math.max(0, job.available_positions - (job.positions_filled ?? 0)), total: job.available_positions })}
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-3 leading-relaxed">
                        {job.description}
                    </p>

                    <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
                        <div className="flex flex-wrap gap-1.5">
                            {job.required_skills?.slice(0, 4).map(skill => (
                                <span
                                    key={skill}
                                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-medium rounded-md border border-slate-200/60 dark:border-slate-700/60"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => onToggleSave(job.id)}
                                aria-label={isSaved ? t('jobSearch.unsaveJobAria') : t('jobSearch.saveJobAria')}
                                aria-pressed={isSaved}
                                className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-cyan-400 dark:hover:border-cyan-600 transition-colors cursor-pointer"
                            >
                                {isSaved ? <BookmarkCheck size={16} className="text-cyan-600 dark:text-cyan-400" /> : <Bookmark size={16} className="text-slate-400" />}
                            </button>
                            <button
                                onClick={() => onApply(job)}
                                disabled={isApplying || hasApplied}
                                className={`text-sm px-5 py-2 rounded-full font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer
                                    ${hasApplied
                                        ? 'bg-emerald-600 text-white cursor-default'
                                        : isApplying
                                            ? 'bg-slate-400 text-white cursor-wait'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                                    }`}
                            >
                                {hasApplied ? (
                                    <>
                                        <CheckCircle2 size={14} />
                                        {t('jobSearch.applied')}
                                    </>
                                ) : isApplying ? (
                                    t('jobSearch.submitting')
                                ) : (
                                    t('jobSearch.applyNow')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Plain, flat filter dropdown matching the light "outlined pill" style —
// every option is always a fully meaningful state (never a disabled
// placeholder), so the box always shows what's actually applied.
const FilterSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
    children: React.ReactNode;
}> = ({ value, onChange, ariaLabel, children }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={ariaLabel}
            className="w-full appearance-none pl-3.5 pr-9 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 cursor-pointer truncate"
        >
            {children}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
);

// ---------------------------------------------------------------------------
// Swipe view — an alternate, "Tinder-card" way to browse the same job list.
// Purely additive: list view (JobCard grid above) is untouched, this is a
// second UI reachable via a toggle. Drag physics use the Pointer Events API
// (unifies mouse + touch in one handler set) and CSS transitions for the
// spring-back / fly-away motion — no animation library, per design-system.md.
// ---------------------------------------------------------------------------
const SWIPE_THRESHOLD = 110;
// Below this much horizontal movement, a pointerdown->pointerup is treated
// as a tap (opens the job detail page) rather than an aborted drag.
const TAP_THRESHOLD = 6;

export interface SwipeCardHandle {
    swipe: (direction: 'left' | 'right') => void;
}

const SwipeJobCard = forwardRef<SwipeCardHandle, {
    job: Job;
    isTop: boolean;
    depth: number;
    matchPercent?: number;
    onSettled: (direction: 'left' | 'right', job: Job) => void;
    onViewJob: (jobId: string) => void;
}>(({ job, isTop, depth, matchPercent, onSettled, onViewJob }, ref) => {
    const { t } = useLocale();
    const [dragX, setDragX] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [exiting, setExiting] = useState<'left' | 'right' | null>(null);
    const startXRef = useRef(0);
    const pointerIdRef = useRef<number | null>(null);

    const commitSwipe = (direction: 'left' | 'right') => {
        if (exiting) return;
        setDragging(false);
        setExiting(direction);
        const flyDistance = (typeof window !== 'undefined' ? window.innerWidth : 800) + 300;
        setDragX(direction === 'right' ? flyDistance : -flyDistance);
        window.setTimeout(() => onSettled(direction, job), 280);
    };

    useImperativeHandle(ref, () => ({ swipe: commitSwipe }));

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isTop || exiting) return;
        startXRef.current = e.clientX;
        pointerIdRef.current = e.pointerId;
        // setDragging must run regardless of capture succeeding — some mobile
        // browsers (notably in-app webviews like Facebook/Instagram/TikTok's,
        // which is how many workers actually open a shared job link) can
        // throw on setPointerCapture for a touch pointer. Uncaught, that
        // exception skips every statement after it in this handler, so
        // dragging never turns on and every subsequent pointermove is
        // silently ignored — exactly "the card won't swipe" with no error
        // visible to the user.
        setDragging(true);
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            // Capture is a nice-to-have (keeps the drag tracking the finger
            // if it strays outside the card) — our own pointermove/pointerup
            // handlers still work without it.
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging || pointerIdRef.current !== e.pointerId) return;
        setDragX(e.clientX - startXRef.current);
    };

    const endDrag = () => {
        if (!dragging) return;
        setDragging(false);
        if (Math.abs(dragX) > SWIPE_THRESHOLD) {
            commitSwipe(dragX > 0 ? 'right' : 'left');
        } else if (Math.abs(dragX) < TAP_THRESHOLD) {
            setDragX(0);
            onViewJob(job.id);
        } else {
            setDragX(0);
        }
    };

    const rotation = dragX / 18;
    const overlayOpacity = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
    const overlaySide: 'left' | 'right' = dragX >= 0 ? 'right' : 'left';

    const style: React.CSSProperties = isTop
        ? {
            transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
            transition: dragging ? 'none' : 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms ease',
            opacity: exiting ? 0 : 1,
            zIndex: 30,
            // Belt-and-suspenders alongside the touch-none class below —
            // guards against real-device quirks (in particular in-app
            // webviews) where a class-based touch-action is applied less
            // reliably than an inline one, and disables iOS's press-and-hold
            // callout/selection so it can't hijack the drag mid-gesture.
            touchAction: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
        }
        : {
            transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.045})`,
            transition: 'transform 280ms ease',
            zIndex: 30 - depth,
        };

    return (
        <div
            className={`absolute inset-0 select-none ${isTop ? 'cursor-grab active:cursor-grabbing touch-none' : 'pointer-events-none'}`}
            style={style}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
        >
            <div className="relative w-full h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                <div
                    className="absolute inset-0 bg-emerald-500/85 flex items-center justify-center pointer-events-none z-10 transition-opacity"
                    style={{ opacity: overlaySide === 'right' ? overlayOpacity : 0 }}
                    aria-hidden="true"
                >
                    <span className="border-4 border-white text-white font-mono text-3xl font-extrabold uppercase px-7 py-2.5 rounded-2xl rotate-12 shadow-lg">
                        {t('jobSearch.swipeApplyLabel')}
                    </span>
                </div>
                <div
                    className="absolute inset-0 bg-red-500/85 flex items-center justify-center pointer-events-none z-10 transition-opacity"
                    style={{ opacity: overlaySide === 'left' ? overlayOpacity : 0 }}
                    aria-hidden="true"
                >
                    <span className="border-4 border-white text-white font-mono text-3xl font-extrabold uppercase px-7 py-2.5 rounded-2xl -rotate-12 shadow-lg">
                        {t('jobSearch.swipeSkipLabel')}
                    </span>
                </div>

                <div className="p-6 sm:p-7 flex-grow overflow-y-auto">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                            <Building2 size={13} />
                            <span className="truncate">{job.employer_name}</span>
                        </div>
                        {matchPercent !== undefined && (
                            <span
                                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase border flex items-center gap-1 flex-shrink-0 ${
                                    matchPercent >= 70
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                                        : matchPercent >= 40
                                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                <Target size={11} /> {t('jobDetail.matchBadge', { percent: matchPercent })}
                            </span>
                        )}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-3">
                        {job.title}
                    </h3>
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4 font-mono">
                        <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                            <span className="truncate">{job.location}{job.country ? `, ${job.country}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <DollarSign size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {formatSalaryRange(job.salary_min ?? 0, job.salary_max ?? 0, job.country)} {t('common.perYear')}
                            </span>
                        </div>
                        {job.shift_schedule && (
                            <div className="flex items-center gap-1.5">
                                <Clock size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                <span className="truncate">{job.shift_schedule}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        {job.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {job.required_skills?.slice(0, 6).map(skill => (
                            <span
                                key={skill}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-medium rounded-md border border-slate-200/60 dark:border-slate-700/60"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});
SwipeJobCard.displayName = 'SwipeJobCard';

const SwipeJobDeck: React.FC<{
    jobs: Job[];
    onApply: (job: Job) => void;
    onViewJob: (jobId: string) => void;
    onSwitchToList: () => void;
    jobMatches?: Map<string, SkillMatchResult>;
}> = ({ jobs, onApply, onViewJob, onSwitchToList, jobMatches }) => {
    const { t } = useLocale();
    const [queue, setQueue] = useState<Job[]>(jobs);
    const topCardRef = useRef<SwipeCardHandle>(null);

    // Re-seed the deck when the underlying *set* of candidate jobs actually
    // changes (new search term, category, fresh data from the server, or an
    // applied job dropping out) — keyed on job IDs rather than the `jobs`
    // array reference, which JobSearchPage rebuilds via .filter() on every
    // render regardless of whether the content changed. Keying on the
    // reference would re-seed (and silently undo an in-progress left-swipe
    // skip) on any unrelated parent re-render.
    const jobsKey = jobs.map(j => j.id).join(',');
    useEffect(() => {
        setQueue(jobs);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobsKey]);

    const handleSettled = (direction: 'left' | 'right', job: Job) => {
        if (direction === 'right') onApply(job);
        setQueue(prev => prev.filter(j => j.id !== job.id));
    };

    const visible = queue.slice(0, 3);

    return (
        <div className="flex flex-col items-center">
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-4 text-center max-w-sm">
                {t('jobSearch.swipeInstructions')}
            </p>

            <div className="relative w-full max-w-sm h-[480px] sm:h-[520px]">
                {visible.length > 0 ? (
                    visible.map((job, i) => (
                        <SwipeJobCard
                            key={job.id}
                            job={job}
                            isTop={i === 0}
                            depth={i}
                            matchPercent={jobMatches?.get(job.id)?.percent}
                            onSettled={handleSettled}
                            onViewJob={onViewJob}
                            ref={i === 0 ? topCardRef : undefined}
                        />
                    ))
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                        <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">celebration</span>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('jobSearch.swipeEmptyTitle')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('jobSearch.swipeEmptyBody')}</p>
                        <button
                            onClick={onSwitchToList}
                            className="mt-5 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-slate-800 hover:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            {t('jobSearch.swipeBackToList')}
                        </button>
                    </div>
                )}
            </div>

            {visible.length > 0 && (
                <>
                    <div className="flex items-center gap-6 mt-6">
                        <button
                            onClick={() => topCardRef.current?.swipe('left')}
                            aria-label={t('jobSearch.swipeSkipAria')}
                            className="h-14 w-14 rounded-full bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/60 text-red-500 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 hover:border-red-400 transition-all cursor-pointer"
                        >
                            <X size={24} />
                        </button>
                        <button
                            onClick={() => topCardRef.current?.swipe('right')}
                            aria-label={t('jobSearch.swipeApplyAria')}
                            className="h-14 w-14 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-900/60 text-emerald-500 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 hover:border-emerald-400 transition-all cursor-pointer"
                        >
                            <Heart size={22} />
                        </button>
                    </div>
                    <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-4">
                        {t('jobSearch.swipeRemaining', { count: queue.length })}
                    </p>
                </>
            )}
        </div>
    );
};

const JobSearchPage: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLocale();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [locationTerm, setLocationTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Roles');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'match'>('newest');
    const [salaryFilter, setSalaryFilter] = useState(0); // 0 = any salary
    const [countryFilter, setCountryFilter] = useState(''); // '' = any country
    const [benefitsFilter, setBenefitsFilter] = useState<'any' | 'transport' | 'housing' | 'both'>('any');
    const [applyingId, setApplyingId] = useState<string | null>(null);
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'swipe'>('list');
    // Illustrates "how well am I positioned" per job — see utils/jobMatch.ts.
    const [jobMatches, setJobMatches] = useState<Map<string, SkillMatchResult>>(new Map());
    const { savedIds, toggleSave } = useSavedJobs();

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        try {
            const isWorker = user && user.role === UserRole.WORKER;
            const [activeJobs, userApplications, workerProfile] = await Promise.all([
                getJobs(),
                isWorker ? getWorkerApplications(user!.id) : Promise.resolve([]),
                isWorker ? getWorkerProfile(user!.id) : Promise.resolve(null),
            ]);

            setJobs(activeJobs);
            setFilteredJobs(activeJobs);
            setJobMatches(isWorker ? rankJobsByMatch(activeJobs, workerProfile) : new Map());

            const activeApplicationIds = new Set(
                userApplications
                    .filter(app => app.status !== 'Withdrawn')
                    .map(app => app.job_id)
            );
            setAppliedJobIds(activeApplicationIds);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Filter and sort jobs
    useEffect(() => {
        let filtered = [...jobs];

        // Filter by search term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(job =>
                job.title.toLowerCase().includes(lowerTerm) ||
                job.employer_name.toLowerCase().includes(lowerTerm) ||
                job.location.toLowerCase().includes(lowerTerm) ||
                job.description.toLowerCase().includes(lowerTerm) ||
                job.required_skills?.some(s => s.toLowerCase().includes(lowerTerm))
            );
        }

        // Filter by category tag
        if (selectedCategory !== 'All Roles') {
            const catLower = selectedCategory.toLowerCase();
            filtered = filtered.filter(job =>
                job.title.toLowerCase().includes(catLower) ||
                job.description.toLowerCase().includes(catLower) ||
                job.required_skills?.some(s => s.toLowerCase().includes(catLower))
            );
        }

        // Filter by location (separate field from the keyword search above —
        // matches against location or country specifically).
        if (locationTerm) {
            const lowerLoc = locationTerm.toLowerCase();
            filtered = filtered.filter(job =>
                job.location.toLowerCase().includes(lowerLoc) ||
                job.country.toLowerCase().includes(lowerLoc)
            );
        }

        // Filter by minimum salary
        if (salaryFilter > 0) {
            filtered = filtered.filter(job => (job.salary_min ?? 0) >= salaryFilter);
        }

        // Filter by country
        if (countryFilter) {
            filtered = filtered.filter(job => job.country === countryFilter);
        }

        // Filter by benefits actually offered on the job (real fields, not
        // a "workplace type" this app doesn't track — skilled trades roles
        // here are inherently on-site).
        if (benefitsFilter !== 'any') {
            filtered = filtered.filter(job => {
                if (benefitsFilter === 'transport') return !!job.transport_provided;
                if (benefitsFilter === 'housing') return !!job.accommodation_provided;
                return !!job.transport_provided && !!job.accommodation_provided;
            });
        }

        // Sort
        if (sortOrder === 'match') {
            filtered.sort((a, b) => (jobMatches.get(b.id)?.percent ?? 0) - (jobMatches.get(a.id)?.percent ?? 0));
        } else {
            filtered.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            });
        }

        setFilteredJobs(filtered);
    }, [jobs, searchTerm, locationTerm, selectedCategory, salaryFilter, countryFilter, benefitsFilter, sortOrder, jobMatches]);

    const availableCountries = React.useMemo(
        () => Array.from(new Set(jobs.map(j => j.country).filter(Boolean))).sort(),
        [jobs]
    );

    const handleApply = async (job: Job) => {
        if (!user) {
            setNotification({ message: t('jobSearch.notifyLoginRequired'), type: 'error' });
            setTimeout(() => setNotification(null), 3500);
            return;
        }

        if (user.role !== UserRole.WORKER) {
            setNotification({ message: t('jobSearch.notifyEmployerCannotApply'), type: 'error' });
            setTimeout(() => setNotification(null), 3500);
            return;
        }

        setApplyingId(job.id);

        try {
            await createApplication(job, user.id);
            setNotification({ message: t('jobSearch.notifySuccess'), type: 'success' });
            setAppliedJobIds(prev => new Set(prev).add(job.id));
        } catch (error: any) {
            console.error("Apply error:", error);
            setNotification({ message: error.message || t('jobSearch.notifyFailure'), type: 'error' });
        } finally {
            setApplyingId(null);
            setTimeout(() => setNotification(null), 3500);
        }
    };

    const handleViewJob = (jobId: string) => {
        navigate(`/jobs/${jobId}`);
    };

    const handleViewCompany = (employerId: string) => {
        navigate(`/employer/profile/${employerId}`);
    };

    const canSortByMatch = user?.role === UserRole.WORKER && jobMatches.size > 0;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            {notification && (
                <div className={`fixed top-24 right-5 text-white py-3.5 px-6 rounded-2xl shadow-2xl z-50 transition-all font-mono text-xs flex items-center gap-2 ${
                    notification.type === 'success' ? 'bg-emerald-600 border border-emerald-400' : 'bg-slate-900 border border-red-500'
                }`}>
                    <span className="font-bold">{notification.type === 'success' ? '✓' : 'ℹ'}</span>
                    <span>{notification.message}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Search Panel */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-5">
                        {t('jobSearch.heading')}
                    </h1>

                    {/* Keyword + Location + Search */}
                    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('jobSearch.searchPlaceholder')}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 text-sm placeholder:text-slate-400"
                            />
                        </div>
                        <div className="relative md:w-64">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input
                                type="text"
                                value={locationTerm}
                                onChange={(e) => setLocationTerm(e.target.value)}
                                placeholder={t('jobSearch.searchLocationPlaceholder')}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 text-sm placeholder:text-slate-400"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm whitespace-nowrap cursor-pointer"
                        >
                            {t('jobSearch.searchButton')}
                        </button>
                    </form>

                    {/* Filter dropdowns */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <FilterSelect value={sortOrder} onChange={(v) => setSortOrder(v as typeof sortOrder)} ariaLabel={t('jobSearch.newestFirst')}>
                            <option value="newest">{t('jobSearch.newestFirst')}</option>
                            <option value="oldest">{t('jobSearch.oldestFirst')}</option>
                            {canSortByMatch && <option value="match">{t('jobSearch.bestMatch')}</option>}
                        </FilterSelect>

                        <FilterSelect value={selectedCategory} onChange={setSelectedCategory} ariaLabel={t(TRADE_CATEGORIES[0].key)}>
                            {TRADE_CATEGORIES.map((cat) => (
                                <option key={cat.match} value={cat.match}>{t(cat.key)}</option>
                            ))}
                        </FilterSelect>

                        <FilterSelect value={String(salaryFilter)} onChange={(v) => setSalaryFilter(Number(v))} ariaLabel={t('jobSearch.filterSalaryAny')}>
                            <option value="0">{t('jobSearch.filterSalaryAny')}</option>
                            <option value="30000">{t('jobSearch.filterSalary30k')}</option>
                            <option value="50000">{t('jobSearch.filterSalary50k')}</option>
                            <option value="70000">{t('jobSearch.filterSalary70k')}</option>
                            <option value="100000">{t('jobSearch.filterSalary100k')}</option>
                        </FilterSelect>

                        <FilterSelect value={countryFilter} onChange={setCountryFilter} ariaLabel={t('jobSearch.filterCountryAny')}>
                            <option value="">{t('jobSearch.filterCountryAny')}</option>
                            {availableCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                        </FilterSelect>

                        <FilterSelect value={benefitsFilter} onChange={(v) => setBenefitsFilter(v as typeof benefitsFilter)} ariaLabel={t('jobSearch.filterBenefitsAny')}>
                            <option value="any">{t('jobSearch.filterBenefitsAny')}</option>
                            <option value="transport">{t('jobSearch.filterBenefitsTransport')}</option>
                            <option value="housing">{t('jobSearch.filterBenefitsHousing')}</option>
                            <option value="both">{t('jobSearch.filterBenefitsBoth')}</option>
                        </FilterSelect>
                    </div>
                </div>

                {/* Results Meta Info + Sort/View Toggles */}
                <div className="flex items-center justify-between mb-6 px-1 gap-3 flex-wrap">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        {t('jobSearch.showingCount', { count: filteredJobs.length })}
                    </span>
                    <div className="flex items-center gap-3">
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                            >
                                {t('jobSearch.clearSearch')}
                            </button>
                        )}
                        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-900 rounded-full p-1">
                            {canSortByMatch && (
                                <button
                                    onClick={() => setSortOrder('match')}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                        sortOrder === 'match'
                                            ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    {t('jobSearch.sortRelevance')}
                                </button>
                            )}
                            <button
                                onClick={() => setSortOrder(prev => (prev === 'oldest' ? 'newest' : 'oldest'))}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    sortOrder === 'newest' || sortOrder === 'oldest'
                                        ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                {t('jobSearch.sortDate')}
                            </button>
                        </div>
                        <div className="inline-flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-1 shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                    viewMode === 'list'
                                        ? 'bg-slate-900 dark:bg-cyan-600 text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                <LayoutGrid size={13} /> {t('jobSearch.viewList')}
                            </button>
                            <button
                                onClick={() => setViewMode('swipe')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                    viewMode === 'swipe'
                                        ? 'bg-slate-900 dark:bg-cyan-600 text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                <Hand size={13} /> {t('jobSearch.viewSwipe')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {isLoading ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <Spinner size="lg" />
                        <p className="mt-4 font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('jobSearch.loading')}</p>
                    </div>
                ) : filteredJobs.length > 0 ? (
                    viewMode === 'list' ? (
                        <div className="flex flex-col gap-4">
                            {filteredJobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    onApply={handleApply}
                                    onViewJob={handleViewJob}
                                    onViewCompany={handleViewCompany}
                                    isApplying={applyingId === job.id}
                                    hasApplied={appliedJobIds.has(job.id)}
                                    matchPercent={jobMatches.get(job.id)?.percent}
                                    isSaved={savedIds.has(job.id)}
                                    onToggleSave={toggleSave}
                                />
                            ))}
                        </div>
                    ) : (
                        <SwipeJobDeck
                            jobs={filteredJobs.filter(job => !appliedJobIds.has(job.id))}
                            onApply={handleApply}
                            onViewJob={handleViewJob}
                            onSwitchToList={() => setViewMode('list')}
                            jobMatches={jobMatches}
                        />
                    )
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">work_off</span>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('jobSearch.noResultsTitle')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
                            {t('jobSearch.noResultsBody')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobSearchPage;


