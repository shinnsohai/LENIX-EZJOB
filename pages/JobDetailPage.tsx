
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import { MapPin, DollarSign, Briefcase, Calendar, Building2, ArrowLeft, CheckCircle } from 'lucide-react';
import type { Job } from '../types';

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    useEffect(() => {
        fetchJob();
    }, [id]);

    const fetchJob = async () => {
        if (!id) return;
        try {
            const jobDoc = await getDoc(doc(db, 'jobs', id));
            if (jobDoc.exists()) {
                setJob({ id: jobDoc.id, ...jobDoc.data() } as Job);
            } else {
                console.error("Job not found");
            }
        } catch (error) {
            console.error("Error fetching job:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        // Navigate back to jobs page and trigger apply
        navigate('/jobs');
    };

    const handleViewCompany = () => {
        if (job?.employer_id) {
            navigate(`/employer/profile/${job.employer_id}`);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Job Not Found</h2>
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

            <div className="max-w-4xl mx-auto">
                {/* Job Header */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                            <button
                                onClick={handleViewCompany}
                                className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline text-lg mb-2"
                            >
                                <Building2 size={20} className="inline mr-2" />
                                {job.employer_name}
                            </button>
                            <h1 className="text-4xl font-bold text-slate-900 mb-4">{job.title}</h1>

                            <div className="flex flex-wrap gap-4 text-slate-600">
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} />
                                    <span>{job.location}, {job.country}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={18} />
                                    <span>${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Briefcase size={18} />
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                                        {job.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Apply Button */}
                    <button
                        onClick={handleApply}
                        disabled={applying || hasApplied}
                        className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-colors ${hasApplied
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                    >
                        {hasApplied ? (
                            <>
                                <CheckCircle size={20} className="inline mr-2" />
                                Already Applied
                            </>
                        ) : (
                            'Apply for this Position'
                        )}
                    </button>
                </div>

                {/* Job Description */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Job Description</h2>
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                    </div>
                </div>

                {/* Required Skills */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Required Skills</h2>
                    <div className="flex flex-wrap gap-3">
                        {job.required_skills.map((skill, index) => (
                            <span
                                key={index}
                                className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-medium"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Apply Button (Bottom) */}
                <div className="mt-8">
                    <button
                        onClick={handleApply}
                        disabled={applying || hasApplied}
                        className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-colors ${hasApplied
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                    >
                        {hasApplied ? (
                            <>
                                <CheckCircle size={20} className="inline mr-2" />
                                Already Applied
                            </>
                        ) : (
                            'Apply for this Position'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
