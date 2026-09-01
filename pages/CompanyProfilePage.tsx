
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployerProfile, getJobs } from '../services/db';
import Spinner from '../components/Spinner';
import { Building2, MapPin, Globe, Phone, Users, Calendar, ArrowLeft, Briefcase, DollarSign } from 'lucide-react';
import type { EmployerProfile, Job } from '../types';

export default function CompanyProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<EmployerProfile | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCompanyData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const [profileData, activeJobs] = await Promise.all([
                getEmployerProfile(id),
                getJobs({ employerId: id, status: 'Active' }),
            ]);
            setProfile(profileData);
            setJobs(activeJobs);
        } catch (err) {
            console.error("Error fetching company data:", err);
            setError("Couldn't load this company's profile. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCompanyData();
    }, [fetchCompanyData]);

    const handleViewJob = (jobId: string) => {
        navigate(`/jobs/${jobId}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600">{error}</h2>
                    <button
                        onClick={fetchCompanyData}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Company Not Found</h2>
                    <button
                        onClick={() => navigate('/jobs')}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        Back to Jobs
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
            >
                <ArrowLeft size={20} />
                Back
            </button>

            <div className="max-w-6xl mx-auto">
                {/* Company Header */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <div className="flex items-start gap-6">
                        {/* Company Logo */}
                        {profile.company_logo_url ? (
                            <img
                                src={profile.company_logo_url}
                                alt={profile.company_name}
                                className="w-24 h-24 rounded-lg object-cover border-2 border-slate-200"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Building2 size={48} className="text-emerald-600" />
                            </div>
                        )}

                        {/* Company Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">{profile.company_name}</h1>
                            {profile.industry && (
                                <p className="text-lg text-slate-600 mb-4">{profile.industry}</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
                                {profile.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={18} />
                                        <span>{profile.location}</span>
                                    </div>
                                )}
                                {profile.website_url && (
                                    <div className="flex items-center gap-2">
                                        <Globe size={18} />
                                        <a
                                            href={profile.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-600 hover:underline"
                                        >
                                            Visit Website
                                        </a>
                                    </div>
                                )}
                                {profile.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={18} />
                                        <span>{profile.phone}</span>
                                    </div>
                                )}
                                {profile.company_size && (
                                    <div className="flex items-center gap-2">
                                        <Users size={18} />
                                        <span>{profile.company_size} employees</span>
                                    </div>
                                )}
                                {profile.year_founded && (
                                    <div className="flex items-center gap-2">
                                        <Calendar size={18} />
                                        <span>Founded in {profile.year_founded}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Company Description */}
                    {profile.description && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-3">About {profile.company_name}</h2>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{profile.description}</p>
                        </div>
                    )}
                </div>

                {/* Open Positions */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Briefcase size={24} />
                        Open Positions ({jobs.length})
                    </h2>

                    {jobs.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Briefcase size={48} className="mx-auto mb-4 text-slate-300" />
                            <p>No open positions at the moment</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    onClick={() => handleViewJob(job.id)}
                                    className="border border-slate-200 rounded-lg p-6 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 hover:text-emerald-600">
                                                {job.title}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {job.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign size={14} />
                                                    ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                                            {job.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 line-clamp-2 mb-3">{job.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(job.required_skills ?? []).slice(0, 5).map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
