import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getWorkerApplications, withdrawApplication } from '../services/db';
import Spinner from '../components/Spinner';
import { Trash2, Briefcase, MapPin, Calendar, Building2, Search, ArrowUpDown } from 'lucide-react';
import type { Application } from '../types';

const getStatusColor = (status: Application['status']) => {
    switch (status) {
        case 'Submitted': return 'bg-blue-100 text-blue-800';
        case 'Viewed': return 'bg-yellow-100 text-yellow-800';
        case 'Shortlisted': return 'bg-emerald-100 text-emerald-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'Withdrawn': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default function AppliedJobsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState<Application[]>([]);
    const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

    const fetchApplications = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            const apps = await getWorkerApplications(user.id);
            setApplications(apps);
        } catch (err) {
            console.error("Error fetching applications:", err);
            setError("Couldn't load your applications. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    // Filter and sort applications whenever they change or search/sort changes
    useEffect(() => {
        let filtered = [...applications];

        // Apply search filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(app =>
                app.job_title.toLowerCase().includes(lowerTerm) ||
                app.employer_name.toLowerCase().includes(lowerTerm) ||
                app.location?.toLowerCase().includes(lowerTerm)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const dateA = new Date(a.appliedAt).getTime();
            const dateB = new Date(b.appliedAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredApplications(filtered);
    }, [applications, searchTerm, sortOrder]);

    const handleWithdraw = async (id: string) => {
        if (!window.confirm("Are you sure you want to withdraw this application? You can re-apply later, but the employer will see it as withdrawn until then.")) {
            return;
        }

        setWithdrawingId(id);
        try {
            await withdrawApplication(id);
            setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'Withdrawn' } : app));
        } catch (error) {
            console.error("Error withdrawing application:", error);
            alert("Failed to withdraw application. Please try again.");
        } finally {
            setWithdrawingId(null);
        }
    };

    const handleViewJob = (jobId: string) => {
        navigate(`/jobs/${jobId}`);
    };

    const handleViewCompany = (employerId: string) => {
        if (employerId) {
            navigate(`/employer/profile/${employerId}`);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-6">Applied Jobs</h1>

                {/* Search and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by job title, company, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Sort Button */}
                    <button
                        onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <ArrowUpDown size={18} />
                        <span className="font-medium">
                            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                        </span>
                    </button>
                </div>

                {/* Results Count */}
                {searchTerm && (
                    <p className="text-sm text-slate-600 mb-4">
                        Found {filteredApplications.length} of {applications.length} applications
                    </p>
                )}
            </div>

            {error ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-medium text-red-600 mb-2">{error}</h3>
                    <button
                        onClick={fetchApplications}
                        className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        Retry
                    </button>
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                    <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">
                        {searchTerm ? 'No matching applications' : 'No applications yet'}
                    </h3>
                    <p className="text-slate-500 mt-2">
                        {searchTerm ? 'Try adjusting your search terms' : 'Start applying for jobs from the "Find Jobs" tab.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredApplications.map(app => (
                        <div key={app.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
                            {/* Job Card - Clickable */}
                            <div
                                onClick={() => handleViewJob(app.job_id)}
                                className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-800 hover:text-emerald-600 transition-colors">
                                            {app.job_title}
                                        </h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (app.employer_id) handleViewCompany(app.employer_id);
                                            }}
                                            className="text-slate-600 font-medium hover:text-emerald-600 transition-colors text-left mt-1 flex items-center gap-1"
                                        >
                                            <Building2 size={14} />
                                            {app.employer_name}
                                        </button>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(app.status)}`}>
                                        {app.status}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                                    </div>
                                    {app.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} />
                                            <span>{app.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {app.status !== 'Withdrawn' && (
                                <div className="px-6 pb-6">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleWithdraw(app.id);
                                        }}
                                        disabled={withdrawingId === app.id}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={16} /> {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw Application'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
