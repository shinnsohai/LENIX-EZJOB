
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import type { Job, WorkerProfile, EmployerProfile, Application, JobTranslationsCsvRow } from '../types';
import { generateJobWithAI } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
    getEmployerProfile,
    saveEmployerProfile,
    uploadFile,
    getJobs,
    createJob,
    updateJob,
    deleteJob,
    searchWorkersInDb,
    getJobApplicants,
    updateApplicationStatus,
    getApplicantCounts,
    getEmployerApplicationsSummary,
    type EmployerApplicationRecord,
} from '../services/db';
import Spinner from '../components/Spinner';
import { countries, Country } from '../data/countries';
import { getCurrencyForCountry, formatSalaryRange } from '../data/currencies';
import { TRANSLATION_LANGUAGES } from '../data/languages';
import { computeSkillMatch, flattenWorkerSkills } from '../utils/jobMatch';

type View = 'DASHBOARD' | 'NEW_JOB' | 'EDIT_JOB' | 'APPLICANTS';
type JobStatus = 'Active' | 'On Hold' | 'Closed';

const EMPTY_JOB_FORM = {
    title: '',
    location: '',
    salary_min: '',
    salary_max: '',
    description: '',
    required_skills: '',
    shift_schedule: '',
    perks: '',
    whatsapp_number: '',
    qualifying_questions: '', // newline-separated in the form, up to 3 questions
    transport_provided: false,
    transport_details: '',
    accommodation_provided: false,
    accommodation_details: '',
    available_positions: '', // blank = not tracked; positions_filled is server-maintained
};

const SearchWorkersPanel: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [filters, setFilters] = useState({ skill: '', experience: '', country: '' });
    const [results, setResults] = useState<WorkerProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [invitedWorkers, setInvitedWorkers] = useState<Set<string>>(new Set());
    const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set());

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const RESULTS_PER_PAGE = 100;

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSearching(true);
        setResults([]);
        setSelectedWorkers(new Set()); // Reset selections on new search
        setCurrentPage(1); // Reset to first page on new search

        try {
            // Real, paginated Postgres query — page/pageSize are pushed down
            // to the query itself rather than fetching everything and
            // slicing client-side.
            const { workers, total } = await searchWorkersInDb({
                skill: filters.skill,
                experience: parseInt(filters.experience, 10) || 0,
                country: filters.country,
                page: 1,
                pageSize: RESULTS_PER_PAGE,
            });

            setTotalResults(total);
            setResults(workers);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handlePageChange = async (newPage: number) => {
        setCurrentPage(newPage);
        setIsSearching(true);
        setSelectedWorkers(new Set()); // Reset selections on page change

        try {
            const { workers, total } = await searchWorkersInDb({
                skill: filters.skill,
                experience: parseInt(filters.experience, 10) || 0,
                country: filters.country,
                page: newPage,
                pageSize: RESULTS_PER_PAGE,
            });

            setTotalResults(total);
            setResults(workers);
        } catch (error) {
            console.error("Page change failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

    const handleInvite = (workerId: string) => {
        setInvitedWorkers(prev => new Set(prev).add(workerId));
    };

    const toggleWorkerSelection = (workerId: string) => {
        const newSelection = new Set(selectedWorkers);
        if (newSelection.has(workerId)) {
            newSelection.delete(workerId);
        } else {
            newSelection.add(workerId);
        }
        setSelectedWorkers(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedWorkers.size === results.length) {
            setSelectedWorkers(new Set());
        } else {
            const allIds = new Set(results.map(w => w.id));
            setSelectedWorkers(allIds);
        }
    };

    const handleDownloadCVs = () => {
        let downloadCount = 0;
        selectedWorkers.forEach(id => {
            const worker = results.find(w => w.id === id);
            if (worker && worker.cv_url) {
                // Open in new tab to trigger download/view
                window.open(worker.cv_url, '_blank');
                downloadCount++;
            }
        });

        if (downloadCount === 0) {
            showToast("None of the selected workers have a CV uploaded.", 'error');
        } else if (downloadCount < selectedWorkers.size) {
            showToast(`Opened ${downloadCount} CVs. Some selected workers did not have a CV uploaded.`, 'info');
        }
    };

    const handleDownloadSkillPassports = () => {
        if (selectedWorkers.size === 0) {
            showToast("Please select at least one worker.", 'error');
            return;
        }

        selectedWorkers.forEach(id => {
            const worker = results.find(w => w.id === id);
            if (worker) {
                // Open Skill Passport page in new tab. getWorkerProfile looks
                // up by auth user id, so the link must use user_id, not the
                // worker_profiles row's own id. Router-safe link (no HashRouter
                // '/#' prefix) now that the app uses BrowserRouter.
                const passportUrl = `${window.location.origin}/worker/profile/${worker.user_id}`;
                window.open(passportUrl, '_blank');
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Database Worker Search</h2>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
                <div className="md:col-span-1">
                    <label htmlFor="skill" className="block text-sm font-medium text-gray-700">Trade / Skill</label>
                    <input type="text" name="skill" id="skill" value={filters.skill} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" placeholder="e.g., Welder" />
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700">Min. Experience (Years)</label>
                    <input type="number" name="experience" id="experience" value={filters.experience} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" placeholder="e.g., 5" />
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country of Origin</label>
                    <select name="country" id="country" value={filters.country} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500">
                        <option value="">Any</option>
                        {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <button type="submit" disabled={isSearching} className="w-full bg-emerald-600 text-white font-bold py-2 px-4 rounded-md shadow-sm hover:bg-emerald-700 disabled:bg-emerald-300">
                    {isSearching ? <Spinner size="sm" /> : 'Search Database'}
                </button>
            </form>

            {isSearching ? (
                <div className="text-center py-10"><Spinner size="lg" /><p className="mt-2 text-gray-500">Searching database...</p></div>
            ) : (
                <div className="space-y-4">
                    {results.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={results.length > 0 && selectedWorkers.size === results.length}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Select All on Page ({results.length})</span>
                                </div>
                                {selectedWorkers.size > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={handleDownloadCVs}
                                            className="bg-emerald-600 text-white text-sm font-bold py-1 px-3 rounded hover:bg-emerald-700 transition-colors flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download Selected CVs ({selectedWorkers.size})
                                        </button>
                                        <button
                                            onClick={handleDownloadSkillPassports}
                                            className="bg-blue-600 text-white text-sm font-bold py-1 px-3 rounded hover:bg-blue-700 transition-colors flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download Selected Skill Passports ({selectedWorkers.size})
                                        </button>
                                    </div>
                                )}
                            </div>

                            {results.map(worker => (
                                <div key={worker.id} className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start border-2 ${selectedWorkers.has(worker.id) ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-gray-50'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedWorkers.has(worker.id)}
                                                onChange={() => toggleWorkerSelection(worker.id)}
                                                className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/worker/profile/${worker.user_id}`)}
                                                    className="font-bold text-lg text-gray-900 hover:text-emerald-600 transition-colors text-left"
                                                >
                                                    {worker.full_name}
                                                </button>
                                                {worker.cv_url && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">CV Available</span>}
                                            </div>
                                            <p className="text-sm text-emerald-600 font-semibold">{worker.trade_or_skill} - {worker.experience_years} years</p>
                                            <p className="text-xs text-gray-500 mt-1">From: {worker.country_of_origin}</p>
                                            <p className="text-sm text-gray-600 mt-2">{worker.summary || 'No summary provided.'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-4 sm:mt-0 sm:ml-4">
                                        <button
                                            onClick={() => handleInvite(worker.id)}
                                            disabled={invitedWorkers.has(worker.id)}
                                            className="bg-white border border-gray-300 text-gray-700 text-sm font-bold py-2 px-4 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {invitedWorkers.has(worker.id) ? 'Invited' : 'Invite'}
                                        </button>
                                        {worker.cv_url && (
                                            <a
                                                href={worker.cv_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-center bg-emerald-100 text-emerald-800 text-sm font-bold py-2 px-4 rounded-md hover:bg-emerald-200 transition-colors"
                                            >
                                                View CV
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-4">
                                    <div className="text-sm text-gray-600">
                                        Showing {((currentPage - 1) * RESULTS_PER_PAGE) + 1} to {Math.min(currentPage * RESULTS_PER_PAGE, totalResults)} of {totalResults} results
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1 || isSearching}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                            Previous
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        disabled={isSearching}
                                                        className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${currentPage === pageNum
                                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            } disabled:opacity-50 disabled:cursor-not-allowed`}>
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages || isSearching}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-center text-gray-500 py-6">No active workers found matching your criteria.</p>
                    )}
                </div>
            )}
        </div>
    );
};

const APPLICANT_STATUS_ORDER: Application['status'][] = ['Submitted', 'Viewed', 'Shortlisted', 'Hired', 'Rejected'];

const APPLICANT_STATUS_STYLE: Record<string, { bar: string; label: string }> = {
    Submitted: { bar: 'bg-slate-400', label: 'text-slate-600' },
    Viewed: { bar: 'bg-cyan-500', label: 'text-slate-600' },
    Shortlisted: { bar: 'bg-blue-500', label: 'text-slate-600' },
    Hired: { bar: 'bg-emerald-500', label: 'text-slate-600' },
    Rejected: { bar: 'bg-red-500', label: 'text-slate-600' },
};

/** Horizontal bar chart of applicant counts by status — real data from
 * applicationsSummary (see services/db.ts's getEmployerApplicationsSummary),
 * not a decorative placeholder. Each bar carries its own status name as a
 * direct text label (never color alone for identity), which doubles as its
 * own legend, so there's no separate legend box for a single-series chart
 * like this. Track is a full pill; the fill is square at the baseline (left)
 * and rounded only at the data end (right), per the usual bar-chart mark spec. */
const ApplicantStatusChart: React.FC<{
    counts: { status: Application['status']; count: number }[];
    onStatusClick?: (status: Application['status']) => void;
}> = ({ counts, onStatusClick }) => {
    const max = Math.max(1, ...counts.map(c => c.count));
    const total = counts.reduce((sum, c) => sum + c.count, 0);

    if (total === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-center min-h-[220px]">
                <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">bar_chart</span>
                <p className="text-sm text-slate-500">No applicants yet — status breakdown will appear here once candidates start applying.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
            <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Applicant Pipeline</h3>
            <p className="text-xs text-slate-400 mb-5">{total} total applicant{total === 1 ? '' : 's'} across all requisitions — click a status to drill into jobs</p>
            <div className="space-y-3">
                {counts.map(({ status, count }) => {
                    const style = APPLICANT_STATUS_STYLE[status] ?? APPLICANT_STATUS_STYLE.Submitted;
                    const widthPct = count > 0 ? Math.max((count / max) * 100, 4) : 0;
                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => count > 0 && onStatusClick?.(status)}
                            disabled={count === 0}
                            className={`w-full flex items-center gap-3 text-left rounded-lg -mx-1 px-1 py-0.5 transition-colors ${count > 0 ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
                            title={`${status}: ${count}${count > 0 ? ' — view by job' : ''}`}
                        >
                            <span className={`w-20 flex-shrink-0 text-xs font-mono font-semibold ${style.label}`}>{status}</span>
                            <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                {count > 0 && (
                                    <div
                                        className={`h-full rounded-r-full ${style.bar} transition-[width] duration-500`}
                                        style={{ width: `${widthPct}%` }}
                                    />
                                )}
                            </div>
                            <span className="w-8 flex-shrink-0 text-right text-xs font-mono font-bold text-slate-700">{count}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/** Vertical bar chart of applications received per day over the last 14
 * days — bucketed client-side from the same real applicationsSummary by
 * appliedAt's calendar date. Direct labels are selective (first/peak/last
 * only, per "never a number on every point") — every other day's exact
 * count rides the native title-attribute tooltip on hover instead. */
const ApplicationsTrendChart: React.FC<{ daily: { date: Date; count: number }[] }> = ({ daily }) => {
    const max = Math.max(1, ...daily.map(d => d.count));
    const total = daily.reduce((sum, d) => sum + d.count, 0);
    const peakIndex = daily.reduce((best, d, i) => (d.count > daily[best].count ? i : best), 0);

    if (total === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-center min-h-[220px]">
                <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">show_chart</span>
                <p className="text-sm text-slate-500">No applications in the last 14 days yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
            <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Applications — Last 14 Days</h3>
            <p className="text-xs text-slate-400 mb-5">{total} application{total === 1 ? '' : 's'} received</p>
            <div className="flex items-end gap-1.5 h-32">
                {daily.map((d, i) => {
                    const heightPct = d.count === 0 ? 2 : Math.max((d.count / max) * 100, 8);
                    const isLabeled = d.count > 0 && (i === 0 || i === daily.length - 1 || i === peakIndex);
                    return (
                        <div
                            key={i}
                            className="flex-1 flex flex-col items-center justify-end h-full"
                            title={`${d.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${d.count} application${d.count === 1 ? '' : 's'}`}
                        >
                            {isLabeled && (
                                <span className="text-[10px] font-mono font-bold text-slate-600 mb-1">{d.count}</span>
                            )}
                            <div
                                className="w-full max-w-[18px] rounded-t-md bg-cyan-500 hover:bg-cyan-600 transition-colors"
                                style={{ height: `${heightPct}%` }}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-400">
                <span>{daily[0].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span>{daily[daily.length - 1].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
        </div>
    );
};

const HEATMAP_WEEKS = 12;
// Sequential single-hue ramp (light -> dark), monotonic lightness — see the
// dataviz skill's marks-and-anatomy.md "sequential = one hue" rule. The
// categorical CVD-separation checks in validate_palette.js don't apply to a
// sequential ramp (only lightness monotonicity does, which this satisfies).
const HEATMAP_BUCKET_STYLE = ['bg-slate-100', 'bg-cyan-200', 'bg-cyan-400', 'bg-cyan-600', 'bg-cyan-800'];
const heatmapBucket = (count: number, max: number): number => {
    if (count === 0) return 0;
    if (max <= 1) return 1;
    const ratio = count / max;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
};

/** GitHub-style calendar heatmap of applications received per day over the
 * trailing HEATMAP_WEEKS weeks — real data bucketed client-side from
 * applicationsSummary, same toLocalDayKey convention as the trend chart (see
 * its comment on the timezone bug this avoids). Hover shows a native-title
 * tooltip per cell, matching the hover convention already used by the other
 * two charts on this dashboard. */
const ApplicationsHeatmap: React.FC<{ weeks: { date: Date; count: number }[][] }> = ({ weeks }) => {
    const allDays = weeks.flat();
    const total = allDays.reduce((sum, d) => sum + d.count, 0);
    const max = Math.max(1, ...allDays.map(d => d.count));
    const activeDays = allDays.filter(d => d.count > 0).length;

    const monthLabels = weeks.map((week, i) => {
        const firstOfMonth = week.find(d => d.date.getDate() === 1);
        if (!firstOfMonth) return null;
        if (i === 0) return null; // avoid a truncated label on the very first column
        return firstOfMonth.date.toLocaleDateString(undefined, { month: 'short' });
    });

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-5">
                <div>
                    <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Application Activity</h3>
                    <p className="text-xs text-slate-400">{total} application{total === 1 ? '' : 's'} across {activeDays} active day{activeDays === 1 ? '' : 's'} — last {HEATMAP_WEEKS} weeks</p>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                <div className="flex flex-col justify-between text-[9px] font-mono text-slate-400 pt-4 pr-1 flex-shrink-0">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                </div>
                <div className="flex gap-1">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-1">
                            <span className="block h-3 text-[9px] font-mono text-slate-400 leading-3 whitespace-nowrap">{monthLabels[wi] ?? ''}</span>
                            {week.map((d, di) => {
                                const bucket = heatmapBucket(d.count, max);
                                return (
                                    <div
                                        key={di}
                                        title={`${d.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}: ${d.count} application${d.count === 1 ? '' : 's'}`}
                                        className={`h-3 w-3 rounded-sm ${HEATMAP_BUCKET_STYLE[bucket]} hover:ring-2 hover:ring-cyan-400 transition-all`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 mt-4 text-[10px] font-mono text-slate-400">
                <span>Less</span>
                {HEATMAP_BUCKET_STYLE.map((cls, i) => (
                    <div key={i} className={`h-3 w-3 rounded-sm ${cls}`} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
};

const EmployerDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState<View>('DASHBOARD');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
    // Powers the dashboard's real metrics/charts (see the Dashboard view
    // below) — every application across this employer's jobs, each with a
    // status, timestamp, and the applicant's flattened skills.
    const [applicationsSummary, setApplicationsSummary] = useState<EmployerApplicationRecord[]>([]);
    const [workers, setWorkers] = useState<WorkerProfile[]>([]);
    // Maps worker user_id -> {applicationId, status} for the job currently
    // being viewed in the Applicants tab. getJobApplicants only returns
    // WorkerProfile rows (no application id), so this small side lookup is
    // what lets Shortlist/Reject persist against the right applications row.
    const [applicantMeta, setApplicantMeta] = useState<Map<string, { applicationId: string; status: Application['status'] }>>(new Map());
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    // Applicant Pipeline drill-down: Status -> Jobs (modal) -> Applicants
    // (the existing per-job Applicants view, pre-filtered to this status).
    const [pipelineDrilldownStatus, setPipelineDrilldownStatus] = useState<Application['status'] | null>(null);
    const [applicantsStatusFilter, setApplicantsStatusFilter] = useState<Application['status'] | null>(null);

    // Controlled state for the New/Edit Job form (replaces the old
    // document.getElementById reads used by the AI-generate flow).
    const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);

    // New state for tabs and profile
    const [activeTab, setActiveTab] = useState<'jobs' | 'profile' | 'search'>('jobs');
    const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // CSV Import State
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvImportStatus, setCsvImportStatus] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
    const [isImporting, setIsImporting] = useState(false);

    // Translations re-import (the other half of the async translation
    // workflow — see handleExportTranslationsCsv above).
    const [showTranslationsModal, setShowTranslationsModal] = useState(false);
    const [translationsFile, setTranslationsFile] = useState<File | null>(null);
    const [translationsImportStatus, setTranslationsImportStatus] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
    const [isImportingTranslations, setIsImportingTranslations] = useState(false);

    // AI Generation State
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiDescription, setAiDescription] = useState('');
    const [aiSkills, setAiSkills] = useState<string[]>([]);

    const { showToast } = useToast();
    const [processingAction, setProcessingAction] = useState<string | null>(null);

    // Country Dropdown State
    const [country, setCountry] = useState('United States');
    const [currency, setCurrency] = useState(getCurrencyForCountry('United States'));
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Update currency when country changes
    useEffect(() => {
        const newCurrency = getCurrencyForCountry(country);
        setCurrency(newCurrency);
    }, [country]);

    // Load Profile and Jobs
    useEffect(() => {
        const loadData = async () => {
            if (user) {
                setFetchError(null);
                try {
                    // Only fetch jobs list if we are on the main dashboard view
                    if (view === 'DASHBOARD') {
                        setIsLoading(true);
                        console.log("Loading employer data for user:", user.id);

                        // Load Profile (we can load this once, but reloading ensures freshness)
                        const profileData = await getEmployerProfile(user.id);
                        console.log("Profile data loaded:", profileData);
                        setEmployerProfile(profileData);

                        // Load Jobs
                        const jobsData = await getJobs({ employerId: user.id });
                        console.log("Jobs loaded in Dashboard:", jobsData.length);
                        setJobs(jobsData);
                        const jobIds = jobsData.map(j => j.id);
                        setApplicantCounts(await getApplicantCounts(jobIds));
                        setApplicationsSummary(await getEmployerApplicationsSummary(jobIds));
                    }
                } catch (err: any) {
                    console.error("Failed to load dashboard data:", err);
                    setFetchError(err.message || "Failed to load jobs. Check database permissions.");
                } finally {
                    if (view === 'DASHBOARD') setIsLoading(false);
                }
            }
        };
        loadData();
    }, [user, view]); // Reload when view changes (e.g. after add/edit which resets view to DASHBOARD)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Generate AI description and skills
    const handleGenerateAI = async () => {
        const title = jobForm.title;

        if (!title || title.trim() === '') {
            showToast('Please enter a job title first', 'error');
            return;
        }

        setIsGeneratingAI(true);
        try {
            const company = employerProfile?.company_name || 'My Company';
            console.log("Generating AI job details...");
            const aiDetails = await generateJobWithAI(title, company);
            console.log("AI Details received:", aiDetails);

            setAiDescription(aiDetails.description || '');
            setAiSkills(aiDetails.required_skills || []);

            // Update the controlled form fields directly (no DOM reads/writes)
            setJobForm(prev => ({
                ...prev,
                description: aiDetails.description || '',
                required_skills: (aiDetails.required_skills || []).join(', '),
            }));

        } catch (error) {
            console.error("Error generating AI content:", error);
            showToast("Failed to generate AI content. Please try again.", 'error');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);

        try {
            const title = jobForm.title;
            const company = employerProfile?.company_name || 'My Company';
            const location = jobForm.location;
            const manualDescription = jobForm.description;
            const manualSkills = jobForm.required_skills;

            // Safe parsing for salary so we never send NaN to the DB.
            const salary_min = jobForm.salary_min ? parseInt(jobForm.salary_min, 10) : 0;
            const salary_max = jobForm.salary_max ? parseInt(jobForm.salary_max, 10) : 0;

            if (isNaN(salary_min) || isNaN(salary_max)) {
                showToast("Please enter valid numbers for salary.", 'error');
                setIsLoading(false);
                return;
            }

            let description = manualDescription;
            let required_skills: string[] = [];

            // If manual description/skills are provided, use them
            if (manualDescription && manualDescription.trim() !== '') {
                description = manualDescription;
            }

            if (manualSkills && manualSkills.trim() !== '') {
                required_skills = manualSkills.split(',').map(s => s.trim()).filter(Boolean);
            }

            // If no manual content provided, generate with AI
            if (!description || description.trim() === '' || required_skills.length === 0) {
                console.log("Generating AI job details...");
                const aiDetails = await generateJobWithAI(title, company);
                console.log("AI Details received:", aiDetails);

                if (!description || description.trim() === '') {
                    description = aiDetails.description || 'Description not available.';
                }
                if (required_skills.length === 0) {
                    required_skills = aiDetails.required_skills || [];
                }
            }

            const qualifying_questions = jobForm.qualifying_questions
                .split('\n')
                .map(q => q.trim())
                .filter(Boolean)
                .slice(0, 3);

            const available_positions = jobForm.available_positions.trim()
                ? parseInt(jobForm.available_positions, 10)
                : undefined;
            if (available_positions !== undefined && (isNaN(available_positions) || available_positions < 1)) {
                showToast('Available positions must be a whole number of 1 or more.', 'error');
                setIsLoading(false);
                return;
            }

            const newJob: Omit<Job, 'id'> = {
                employer_id: user.id,
                employer_name: company,
                title,
                description,
                required_skills,
                status: 'Active',
                location,
                country,
                salary_min,
                salary_max,
                currency: currency.code, // Add currency code
                shift_schedule: jobForm.shift_schedule.trim() || undefined,
                perks: jobForm.perks.trim() || undefined,
                whatsapp_number: jobForm.whatsapp_number.trim() || undefined,
                qualifying_questions,
                transport_provided: jobForm.transport_provided,
                transport_details: jobForm.transport_details.trim() || undefined,
                accommodation_provided: jobForm.accommodation_provided,
                accommodation_details: jobForm.accommodation_details.trim() || undefined,
                available_positions,
            };

            console.log("Creating job in DB:", newJob);
            await createJob(newJob);
            console.log("Job created successfully");

            // Reset view to dashboard which triggers a reload
            setJobForm(EMPTY_JOB_FORM);
            setView('DASHBOARD');
        } catch (error: any) {
            console.error("Error creating job:", error);
            // createJob throws a plain Error (e.g. "Maximum salary cannot be
            // lower than minimum salary.") for both client- and DB-level
            // validation — surface its message as-is instead of a raw
            // exception dump.
            showToast(error.message || 'Failed to create job. Please try again.', 'error');
            setIsLoading(false); // Stop loading if error keeps us on same page
        }
    };

    const handleUpdateJob = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedJob) return;
        setIsLoading(true);

        try {
            const salary_min = jobForm.salary_min ? parseInt(jobForm.salary_min, 10) : 0;
            const salary_max = jobForm.salary_max ? parseInt(jobForm.salary_max, 10) : 0;

            if (isNaN(salary_min) || isNaN(salary_max)) {
                showToast("Please enter valid numbers for salary.", 'error');
                setIsLoading(false);
                return;
            }

            const available_positions = jobForm.available_positions.trim()
                ? parseInt(jobForm.available_positions, 10)
                : undefined;
            if (available_positions !== undefined && (isNaN(available_positions) || available_positions < 1)) {
                showToast('Available positions must be a whole number of 1 or more.', 'error');
                setIsLoading(false);
                return;
            }

            const updatedData: Partial<Job> = {
                title: jobForm.title,
                location: jobForm.location,
                country: country,
                salary_min,
                salary_max,
                currency: currency.code, // Add currency code
                description: jobForm.description,
                required_skills: jobForm.required_skills.split(',').map(s => s.trim()).filter(Boolean),
                shift_schedule: jobForm.shift_schedule.trim() || undefined,
                perks: jobForm.perks.trim() || undefined,
                whatsapp_number: jobForm.whatsapp_number.trim() || undefined,
                qualifying_questions: jobForm.qualifying_questions
                    .split('\n')
                    .map(q => q.trim())
                    .filter(Boolean)
                    .slice(0, 3),
                transport_provided: jobForm.transport_provided,
                transport_details: jobForm.transport_details.trim() || undefined,
                accommodation_provided: jobForm.accommodation_provided,
                accommodation_details: jobForm.accommodation_details.trim() || undefined,
                available_positions,
            };

            await updateJob(selectedJob.id, updatedData);
            setSelectedJob(null);
            setJobForm(EMPTY_JOB_FORM);
            setView('DASHBOARD'); // Triggers reload
        } catch (error: any) {
            console.error("Error updating job:", error);
            showToast(error.message || 'Failed to update job. Please try again.', 'error');
            setIsLoading(false);
        }
    };

    const handleStartEdit = (job: Job) => {
        setSelectedJob(job);
        setCountry(job.country); // Set country for the dropdown in edit form
        setJobForm({
            title: job.title,
            location: job.location,
            salary_min: String(job.salary_min ?? ''),
            salary_max: String(job.salary_max ?? ''),
            description: job.description,
            required_skills: (job.required_skills ?? []).join(', '),
            shift_schedule: job.shift_schedule ?? '',
            perks: job.perks ?? '',
            whatsapp_number: job.whatsapp_number ?? '',
            qualifying_questions: (job.qualifying_questions ?? []).join('\n'),
            transport_provided: job.transport_provided ?? false,
            transport_details: job.transport_details ?? '',
            accommodation_provided: job.accommodation_provided ?? false,
            accommodation_details: job.accommodation_details ?? '',
            available_positions: job.available_positions !== undefined ? String(job.available_positions) : '',
        });
        setView('EDIT_JOB');
    };

    const fetchAndShowApplicants = useCallback(async (job: Job, statusFilter: Application['status'] | null = null) => {
        setIsLoading(true);
        setView('APPLICANTS');
        setSelectedJob(job);
        setApplicantsStatusFilter(statusFilter);
        try {
            const applicants = await getJobApplicants(job.id);
            const meta = new Map<string, { applicationId: string; status: Application['status'] }>();
            applicants.forEach((a) => {
                meta.set(a.worker.user_id, { applicationId: a.applicationId, status: a.status });
            });

            setWorkers(applicants.map((a) => a.worker));
            setApplicantMeta(meta);
        } catch (e) {
            console.error("Error fetching applicants:", e);
            setWorkers([]);
            setApplicantMeta(new Map());
        }
        setIsLoading(false);
    }, []);

    const handleShortlist = async (worker: WorkerProfile) => {
        const meta = applicantMeta.get(worker.user_id);
        if (!meta) return;
        if (!window.confirm(`Shortlist ${worker.full_name} for this position?`)) return;

        setProcessingAction(worker.id);
        try {
            await updateApplicationStatus(meta.applicationId, 'Shortlisted');
            setApplicantMeta(prev => new Map(prev).set(worker.user_id, { ...meta, status: 'Shortlisted' }));
            showToast(`${worker.full_name} has been shortlisted! Check your shortlist to contact them.`, 'success');
        } catch (error: any) {
            console.error("Error shortlisting applicant:", error);
            showToast(error.message || 'Failed to shortlist applicant. Please try again.', 'error');
        } finally {
            setProcessingAction(null);
        }
    };

    const handleHire = async (worker: WorkerProfile) => {
        const meta = applicantMeta.get(worker.user_id);
        if (!meta) return;
        if (!window.confirm(`Mark ${worker.full_name} as hired? This fills one position on this job and can't be undone from here.`)) return;

        setProcessingAction(`hire-${worker.id}`);
        try {
            await updateApplicationStatus(meta.applicationId, 'Hired');
            setApplicantMeta(prev => new Map(prev).set(worker.user_id, { ...meta, status: 'Hired' }));
            showToast(`${worker.full_name} marked as hired.`, 'success');
            // positions_filled is server-maintained (DB trigger) — refresh the
            // job list so the "X of Y filled" count on the dashboard is current.
            if (user) {
                const jobsData = await getJobs({ employerId: user.id });
                setJobs(jobsData);
            }
        } catch (error: any) {
            console.error("Error hiring applicant:", error);
            showToast(error.message || 'Failed to mark applicant as hired. Please try again.', 'error');
        } finally {
            setProcessingAction(null);
        }
    };

    const handleReject = async (worker: WorkerProfile) => {
        const meta = applicantMeta.get(worker.user_id);
        if (!meta) return;
        if (!window.confirm(`Are you sure you want to reject ${worker.full_name}'s application?`)) return;

        setProcessingAction(`reject-${worker.id}`);
        try {
            await updateApplicationStatus(meta.applicationId, 'Rejected');
            showToast(`${worker.full_name}'s application has been rejected.`, 'error');
            // Remove from the pipeline view with a brief delay, matching the
            // previous animation-out behavior.
            setTimeout(() => {
                setWorkers(prev => prev.filter(w => w.id !== worker.id));
            }, 500);
        } catch (error: any) {
            console.error("Error rejecting applicant:", error);
            showToast(error.message || 'Failed to reject applicant. Please try again.', 'error');
        } finally {
            setProcessingAction(null);
        }
    };

    const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
        try {
            await updateJob(jobId, { status: newStatus });
            setJobs(prevJobs =>
                prevJobs.map(job =>
                    job.id === jobId ? { ...job, status: newStatus } : job
                )
            );
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Failed to update status. Check permissions.", 'error');
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        if (window.confirm('Are you sure you want to permanently delete this job posting? This action cannot be undone.')) {
            try {
                await deleteJob(jobId);
                setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
            } catch (error) {
                console.error("Error deleting job:", error);
                showToast("Failed to delete job. Check permissions.", 'error');
            }
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const yearFoundedValue = formData.get('year_founded') as string;

            let logoUrl = employerProfile?.company_logo_url;
            if (logoFile) {
                logoUrl = await uploadFile('employer-logos', user.id, logoFile);
            }

            // Automatically prepend https:// if missing
            let websiteUrl = formData.get('website_url') as string;
            if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
                websiteUrl = `https://${websiteUrl}`;
            }

            // Construct object carefully to avoid 'undefined' values which crash Firestore
            const newProfile: any = {
                id: employerProfile?.id || user.id,
                user_id: user.id,
                company_name: formData.get('company_name') as string,
                description: formData.get('description') as string || '',
                website_url: websiteUrl || '',
                phone: formData.get('phone') as string || '',
                industry: formData.get('industry') as string || '',
                company_size: formData.get('company_size') as string || '',
                status: employerProfile?.status || 'Active',
            };

            // Only add numeric fields if they have valid values
            if (yearFoundedValue) {
                const parsedYear = parseInt(yearFoundedValue, 10);
                if (!isNaN(parsedYear)) {
                    newProfile.year_founded = parsedYear;
                }
            }

            // Only add logo URL if it exists (either new upload or existing)
            if (logoUrl) {
                newProfile.company_logo_url = logoUrl;
            }

            await saveEmployerProfile(newProfile as EmployerProfile);
            setEmployerProfile(newProfile);
            setIsEditingProfile(false);
            setLogoFile(null);
        } catch (error: any) {
            console.error("Error saving profile:", error);
            showToast(`Failed to save profile: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const CSV_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB cap on bulk job-import files

    const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > CSV_MAX_SIZE_BYTES) {
                showToast('CSV file is too large. Please keep it under 2MB.', 'error');
                e.target.value = '';
                return;
            }
            setCsvFile(file);
        }
    };

    // Real CSV parsing via papaparse — the old line.split(',') /
    // line.split('\n') approach broke on any comma, quote, or embedded
    // newline inside a field (e.g. a description containing a comma).
    const parseCsvFile = (file: File): Promise<Record<string, string>[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse<Record<string, string>>(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        const first = results.errors[0];
                        reject(new Error(`CSV parse error on row ${(first.row ?? 0) + 2}: ${first.message}`));
                        return;
                    }
                    if (results.data.length === 0) {
                        reject(new Error('CSV file must contain at least a header row and one data row'));
                        return;
                    }
                    resolve(results.data);
                },
                error: (error: Error) => reject(error),
            });
        });
    };

    const handleCsvImport = async () => {
        if (!csvFile) {
            showToast('Please select a CSV file first', 'error');
            return;
        }

        if (!user) {
            showToast('You must be logged in to import jobs', 'error');
            return;
        }

        if (csvFile.size > CSV_MAX_SIZE_BYTES) {
            showToast('CSV file is too large. Please keep it under 2MB.', 'error');
            return;
        }

        setIsImporting(true);
        setCsvImportStatus({ success: 0, failed: 0, errors: [] });

        try {
            const parsedJobs = await parseCsvFile(csvFile);
            let successCount = 0;
            let failedCount = 0;
            const errors: string[] = [];

            for (let i = 0; i < parsedJobs.length; i++) {
                const row = parsedJobs[i];

                try {
                    // Validate required fields
                    if (!row.title || !row.location || !row.country) {
                        throw new Error(`Row ${i + 2}: Missing required fields (title, location, or country)`);
                    }

                    // Parse salary values
                    const salary_min = parseInt(row.salary_min) || 0;
                    const salary_max = parseInt(row.salary_max) || 0;

                    if (isNaN(salary_min) || isNaN(salary_max)) {
                        throw new Error(`Row ${i + 2}: Invalid salary values`);
                    }

                    // Parse required_skills (comma-separated in CSV)
                    const required_skills = row.required_skills
                        ? row.required_skills.split(';').map((s: string) => s.trim()).filter(Boolean)
                        : [];

                    // Generate AI description if not provided
                    let description = row.description || '';
                    if (!description) {
                        try {
                            const aiDetails = await generateJobWithAI(
                                row.title,
                                employerProfile?.company_name || 'Company'
                            );
                            description = aiDetails.description || 'No description available';

                            // Use AI-generated skills if none provided
                            if (required_skills.length === 0 && aiDetails.required_skills) {
                                required_skills.push(...aiDetails.required_skills);
                            }
                        } catch (aiError) {
                            console.warn(`AI generation failed for row ${i + 2}, using default`);
                            description = `Position for ${row.title}`;
                        }
                    }

                    const newJob: Omit<Job, 'id'> = {
                        employer_id: user.id,
                        employer_name: employerProfile?.company_name || 'My Company',
                        title: row.title,
                        description,
                        required_skills,
                        status: 'Active',
                        location: row.location,
                        country: row.country,
                        salary_min,
                        salary_max
                    };

                    await createJob(newJob);
                    successCount++;
                } catch (error: any) {
                    failedCount++;
                    errors.push(error.message || `Row ${i + 2}: Unknown error`);
                }
            }

            setCsvImportStatus({ success: successCount, failed: failedCount, errors });

            // Reload jobs list
            if (successCount > 0) {
                const jobsData = await getJobs({ employerId: user.id });
                setJobs(jobsData);
            }

        } catch (error: any) {
            showToast(`Failed to parse CSV: ${error.message}`, 'error');
        } finally {
            setIsImporting(false);
        }
    };

    const downloadSampleCsv = () => {
        const sampleCsv = `title,location,country,salary_min,salary_max,description,required_skills
Senior Plumber,San Francisco,United States,60000,80000,Experienced plumber needed for commercial projects,Pipe Installation;Leak Detection;Blueprint Reading
Electrician,New York,United States,55000,75000,Licensed electrician for residential work,Wiring;Circuit Installation;Safety Compliance
Welder,Houston,United States,50000,70000,Certified welder for industrial projects,MIG Welding;TIG Welding;Metal Fabrication`;

        const blob = new Blob([sampleCsv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'job_import_sample.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const TRANSLATIONS_CSV_MAX_SIZE_BYTES = 5 * 1024 * 1024; // wider than job-import: N jobs x 5 languages

    const handleTranslationsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > TRANSLATIONS_CSV_MAX_SIZE_BYTES) {
                showToast('CSV file is too large. Please keep it under 5MB.', 'error');
                e.target.value = '';
                return;
            }
            setTranslationsFile(file);
        }
    };

    const parseTranslationsCsvFile = (file: File): Promise<Record<string, string>[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse<Record<string, string>>(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        const first = results.errors[0];
                        reject(new Error(`CSV parse error on row ${(first.row ?? 0) + 2}: ${first.message}`));
                        return;
                    }
                    if (results.data.length === 0) {
                        reject(new Error('CSV file must contain at least a header row and one data row'));
                        return;
                    }
                    resolve(results.data);
                },
                error: (error: Error) => reject(error),
            });
        });
    };

    /**
     * Re-imports a translations CSV (see handleExportTranslationsCsv). Rows
     * are grouped by job_id first — a job's translations column is one jsonb
     * write, not one write per language, so every row for the same job is
     * merged in memory before a single updateJob call, and a language with
     * both title and description left blank is skipped rather than
     * clobbering an existing translation with empty strings.
     */
    const handleTranslationsCsvImport = async () => {
        if (!translationsFile) {
            showToast('Please select a CSV file first', 'error');
            return;
        }
        if (!user) {
            showToast('You must be logged in to import translations', 'error');
            return;
        }

        setIsImportingTranslations(true);
        setTranslationsImportStatus({ success: 0, failed: 0, errors: [] });

        try {
            const rows = await parseTranslationsCsvFile(translationsFile);
            const byJob = new Map<string, Record<string, string>[]>();
            const rowErrors: string[] = [];

            rows.forEach((row, i) => {
                if (!row.job_id || !row.language_code) {
                    rowErrors.push(`Row ${i + 2}: missing job_id or language_code`);
                    return;
                }
                if (!(row.title || '').trim() && !(row.description || '').trim()) {
                    return; // nothing translated for this language yet — skip, don't overwrite
                }
                if (!byJob.has(row.job_id)) byJob.set(row.job_id, []);
                byJob.get(row.job_id)!.push(row);
            });

            let successCount = 0;
            let failedCount = rowErrors.length;
            const errors = [...rowErrors];

            for (const [jobId, jobRows] of byJob) {
                const job = jobs.find(j => j.id === jobId);
                if (!job) {
                    failedCount += jobRows.length;
                    errors.push(`job_id ${jobId}: not found among your job postings`);
                    continue;
                }
                try {
                    const merged = { ...(job.translations ?? {}) };
                    jobRows.forEach(row => {
                        merged[row.language_code] = {
                            title: row.title || undefined,
                            description: row.description || undefined,
                            required_skills: row.required_skills
                                ? row.required_skills.split(';').map(s => s.trim()).filter(Boolean)
                                : undefined,
                            shift_schedule: row.shift_schedule || undefined,
                            perks: row.perks || undefined,
                            qualifying_questions: row.qualifying_questions
                                ? row.qualifying_questions.split('\n').map(s => s.trim()).filter(Boolean)
                                : undefined,
                        };
                    });
                    await updateJob(jobId, { translations: merged });
                    successCount += jobRows.length;
                } catch (error: any) {
                    failedCount += jobRows.length;
                    errors.push(`"${job.title}": ${error.message || 'failed to save translations'}`);
                }
            }

            setTranslationsImportStatus({ success: successCount, failed: failedCount, errors });

            if (successCount > 0 && user) {
                const jobsData = await getJobs({ employerId: user.id });
                setJobs(jobsData);
            }
        } catch (error: any) {
            showToast(`Failed to parse CSV: ${error.message}`, 'error');
        } finally {
            setIsImportingTranslations(false);
        }
    };

    /** Triggers a browser download for CSV text — shared by both exports below. */
    const downloadCsvText = (csvText: string, filename: string) => {
        const blob = new Blob([csvText], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    /**
     * Exports every one of this employer's jobs x the curated language list
     * as a translations template: one row per (job, language) pair,
     * pre-filled with any translation already on file. This — not an in-app
     * LLM call — is the hand-off point for the async translation workflow:
     * the employer runs this file through an LLM offline (a few times a
     * week) and re-imports it via handleTranslationsCsvImport below.
     */
    const handleExportTranslationsCsv = () => {
        if (jobs.length === 0) {
            showToast('No jobs to export yet.', 'error');
            return;
        }
        const rows: JobTranslationsCsvRow[] = [];
        jobs.forEach(job => {
            TRANSLATION_LANGUAGES.forEach(({ code }) => {
                const existing = job.translations?.[code];
                rows.push({
                    job_id: job.id,
                    job_title: job.title,
                    language_code: code,
                    title: existing?.title ?? '',
                    description: existing?.description ?? '',
                    required_skills: (existing?.required_skills ?? []).join(';'),
                    shift_schedule: existing?.shift_schedule ?? '',
                    perks: existing?.perks ?? '',
                    qualifying_questions: (existing?.qualifying_questions ?? []).join('\n'),
                });
            });
        });
        downloadCsvText(Papa.unparse(rows), 'job_translations.csv');
    };

    const CountryDropdown = () => {
        const filteredCountries = countries.filter(
            c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.dial_code.includes(searchTerm)
        );

        const handleCountrySelect = (c: Country) => {
            setCountry(c.name);
            setIsDropdownOpen(false);
            setSearchTerm('');
        };

        return (
            <div className="relative" ref={dropdownRef}>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white text-left"
                >
                    <span className="flex justify-between items-center">
                        <span>{country}</span>
                        <span>&#9662;</span>
                    </span>
                </button>
                {isDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <ul>
                            {filteredCountries.map(c => (
                                <li key={c.code}>
                                    <button
                                        type="button"
                                        onClick={() => handleCountrySelect(c)}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        {c.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )
    }

    const JobStatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
        const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
        const statusClasses = {
            Active: "bg-green-100 text-green-800",
            'On Hold': "bg-yellow-100 text-yellow-800",
            Closed: "bg-gray-100 text-gray-800",
        };
        return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
    };

    const JobStatusControl: React.FC<{ job: Job }> = ({ job }) => {
        const buttonClasses = "text-xs font-medium py-1 px-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
        const activeClasses = "bg-green-200 text-green-900 hover:bg-green-300";
        const onHoldClasses = "bg-yellow-200 text-yellow-900 hover:bg-yellow-300";
        const closedClasses = "bg-gray-200 text-gray-900 hover:bg-gray-300";

        return (
            <div className="flex items-center gap-2">
                <button onClick={() => handleStatusChange(job.id, 'Active')} disabled={job.status === 'Active'} className={`${buttonClasses} ${activeClasses}`}>Active</button>
                <button onClick={() => handleStatusChange(job.id, 'On Hold')} disabled={job.status === 'On Hold'} className={`${buttonClasses} ${onHoldClasses}`}>On Hold</button>
                <button onClick={() => handleStatusChange(job.id, 'Closed')} disabled={job.status === 'Closed'} className={`${buttonClasses} ${closedClasses}`}>Close</button>
            </div>
        )
    };

    const renderJobsList = () => {
        if (fetchError) {
            return (
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Jobs</h2>
                    <p className="text-gray-600 mb-4">{fetchError}</p>
                    <button onClick={() => { setView('NEW_JOB'); setTimeout(() => setView('DASHBOARD'), 100); }} className="bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700">Retry</button>
                </div>
            )
        }

        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">My Job Postings</h2>
                    {isLoading && <Spinner size="sm" />}
                </div>

                {jobs.length === 0 && !isLoading ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs posted</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by posting a new job.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {jobs.map(job => (
                            <div key={job.id} className="bg-gray-50 p-4 rounded-lg ">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div className="mb-4 sm:mb-0">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                                            <JobStatusBadge status={job.status} />
                                        </div>
                                        <p className="text-sm text-gray-500">{job.employer_name} &middot; {job.location}, {job.country}</p>
                                        <p className="text-sm font-semibold text-emerald-600 mt-1">
                                            {formatSalaryRange(job.salary_min, job.salary_max, job.country)} / yr
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {applicantCounts[job.id] ?? 0} applicant{(applicantCounts[job.id] ?? 0) === 1 ? '' : 's'}
                                            {job.available_positions !== undefined && (
                                                <> &middot; {job.positions_filled ?? 0} of {job.available_positions} position{job.available_positions === 1 ? '' : 's'} filled</>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button onClick={() => fetchAndShowApplicants(job)} className="bg-emerald-100 text-emerald-800 text-sm font-bold py-2 px-3 rounded-md hover:bg-emerald-200 transition-colors">View Applicants</button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <JobStatusControl job={job} />
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleStartEdit(job)} className="text-sm font-medium text-emerald-600 hover:text-emerald-500">Edit</button>
                                        <button onClick={() => handleDeleteJob(job.id)} className="text-sm font-medium text-red-600 hover:text-red-500">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderProfileContent = () => {
        if (isLoading) {
            return <div className="text-center py-10"><Spinner size="lg" /><p className="mt-2 text-gray-500">Loading profile...</p></div>;
        }

        if (isEditingProfile) {
            return (
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{employerProfile ? 'Edit' : 'Create'} Company Profile</h2>
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                                <div className="mt-1 flex items-center space-x-4">
                                    <span className="inline-block h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                                        {logoPreview ? (
                                            <img className="h-full w-full object-contain" src={logoPreview} alt="Logo preview" />
                                        ) : (
                                            <svg className="h-full w-full text-gray-300 p-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path><path d="M14.14 11.86l-3 3.87-2.14-2.58-3 3.87H18z"></path>
                                            </svg>
                                        )}
                                    </span>
                                    <label htmlFor="logo_upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                                        <span>Change</span>
                                        <input id="logo_upload" name="logo_upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoChange} />
                                    </label>
                                </div>
                            </div>
                            <div className="md:col-span-1"></div> {/* Spacer */}
                            <div>
                                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name</label>
                                <input type="text" name="company_name" id="company_name" defaultValue={employerProfile?.company_name} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="website_url" className="block text-sm font-medium text-gray-700">Website URL</label>
                                <input type="text" name="website_url" id="website_url" defaultValue={employerProfile?.website_url} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="www.example.com" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                                <input type="tel" name="phone" id="phone" defaultValue={employerProfile?.phone} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="+1 (555) 123-4567" />
                            </div>
                            <div>
                                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">Industry</label>
                                <input type="text" name="industry" id="industry" defaultValue={employerProfile?.industry} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="e.g., Construction" />
                            </div>
                            <div>
                                <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">Company Size</label>
                                <select name="company_size" id="company_size" defaultValue={employerProfile?.company_size || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                                    <option value="">Select a size</option>
                                    <option value="1-10 employees">1-10 employees</option>
                                    <option value="11-50 employees">11-50 employees</option>
                                    <option value="51-200 employees">51-200 employees</option>
                                    <option value="201-500 employees">201-500 employees</option>
                                    <option value="501+ employees">501+ employees</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="year_founded" className="block text-sm font-medium text-gray-700">Year Founded</label>
                                <input type="number" name="year_founded" id="year_founded" defaultValue={employerProfile?.year_founded} min="1800" max={new Date().getFullYear()} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="e.g., 2010" />
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Company Description</label>
                            <textarea name="description" id="description" rows={4} defaultValue={employerProfile?.description} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="Tell us about your company..."></textarea>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={() => setIsEditingProfile(false)} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                            <button type="submit" disabled={isLoading} className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700">
                                {isLoading ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            );
        }

        if (employerProfile) {
            return (
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center space-x-4">
                            <span className="inline-block h-20 w-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                {employerProfile.company_logo_url ? (
                                    <img className="h-full w-full object-contain" src={employerProfile.company_logo_url} alt="Company Logo" />
                                ) : (
                                    <svg className="h-full w-full text-gray-300 p-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path><path d="M14.14 11.86l-3 3.87-2.14-2.58-3 3.87H18z"></path>
                                    </svg>
                                )}
                            </span>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">{employerProfile.company_name}</h2>
                            </div>
                        </div>
                        <button onClick={() => {
                            setLogoPreview(employerProfile.company_logo_url || null);
                            setIsEditingProfile(true);
                        }} className="text-sm font-medium text-emerald-600 hover:text-emerald-500 self-start mt-2">Edit Profile</button>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">About Us</h3>
                        <p className="mt-2 text-gray-600 whitespace-pre-wrap">{employerProfile.description || 'No description provided.'}</p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                        {employerProfile.website_url && (
                            <div className="bg-gray-50 p-4 rounded-md">
                                <p className="text-sm text-gray-500">Website</p>
                                <a href={employerProfile.website_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-lg text-emerald-600 hover:underline break-words">{employerProfile.website_url}</a>
                            </div>
                        )}
                        {employerProfile.phone && (
                            <div className="bg-gray-50 p-4 rounded-md">
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-semibold text-lg">{employerProfile.phone}</p>
                            </div>
                        )}
                        {employerProfile.industry && (
                            <div className="bg-gray-50 p-4 rounded-md">
                                <p className="text-sm text-gray-500">Industry</p>
                                <p className="font-semibold text-lg">{employerProfile.industry}</p>
                            </div>
                        )}
                        {employerProfile.company_size && (
                            <div className="bg-gray-50 p-4 rounded-md">
                                <p className="text-sm text-gray-500">Company Size</p>
                                <p className="font-semibold text-lg">{employerProfile.company_size}</p>
                            </div>
                        )}
                        {employerProfile.year_founded && (
                            <div className="bg-gray-50 p-4 rounded-md">
                                <p className="text-sm text-gray-500">Year Founded</p>
                                <p className="font-semibold text-lg">{employerProfile.year_founded}</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="text-center bg-white p-10 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800">Set Up Your Company Profile</h2>
                <p className="mt-2 text-gray-600">Add your company details to attract the best talent.</p>
                <button onClick={() => {
                    setLogoPreview(null);
                    setIsEditingProfile(true);
                }} className="mt-6 bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-emerald-700 transition-colors">
                    Create Profile
                </button>
            </div>
        );
    };

    // --- Dashboard metrics & charts — computed from real jobs/applications
    // state (loaded in the effect above), not the hardcoded placeholder
    // numbers the bento grid used to show. Recomputed each render rather
    // than memoized: employer-scale data (a handful of jobs/applicants),
    // not worth the extra hook.
    const totalApplicants = applicationsSummary.length;

    const positionsTrackedJobs = jobs.filter(j => j.available_positions !== undefined);
    const positionsFilled = positionsTrackedJobs.reduce((sum, j) => sum + (j.positions_filled ?? 0), 0);
    const positionsAvailable = positionsTrackedJobs.reduce((sum, j) => sum + (j.available_positions ?? 0), 0);

    const jobsById = new Map(jobs.map(j => [j.id, j]));
    const matchPercents = applicationsSummary
        .map(app => {
            const job = jobsById.get(app.job_id);
            if (!job) return null;
            return computeSkillMatch(job.required_skills, flattenWorkerSkills({ skills: app.workerSkills })).percent;
        })
        .filter((p): p is number => p !== null);
    const avgMatchRate = matchPercents.length > 0
        ? Math.round(matchPercents.reduce((sum, p) => sum + p, 0) / matchPercents.length)
        : null;

    const statusCounts = APPLICANT_STATUS_ORDER.map(status => ({
        status,
        count: applicationsSummary.filter(a => a.status === status).length,
    }));

    // Local calendar-day key (YYYY-MM-DD) — deliberately not toISOString(),
    // which reports the UTC date and silently shifts every bucket by a day
    // in any timezone ahead of UTC (local midnight in UTC+8 serializes to
    // the previous day in UTC), dropping applications from the count they
    // actually belong to. Both the bucket keys and each application's own
    // appliedAt are run through this same function, so they compare on
    // the viewer's local calendar day — what "today" actually means to the
    // employer looking at the chart.
    const toLocalDayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const TREND_DAYS = 14;
    const dailyTrend = Array.from({ length: TREND_DAYS }, (_, i) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (TREND_DAYS - 1 - i));
        const dayKey = toLocalDayKey(date);
        const count = applicationsSummary.filter(a => a.appliedAt && toLocalDayKey(new Date(a.appliedAt)) === dayKey).length;
        return { date, count };
    });

    // Calendar heatmap grid: HEATMAP_WEEKS full weeks (Sun-Sat columns),
    // ending on the most recent Saturday on/after today, so every column is
    // a complete week (matches the GitHub-style contribution graph this is
    // modeled on). Same toLocalDayKey bucketing as dailyTrend above.
    const heatmapWeeks = (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // upcoming Saturday
        const totalDays = HEATMAP_WEEKS * 7;
        const days = Array.from({ length: totalDays }, (_, i) => {
            const date = new Date(endOfWeek);
            date.setDate(endOfWeek.getDate() - (totalDays - 1 - i));
            const dayKey = toLocalDayKey(date);
            const count = applicationsSummary.filter(a => a.appliedAt && toLocalDayKey(new Date(a.appliedAt)) === dayKey).length;
            return { date, count };
        });
        const weeks: { date: Date; count: number }[][] = [];
        for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
        return weeks;
    })();

    // Jobs breakdown for the Applicant Pipeline drill-down modal (Status ->
    // Jobs -> Applicants). Only computed when a status row has been clicked.
    const drilldownJobBreakdown = pipelineDrilldownStatus
        ? Array.from(
              applicationsSummary
                  .filter(a => a.status === pipelineDrilldownStatus)
                  .reduce((map, a) => map.set(a.job_id, (map.get(a.job_id) ?? 0) + 1), new Map<string, number>())
          )
              .map(([jobId, count]) => ({ job: jobsById.get(jobId), count }))
              .filter((row): row is { job: Job; count: number } => !!row.job)
              .sort((a, b) => b.count - a.count)
        : [];

    const renderContent = () => {
        switch (view) {
            case 'NEW_JOB':
            case 'EDIT_JOB':
                const isEditing = view === 'EDIT_JOB';
                if (isEditing && !selectedJob) {
                    // Should not happen, but as a safeguard
                    setView('DASHBOARD');
                    return null;
                }
                return (
                    <div>
                        <button onClick={() => setView('DASHBOARD')} className="mb-6 text-sm font-medium text-emerald-600 hover:text-emerald-500">&larr; Back to Dashboard</button>
                        <div className="bg-white p-8 rounded-lg shadow-lg">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">{isEditing ? 'Edit Job Posting' : 'Create a New Job Posting'}</h2>
                            <form onSubmit={isEditing ? handleUpdateJob : handleCreateJob} className="space-y-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Job Title</label>
                                    <input type="text" name="title" id="title" required value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} placeholder="e.g., Senior Plumber" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Work Location</label>
                                    <input type="text" name="location" id="location" required value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} placeholder="e.g., San Francisco, CA" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" />
                                </div>
                                <CountryDropdown />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="salary_min" className="block text-sm font-medium text-gray-700">
                                            Minimum Salary (Annual) - {currency.symbol} {currency.code}
                                        </label>
                                        <input type="number" name="salary_min" id="salary_min" required value={jobForm.salary_min} onChange={e => setJobForm({ ...jobForm, salary_min: e.target.value })} placeholder={`e.g., 50000`} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="salary_max" className="block text-sm font-medium text-gray-700">
                                            Maximum Salary (Annual) - {currency.symbol} {currency.code}
                                        </label>
                                        <input type="number" name="salary_max" id="salary_max" required value={jobForm.salary_max} onChange={e => setJobForm({ ...jobForm, salary_max: e.target.value })} placeholder={`e.g., 70000`} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" />
                                    </div>
                                </div>

                                {/* Description and Skills - Always visible */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                            Job Description {!isEditing && <span className="text-gray-500">(Optional - AI can generate)</span>}
                                        </label>
                                        {!isEditing && (
                                            <button
                                                type="button"
                                                onClick={handleGenerateAI}
                                                disabled={isGeneratingAI}
                                                className="inline-flex items-center px-3 py-1 border border-emerald-300 text-sm font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isGeneratingAI ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-emerald-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        Generate with AI
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        name="description"
                                        id="description"
                                        rows={6}
                                        value={jobForm.description}
                                        onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                                        placeholder="Enter job description or click 'Generate with AI' to auto-generate..."
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    ></textarea>
                                </div>

                                <div>
                                    <label htmlFor="required_skills" className="block text-sm font-medium text-gray-700">
                                        Required Skills (comma-separated) {!isEditing && <span className="text-gray-500">(Optional - AI can generate)</span>}
                                    </label>
                                    <input
                                        type="text"
                                        name="required_skills"
                                        id="required_skills"
                                        value={jobForm.required_skills}
                                        onChange={e => setJobForm({ ...jobForm, required_skills: e.target.value })}
                                        placeholder="e.g., Plumbing, Pipe Fitting, Blueprint Reading"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Mobile Applicant Essentials — surfaced up top as scannable bullets
                                    on the public job card/detail page, and as a WhatsApp quick-apply
                                    path for candidates without a formatted resume on hand. */}
                                <div className="pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Mobile Applicant Essentials</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Optional, but strongly recommended for shift and site-based roles — most candidates apply from their phone between shifts.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="shift_schedule" className="block text-sm font-medium text-gray-700">Shift Schedule</label>
                                            <input type="text" name="shift_schedule" id="shift_schedule" value={jobForm.shift_schedule} onChange={e => setJobForm({ ...jobForm, shift_schedule: e.target.value })} placeholder="e.g., 12-hour rotating shifts, 6-day week, night allowance" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" />
                                        </div>
                                        <div>
                                            <label htmlFor="perks" className="block text-sm font-medium text-gray-700">Perks & Allowances</label>
                                            <input type="text" name="perks" id="perks" value={jobForm.perks} onChange={e => setJobForm({ ...jobForm, perks: e.target.value })} placeholder="e.g., Daily meal allowance, 1.5x OT, attendance bonus" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" />
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <label htmlFor="available_positions" className="block text-sm font-medium text-gray-700">
                                            Available Positions <span className="text-gray-500">(optional)</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            step={1}
                                            name="available_positions"
                                            id="available_positions"
                                            value={jobForm.available_positions}
                                            onChange={e => setJobForm({ ...jobForm, available_positions: e.target.value })}
                                            placeholder="e.g., 5"
                                            className="mt-1 block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Leave blank if you're not tracking headcount. Marking an applicant "Hired" fills one position; the job auto-closes once all are filled.</p>
                                    </div>

                                    <div className="mt-6">
                                        <label htmlFor="whatsapp_number" className="block text-sm font-medium text-gray-700">
                                            WhatsApp Quick-Apply Number <span className="text-gray-500">(optional)</span>
                                        </label>
                                        <input type="text" name="whatsapp_number" id="whatsapp_number" value={jobForm.whatsapp_number} onChange={e => setJobForm({ ...jobForm, whatsapp_number: e.target.value })} placeholder="e.g., +65 8123 4567" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" />
                                        <p className="mt-1 text-xs text-gray-500">Candidates get a "Message on WhatsApp" button on the job page, pre-filled with their name and this role.</p>
                                    </div>

                                    <div className="mt-6">
                                        <label htmlFor="qualifying_questions" className="block text-sm font-medium text-gray-700">
                                            Qualifying Questions <span className="text-gray-500">(one per line, up to 3)</span>
                                        </label>
                                        <textarea
                                            name="qualifying_questions"
                                            id="qualifying_questions"
                                            rows={3}
                                            value={jobForm.qualifying_questions}
                                            onChange={e => setJobForm({ ...jobForm, qualifying_questions: e.target.value })}
                                            placeholder={'Do you have a valid lifting supervisor certificate?\nCan you start within 14 days?'}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        ></textarea>
                                        <p className="mt-1 text-xs text-gray-500">Shown as a short checklist candidates confirm before applying — replaces the cover letter.</p>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <input type="checkbox" checked={jobForm.transport_provided} onChange={e => setJobForm({ ...jobForm, transport_provided: e.target.checked })} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                                Company Transport Provided
                                            </label>
                                            {jobForm.transport_provided && (
                                                <input type="text" value={jobForm.transport_details} onChange={e => setJobForm({ ...jobForm, transport_details: e.target.value })} placeholder="e.g., Shuttle from Woodlands MRT, 6am/6pm" className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" />
                                            )}
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <input type="checkbox" checked={jobForm.accommodation_provided} onChange={e => setJobForm({ ...jobForm, accommodation_provided: e.target.checked })} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                                Accommodation Provided
                                            </label>
                                            {jobForm.accommodation_provided && (
                                                <input type="text" value={jobForm.accommodation_details} onChange={e => setJobForm({ ...jobForm, accommodation_details: e.target.value })} placeholder="e.g., Dormitory on-site, or housing allowance" className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button type="submit" disabled={isLoading || isGeneratingAI} className="w-full sm:w-auto bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-emerald-700 transition-colors disabled:bg-emerald-300">
                                        {isLoading ? 'Creating...' : isEditing ? 'Update Job' : 'Create Job'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            case 'APPLICANTS': {
                const visibleWorkers = applicantsStatusFilter
                    ? workers.filter(w => applicantMeta.get(w.user_id)?.status === applicantsStatusFilter)
                    : workers;
                return (
                    <div>
                        <button onClick={() => { setView('DASHBOARD'); setWorkers([]); setApplicantsStatusFilter(null); }} className="mb-6 text-sm font-medium text-emerald-600 hover:text-emerald-500">&larr; Back to Dashboard</button>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Applicants for {selectedJob?.title}</h2>
                            {applicantsStatusFilter && (
                                <button
                                    onClick={() => setApplicantsStatusFilter(null)}
                                    className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${APPLICANT_STATUS_STYLE[applicantsStatusFilter]?.bar ?? 'bg-slate-400'} text-white hover:opacity-90 transition-opacity`}
                                    title="Clear filter"
                                >
                                    {applicantsStatusFilter} <span aria-hidden="true">&times;</span>
                                </button>
                            )}
                        </div>
                        {isLoading ? (
                            <div className="text-center py-10"><Spinner size="lg" /><p className="mt-2 text-gray-500">Finding applicants...</p></div>
        ) : visibleWorkers.length === 0 ? (<p className="text-gray-500">{applicantsStatusFilter ? `No ${applicantsStatusFilter.toLowerCase()} applicants for this job.` : 'No applicants found for this job.'}</p>) : (
                            <div>
                                <div className="space-y-4">
                                    {visibleWorkers.map(app => {
                                        const meta = applicantMeta.get(app.user_id);
                                        const isShortlisted = meta?.status === 'Shortlisted';
                                        const isHired = meta?.status === 'Hired';
                                        return (
                                        <div key={app.id} className="bg-white p-4 rounded-lg shadow-md">
                                            <div className="flex items-start">
                                                <div className="ml-4 flex-grow">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-lg">{app.full_name}</h3>
                                                        {isHired && (
                                                            <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">Hired</span>
                                                        )}
                                                        {isShortlisted && (
                                                            <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">Shortlisted</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-emerald-600 font-semibold">{app.trade_or_skill} - {app.experience_years} years total</p>
                                                    <p className="text-xs text-gray-500 mt-1">{app.summary}</p>
                                                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                                        <div className="flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 9a9 9 0 019-9" /></svg>
                                                            <span className="ml-1.5">From: <span className="font-semibold text-gray-800">{app.country_of_origin}</span></span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                            <span className="ml-1.5"><span className="font-semibold text-gray-800">{app.experience_in_country} years</span> exp. in {selectedJob?.country}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-3">
                                                <button
                                                    onClick={() => navigate(`/worker/profile/${app.user_id}`)}
                                                    className="bg-blue-100 text-blue-800 text-xs font-bold py-1 px-3 rounded-md hover:bg-blue-200 transition-colors"
                                                >
                                                    View Skill Passport
                                                </button>
                                                {app.cv_url && (
                                                    <a
                                                        href={app.cv_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-emerald-100 text-emerald-800 text-xs font-bold py-1 px-3 rounded-md hover:bg-emerald-200"
                                                    >
                                                        View CV
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleShortlist(app)}
                                                    disabled={processingAction === app.id || isShortlisted}
                                                    className={`bg-emerald-100 text-emerald-800 text-xs font-bold py-1 px-3 rounded-md hover:bg-emerald-200 transition-all duration-200 disabled:opacity-50 ${processingAction === app.id ? 'cursor-not-allowed animate-pulse' : ''}`}
                                                >
                                                    {processingAction === app.id ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Processing...
                                                        </span>
                                                    ) : isShortlisted ? 'Shortlisted' : 'Shortlist'}
                                                </button>
                                                <button
                                                    onClick={() => handleHire(app)}
                                                    disabled={processingAction === `hire-${app.id}` || isHired}
                                                    className={`bg-blue-100 text-blue-800 text-xs font-bold py-1 px-3 rounded-md hover:bg-blue-200 transition-all duration-200 disabled:opacity-50 ${processingAction === `hire-${app.id}` ? 'cursor-not-allowed animate-pulse' : ''}`}
                                                >
                                                    {processingAction === `hire-${app.id}` ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Processing...
                                                        </span>
                                                    ) : isHired ? 'Hired' : 'Hire'}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(app)}
                                                    disabled={processingAction === `reject-${app.id}`}
                                                    className={`bg-red-100 text-red-800 text-xs font-bold py-1 px-3 rounded-md hover:bg-red-200 transition-all duration-200 ${processingAction === `reject-${app.id}` ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`}
                                                >
                                                    {processingAction === `reject-${app.id}` ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Rejecting...
                                                        </span>
                                                    ) : 'Reject'}
                                                </button>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            case 'DASHBOARD':
            default:
                return (
                    <div className="space-y-8">
                        {/* Header Area */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2 border-b border-slate-200">
                            <div>
                                <span className="font-mono text-xs uppercase tracking-widest text-cyan-700 font-bold">Workspace Intelligence</span>
                                <h1 className="text-3xl font-extrabold text-slate-900 mt-0.5">Employer Dashboard</h1>
                                <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                                    Overview of active requisitions, pipeline metrics, and AI-driven candidate matches powered by EZJOB by LENIX.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <button
                                    onClick={() => setShowCsvModal(true)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded-full transition-colors flex items-center gap-2 border border-slate-300 shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Import CSV
                                </button>
                                <button
                                    onClick={handleExportTranslationsCsv}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded-full transition-colors flex items-center gap-2 border border-slate-300 shadow-sm"
                                    title="Download a CSV template (your jobs x common languages) to translate offline"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export Translations
                                </button>
                                <button
                                    onClick={() => setShowTranslationsModal(true)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded-full transition-colors flex items-center gap-2 border border-slate-300 shadow-sm"
                                    title="Re-upload a translated CSV to publish it on the job pages"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Import Translations
                                </button>
                                <button
                                    onClick={() => { setJobForm(EMPTY_JOB_FORM); setView('NEW_JOB'); }}
                                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs uppercase tracking-wider px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span className="text-base font-bold leading-none">+</span>
                                    New Requisition
                                </button>
                            </div>
                        </div>

                        {/* Metrics Bento Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Metric 1: Active Jobs */}
                            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm border border-slate-800">
                                <div className="flex justify-between items-start">
                                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">Active Jobs</span>
                                    <span className="material-symbols-outlined text-cyan-400 text-[20px]">work</span>
                                </div>
                                <div className="flex items-baseline gap-3 mt-4">
                                    <span className="text-3xl font-extrabold text-white font-mono">{jobs.filter(j => j.status === 'Active').length}</span>
                                    <span className="text-xs text-cyan-400 font-mono">/ {jobs.length} Total</span>
                                </div>
                            </div>

                            {/* Metric 2: Total Applicants — real count across every
                                job (applicationsSummary), Withdrawn excluded. */}
                            <div className="bg-gradient-to-tr from-cyan-900/40 to-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm border border-cyan-800/40">
                                <div className="flex justify-between items-start">
                                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-300 font-bold">Total Applicants</span>
                                    <span className="material-symbols-outlined text-cyan-300 text-[20px]">groups</span>
                                </div>
                                <div className="flex items-baseline gap-3 mt-4">
                                    <span className="text-3xl font-extrabold text-white font-mono">{totalApplicants.toLocaleString()}</span>
                                    <span className="text-xs text-cyan-200 font-mono">across {jobs.length} role{jobs.length === 1 ? '' : 's'}</span>
                                </div>
                            </div>

                            {/* Metric 3: Positions Filled — from jobs.positions_filled
                                / available_positions (server-maintained by a DB
                                trigger on Hire), only counting jobs that actually
                                track a headcount. */}
                            <div className="bg-white p-6 rounded-2xl flex flex-col justify-between shadow-sm border border-slate-200">
                                <div className="flex justify-between items-start">
                                    <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold">Positions Filled</span>
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">task_alt</span>
                                </div>
                                <div className="flex items-baseline gap-2 mt-4">
                                    {positionsTrackedJobs.length > 0 ? (
                                        <>
                                            <span className="text-3xl font-extrabold text-slate-900 font-mono">{positionsFilled}</span>
                                            <span className="text-sm font-semibold text-slate-500">/ {positionsAvailable}</span>
                                        </>
                                    ) : (
                                        <span className="text-lg font-semibold text-slate-400">Not tracked yet</span>
                                    )}
                                </div>
                            </div>

                            {/* Metric 4: Avg. Skill Match — computed live from every
                                current applicant's Skill Passport vs. their job's
                                required_skills (see utils/jobMatch.ts, the same
                                algorithm behind the worker-facing match badge). */}
                            <div className="bg-gradient-to-tr from-fuchsia-950/40 to-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm border border-fuchsia-800/40">
                                <div className="flex justify-between items-start">
                                    <span className="font-mono text-xs uppercase tracking-widest text-fuchsia-400 font-bold">Avg. Skill Match</span>
                                    <span className="material-symbols-outlined text-fuchsia-400 text-[20px]">auto_awesome</span>
                                </div>
                                <div className="flex items-baseline gap-3 mt-4">
                                    <span className="text-3xl font-extrabold text-white font-mono">{avgMatchRate !== null ? `${avgMatchRate}%` : '—'}</span>
                                    <span className="text-xs text-fuchsia-300 font-mono">
                                        {matchPercents.length > 0 ? `${matchPercents.length} applicant${matchPercents.length === 1 ? '' : 's'}` : 'No applicants yet'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Charts — real data from applicationsSummary, not
                            decorative placeholders (see the two components above
                            EmployerDashboard). */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <ApplicationsTrendChart daily={dailyTrend} />
                            <ApplicantStatusChart counts={statusCounts} onStatusClick={setPipelineDrilldownStatus} />
                        </div>

                        <ApplicationsHeatmap weeks={heatmapWeeks} />

                        {/* AI Job Studio Promo Banner */}
                        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-7 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="relative z-10 max-w-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-cyan-400 text-[18px]">auto_awesome</span>
                                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">EZJOB AI Job Studio</span>
                                </div>
                                <h3 className="text-2xl font-extrabold text-white">Automate Your Next Requisition</h3>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                    Generate comprehensive skilled trade job ads with automatic salary benchmarking and skills matching in 10 seconds.
                                </p>
                            </div>
                            <button
                                onClick={() => { setJobForm(EMPTY_JOB_FORM); setView('NEW_JOB'); }}
                                className="relative z-10 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs uppercase tracking-wider px-6 py-3.5 rounded-full font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-lg cursor-pointer"
                            >
                                Launch Studio
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="border-b border-slate-200">
                            <nav className="-mb-px flex space-x-6 sm:space-x-8 font-mono text-xs uppercase" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('jobs')}
                                    className={`${activeTab === 'jobs' ? 'border-cyan-600 text-cyan-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-semibold'} whitespace-nowrap py-3.5 px-1 border-b-2 transition-colors`}
                                >
                                    My Requisitions ({jobs.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`${activeTab === 'profile' ? 'border-cyan-600 text-cyan-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-semibold'} whitespace-nowrap py-3.5 px-1 border-b-2 transition-colors`}
                                >
                                    Company Profile
                                </button>
                                <button
                                    onClick={() => setActiveTab('search')}
                                    className={`${activeTab === 'search' ? 'border-cyan-600 text-cyan-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-semibold'} whitespace-nowrap py-3.5 px-1 border-b-2 transition-colors`}
                                >
                                    Find Verified Workers
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'jobs' && renderJobsList()}
                        {activeTab === 'profile' && renderProfileContent()}
                        {activeTab === 'search' && <SearchWorkersPanel />}
                    </div>
                );
        }
    };

    return (
        <>
            {renderContent()}

            {/* Applicant Pipeline drill-down: Status -> Jobs -> Applicants */}
            {pipelineDrilldownStatus && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setPipelineDrilldownStatus(null)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pipeline-drilldown-title"
                        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-1">
                                <h2 id="pipeline-drilldown-title" className="text-xl font-bold text-gray-900">
                                    {pipelineDrilldownStatus} applicants
                                </h2>
                                <button
                                    onClick={() => setPipelineDrilldownStatus(null)}
                                    aria-label="Close dialog"
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    &times;
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">By requisition — select one to view those applicants.</p>
                            {drilldownJobBreakdown.length === 0 ? (
                                <p className="text-sm text-gray-500 py-4">No {pipelineDrilldownStatus.toLowerCase()} applicants right now.</p>
                            ) : (
                                <div className="space-y-2">
                                    {drilldownJobBreakdown.map(({ job, count }) => (
                                        <button
                                            key={job.id}
                                            onClick={() => {
                                                setPipelineDrilldownStatus(null);
                                                fetchAndShowApplicants(job, pipelineDrilldownStatus);
                                            }}
                                            className="w-full flex items-center justify-between gap-3 text-left bg-gray-50 hover:bg-gray-100 rounded-md px-4 py-3 transition-colors"
                                        >
                                            <span className="font-semibold text-gray-800 text-sm">{job.title}</span>
                                            <span className="flex-shrink-0 text-xs font-mono font-bold bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{count}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Import Modal */}
            {showCsvModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby="csv-import-modal-title" className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 id="csv-import-modal-title" className="text-2xl font-bold text-gray-900">Import Jobs from CSV</h2>
                                <button
                                    onClick={() => { setShowCsvModal(false); setCsvFile(null); setCsvImportStatus({ success: 0, failed: 0, errors: [] }); }}
                                    aria-label="Close dialog"
                                    className="text-gray-400 hover:text-gray-600 p-1">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">CSV Format Requirements</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Your CSV file must include the following columns: <strong>title, location, country, salary_min, salary_max</strong>.
                                    Optional columns: <strong>description, required_skills</strong> (use semicolons to separate multiple skills).
                                </p>
                                <button
                                    onClick={downloadSampleCsv}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Sample CSV
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCsvFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-md cursor-pointer">
                                </input>
                                {csvFile && (
                                    <p className="mt-2 text-sm text-gray-600">
                                        Selected: <span className="font-medium">{csvFile.name}</span>
                                    </p>
                                )}
                            </div>

                            {csvImportStatus.success > 0 || csvImportStatus.failed > 0 ? (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Import Results</h4>
                                    <div className="space-y-2">
                                        {csvImportStatus.success > 0 && (
                                            <p className="text-sm text-green-600">
                                                ✓ Successfully imported {csvImportStatus.success} job(s)
                                            </p>
                                        )}
                                        {csvImportStatus.failed > 0 && (
                                            <div>
                                                <p className="text-sm text-red-600 font-medium">
                                                    ✗ Failed to import {csvImportStatus.failed} job(s)
                                                </p>
                                                {csvImportStatus.errors.length > 0 && (
                                                    <div className="mt-2 max-h-32 overflow-y-auto">
                                                        <p className="text-xs text-gray-600 font-semibold mb-1">Errors:</p>
                                                        {csvImportStatus.errors.map((error, idx) => (
                                                            <p key={idx} className="text-xs text-red-500">• {error}</p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => { setShowCsvModal(false); setCsvFile(null); setCsvImportStatus({ success: 0, failed: 0, errors: [] }); }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCsvImport}
                                    disabled={!csvFile || isImporting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2">
                                    {isImporting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Importing...
                                        </>
                                    ) : (
                                        'Import Jobs'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Translations Import Modal */}
            {showTranslationsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby="translations-import-modal-title" className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 id="translations-import-modal-title" className="text-2xl font-bold text-gray-900">Import Translations</h2>
                                <button
                                    onClick={() => { setShowTranslationsModal(false); setTranslationsFile(null); setTranslationsImportStatus({ success: 0, failed: 0, errors: [] }); }}
                                    aria-label="Close dialog"
                                    className="text-gray-400 hover:text-gray-600 p-1">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">CSV Format</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Start from <strong>Export Translations</strong> — it downloads a CSV with a row per job per language, pre-filled with anything already translated. Fill in <strong>title, description, required_skills</strong> (semicolon-separated), <strong>shift_schedule, perks</strong> and <strong>qualifying_questions</strong> (newline-separated) for each language, then re-upload the same file here. Rows left blank for a language are skipped, not overwritten. Never edit <strong>job_id</strong> or <strong>language_code</strong>.
                                </p>
                                <button
                                    onClick={handleExportTranslationsCsv}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Current Template
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleTranslationsFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-md cursor-pointer">
                                </input>
                                {translationsFile && (
                                    <p className="mt-2 text-sm text-gray-600">
                                        Selected: <span className="font-medium">{translationsFile.name}</span>
                                    </p>
                                )}
                            </div>

                            {translationsImportStatus.success > 0 || translationsImportStatus.failed > 0 ? (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Import Results</h4>
                                    <div className="space-y-2">
                                        {translationsImportStatus.success > 0 && (
                                            <p className="text-sm text-green-600">
                                                ✓ Successfully imported {translationsImportStatus.success} translation(s)
                                            </p>
                                        )}
                                        {translationsImportStatus.failed > 0 && (
                                            <div>
                                                <p className="text-sm text-red-600 font-medium">
                                                    ✗ Failed to import {translationsImportStatus.failed} translation(s)
                                                </p>
                                                {translationsImportStatus.errors.length > 0 && (
                                                    <div className="mt-2 max-h-32 overflow-y-auto">
                                                        <p className="text-xs text-gray-600 font-semibold mb-1">Errors:</p>
                                                        {translationsImportStatus.errors.map((error, idx) => (
                                                            <p key={idx} className="text-xs text-red-500">• {error}</p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => { setShowTranslationsModal(false); setTranslationsFile(null); setTranslationsImportStatus({ success: 0, failed: 0, errors: [] }); }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTranslationsCsvImport}
                                    disabled={!translationsFile || isImportingTranslations}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2">
                                    {isImportingTranslations ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Importing...
                                        </>
                                    ) : (
                                        'Import Translations'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default EmployerDashboard;
