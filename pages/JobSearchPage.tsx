import React, { useState, useEffect, useCallback } from 'react';
import type { Job } from '../types';
import { getJobs, getWorkerApplications, createApplication } from '../services/db';
import Spinner from '../components/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { ArrowUpDown, Search, MapPin, DollarSign, Calendar, Sparkles, Building2, CheckCircle2, Clock, Bus, Home } from 'lucide-react';
import { formatSalaryRange } from '../data/currencies';

const TRADE_CATEGORIES = [
    'All Roles',
    'Engineering',
    'Heavy Machinery',
    'Electrical',
    'Welding & Fabrication',
    'Safety Oversight'
];

const JobCard: React.FC<{
    job: Job;
    onApply: (job: Job) => void;
    isApplying: boolean;
    hasApplied: boolean;
    onViewJob: (jobId: string) => void;
    onViewCompany: (employerId: string) => void;
    index: number;
}> = ({ job, onApply, isApplying, hasApplied, onViewJob, onViewCompany, index }) => {
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

    const badgeLabel = index % 3 === 0 ? 'Immediate Start' : index % 3 === 1 ? 'Verified Req' : 'Hot Role';

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 border-l-4 ${accentBorder} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden ${hasApplied ? 'opacity-90 ring-1 ring-emerald-400' : ''}`}>
            <div 
                onClick={() => onViewJob(job.id)} 
                className="p-6 flex-grow cursor-pointer"
            >
                {/* Top Badge & Company */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase border ${badgeStyle}`}>
                        {badgeLabel}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewCompany(job.employer_id);
                        }}
                        className="text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1 truncate max-w-[160px]"
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
                            {formatSalaryRange(job.salary_min ?? 0, job.salary_max ?? 0, job.country)} / yr
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
                                    <Bus size={14} className="text-cyan-600 dark:text-cyan-400" /> Transport
                                </span>
                            )}
                            {job.accommodation_provided && (
                                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                    <Home size={14} className="text-cyan-600 dark:text-cyan-400" /> Housing
                                </span>
                            )}
                        </div>
                    )}
                    {job.createdAt && (
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px]">
                            <Calendar size={13} />
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
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
                    View Details &rarr;
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
                            Applied
                        </>
                    ) : isApplying ? (
                        'Submitting...'
                    ) : (
                        'Apply Now'
                    )}
                </button>
            </div>
        </div>
    );
};

const JobSearchPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Roles');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [applyingId, setApplyingId] = useState<string | null>(null);
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        try {
            const [activeJobs, userApplications] = await Promise.all([
                getJobs(),
                user && user.role === UserRole.WORKER ? getWorkerApplications(user.id) : Promise.resolve([])
            ]);

            setJobs(activeJobs);
            setFilteredJobs(activeJobs);

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

        // Sort by date
        filtered.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredJobs(filtered);
    }, [jobs, searchTerm, selectedCategory, sortOrder]);

    const handleApply = async (job: Job) => {
        if (!user) {
            setNotification({ message: "Please log in or register to submit an application.", type: 'error' });
            setTimeout(() => setNotification(null), 3500);
            return;
        }

        if (user.role !== UserRole.WORKER) {
            setNotification({ message: "Employer accounts cannot apply for jobs.", type: 'error' });
            setTimeout(() => setNotification(null), 3500);
            return;
        }

        setApplyingId(job.id);

        try {
            await createApplication(job, user.id);
            setNotification({ message: "Application submitted successfully with verified Skill Passport!", type: 'success' });
            setAppliedJobIds(prev => new Set(prev).add(job.id));
        } catch (error: any) {
            console.error("Apply error:", error);
            setNotification({ message: error.message || "Failed to apply. Please try again.", type: 'error' });
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
                            AI-Powered Requisition Match
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                            Find High-Velocity Skilled Trade Roles
                        </h1>
                        <p className="text-slate-300 text-sm mt-2">
                            Explore verified positions across engineering, construction, electrical, and heavy operations.
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
                                placeholder="Search by trade title, company, location, or skill..."
                                className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-full focus:outline-none focus:border-cyan-400 font-mono text-sm placeholder:text-slate-500"
                            />
                        </div>

                        <button
                            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-slate-600 text-white rounded-full font-mono text-xs uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <ArrowUpDown size={15} className="text-cyan-400" />
                            <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                        </button>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 relative z-10 scrollbar-none">
                        {TRADE_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                                    selectedCategory === cat
                                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                                        : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Meta Info */}
                <div className="flex items-center justify-between mb-6 px-1 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span>
                        Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredJobs.length}</strong> active requisitions
                    </span>
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')} 
                            className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                        >
                            Clear Search
                        </button>
                    )}
                </div>

                {/* Job Cards Grid */}
                {isLoading ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <Spinner size="lg" />
                        <p className="mt-4 font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Querying LENIX Match Engine...</p>
                    </div>
                ) : filteredJobs.length > 0 ? (
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
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">work_off</span>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">No matching requisitions found</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
                            Try adjusting your search terms or select "All Roles" to view all available skilled trade positions.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobSearchPage;


