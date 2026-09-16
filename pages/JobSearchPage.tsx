import React, { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import type { Job } from '../types';
import { getJobs, getWorkerApplications, createApplication, getWorkerProfile } from '../services/db';
import Spinner from '../components/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { ArrowUpDown, Search, MapPin, DollarSign, Calendar, Sparkles, Building2, CheckCircle2, Clock, Bus, Home, Users, LayoutGrid, Hand, X, Heart, Target } from 'lucide-react';
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

const JobCard: React.FC<{
    job: Job;
    onApply: (job: Job) => void;
    isApplying: boolean;
    hasApplied: boolean;
    onViewJob: (jobId: string) => void;
    onViewCompany: (employerId: string) => void;
    index: number;
    matchPercent?: number;
}> = ({ job, onApply, isApplying, hasApplied, onViewJob, onViewCompany, index, matchPercent }) => {
    const { t } = useLocale();
    // Dynamic border color styling based on index or urgency
    const accentBorder = index % 3 === 0
        ? 'border-l-orange-500'
        : index % 3 === 1
            ? 'border-l-cyan-500'
            : 'border-l-fuchsia-500';

    const badgeStyle = index % 3 === 0
        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30'
        : index % 3 === 1
            ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30'
            : 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-500/30';

    const badgeLabel = index % 3 === 0 ? t('jobSearch.badgeImmediateStart') : index % 3 === 1 ? t('jobSearch.badgeVerifiedReq') : t('jobSearch.badgeHotRole');

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 border-l-4 ${accentBorder} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden ${hasApplied ? 'opacity-90 ring-1 ring-emerald-400' : ''}`}>
            <div
                onClick={() => onViewJob(job.id)}
                className="p-6 flex-grow cursor-pointer"
            >
                {/* Top Badge & Company */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase border ${badgeStyle}`}>
                            {badgeLabel}
                        </span>
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
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewCompany(job.employer_id);
                        }}
                        className="text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1 truncate max-w-[160px] flex-shrink-0"
                    >
                        <Building2 size={13} />
                        <span className="truncate">{job.employer_name}</span>
                    </button>
                </div>

                {/* Job Title */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors mb-2 leading-tight">
                    {job.title}
                </h3>

                {/* Metadata row */}
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
                    {(job.transport_provided || job.accommodation_provided) && (
                        <div className="flex items-center gap-3 flex-wrap">
                            {job.transport_provided && (
                                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                    <Bus size={14} className="text-cyan-600 dark:text-cyan-400" /> {t('jobSearch.transport')}
                                </span>
                            )}
                            {job.accommodation_provided && (
                                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                    <Home size={14} className="text-cyan-600 dark:text-cyan-400" /> {t('jobSearch.housing')}
                                </span>
                            )}
                        </div>
                    )}
                    {job.available_positions !== undefined && (
                        <div className="flex items-center gap-1.5">
                            <Users size={14} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                            <span>{t('jobSearch.positionsOpen', { filled: Math.max(0, job.available_positions - (job.positions_filled ?? 0)), total: job.available_positions })}</span>
                        </div>
                    )}
                    {job.createdAt && (
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px]">
                            <Calendar size={13} />
                            <span>{t('jobSearch.posted', { date: new Date(job.createdAt).toLocaleDateString() })}</span>
                        </div>
                    )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                    {job.description}
                </p>

                {/* Skill tags */}
                <div className="flex flex-wrap gap-1.5 mt-auto">
                    {job.required_skills?.slice(0, 4).map(skill => (
                        <span 
                            key={skill} 
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-medium rounded-md border border-slate-200/60 dark:border-slate-700/60"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                    onClick={() => onViewJob(job.id)}
                    className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                    {t('jobSearch.viewDetails')}
                </button>
                
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onApply(job);
                    }}
                    disabled={isApplying || hasApplied}
                    className={`font-mono text-xs uppercase px-5 py-2.5 rounded-full font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer
                        ${hasApplied
                            ? 'bg-emerald-600 text-white cursor-default'
                            : isApplying
                                ? 'bg-slate-400 text-white cursor-wait'
                                : 'bg-slate-900 dark:bg-slate-800 hover:bg-cyan-600 dark:hover:bg-cyan-500 text-white hover:shadow-md'
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
    );
};

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
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
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
    const [selectedCategory, setSelectedCategory] = useState('All Roles');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'match'>('newest');
    const [applyingId, setApplyingId] = useState<string | null>(null);
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'swipe'>('list');
    // Illustrates "how well am I positioned" per job — see utils/jobMatch.ts.
    const [jobMatches, setJobMatches] = useState<Map<string, SkillMatchResult>>(new Map());

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
    }, [jobs, searchTerm, selectedCategory, sortOrder, jobMatches]);

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
                {/* Search Header Banner */}
                <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-10 mb-10 shadow-xl border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-cyan-500/30 rounded-full text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">
                            <Sparkles size={13} />
                            {t('jobSearch.badge')}
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                            {t('jobSearch.heading')}
                        </h1>
                        <p className="text-slate-300 text-sm mt-2">
                            {t('jobSearch.subheading')}
                        </p>
                    </div>

                    {/* Search & Sort Controls */}
                    <div className="mt-8 flex flex-col md:flex-row gap-3 relative z-10">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('jobSearch.searchPlaceholder')}
                                className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-full focus:outline-none focus:border-cyan-400 font-mono text-sm placeholder:text-slate-500"
                            />
                        </div>

                        <button
                            onClick={() => setSortOrder(prev => {
                                if (prev === 'newest') return 'oldest';
                                if (prev === 'oldest') return canSortByMatch ? 'match' : 'newest';
                                return 'newest';
                            })}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-slate-600 text-white rounded-full font-mono text-xs uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer"
                        >
                            {sortOrder === 'match' ? <Target size={15} className="text-cyan-400" /> : <ArrowUpDown size={15} className="text-cyan-400" />}
                            <span>
                                {sortOrder === 'newest' ? t('jobSearch.newestFirst') : sortOrder === 'oldest' ? t('jobSearch.oldestFirst') : t('jobSearch.bestMatch')}
                            </span>
                        </button>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 relative z-10 scrollbar-none">
                        {TRADE_CATEGORIES.map((cat) => (
                            <button
                                key={cat.match}
                                onClick={() => setSelectedCategory(cat.match)}
                                className={`px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                                    selectedCategory === cat.match
                                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                                        : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
                                }`}
                            >
                                {t(cat.key)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Meta Info + View Mode Toggle */}
                <div className="flex items-center justify-between mb-6 px-1 gap-3 flex-wrap">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredJobs.map((job, index) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    index={index}
                                    onApply={handleApply}
                                    onViewJob={handleViewJob}
                                    onViewCompany={handleViewCompany}
                                    isApplying={applyingId === job.id}
                                    hasApplied={appliedJobIds.has(job.id)}
                                    matchPercent={jobMatches.get(job.id)?.percent}
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


