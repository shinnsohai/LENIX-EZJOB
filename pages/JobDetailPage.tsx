
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById, getWorkerApplications, createApplication } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Spinner from '../components/Spinner';
import { MapPin, DollarSign, Briefcase, Calendar, Building2, ArrowLeft, CheckCircle, Clock, Bus, Home, MessageCircle, Gift, Languages, Users } from 'lucide-react';
import { UserRole } from '../types';
import type { Job } from '../types';
import { formatSalaryRange } from '../data/currencies';
import { TRANSLATION_LANGUAGES, languageLabel } from '../data/languages';
import { useLocale } from '../contexts/LocaleContext';

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { t } = useLocale();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    // Qualifying questions act as a lightweight screening checklist in place
    // of a cover letter — candidates confirm each one before applying.
    const [confirmedQuestions, setConfirmedQuestions] = useState<Set<number>>(new Set());
    // 'en' = the job's own base-language fields. Anything else reads from
    // job.translations, populated offline via the employer's CSV export/
    // import round-trip (never generated in-app) — falling back per-field
    // to the base content when a translation is missing or incomplete.
    const [locale, setLocale] = useState<string>('en');

    const fetchJob = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [jobData, applications] = await Promise.all([
                getJobById(id),
                user && user.role === UserRole.WORKER ? getWorkerApplications(user.id) : Promise.resolve([]),
            ]);

            if (jobData) {
                setJob(jobData);
            } else {
                console.error("Job not found");
            }

            const alreadyApplied = applications.some(app => app.job_id === id && app.status !== 'Withdrawn');
            setHasApplied(alreadyApplied);
        } catch (error) {
            console.error("Error fetching job:", error);
        } finally {
            setLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        fetchJob();
    }, [fetchJob]);

    const handleApply = async () => {
        if (!job) return;

        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role !== UserRole.WORKER) {
            showToast(t('jobSearch.notifyEmployerCannotApply'), 'error');
            return;
        }

        setApplying(true);
        try {
            await createApplication(job, user.id);
            setHasApplied(true);
        } catch (error: any) {
            console.error("Error applying to job:", error);
            showToast(error.message || t('jobDetail.applyFailed'), 'error');
        } finally {
            setApplying(false);
        }
    };

    const handleViewCompany = () => {
        if (job?.employer_id) {
            navigate(`/employer/profile/${job.employer_id}`);
        }
    };

    const toggleQuestion = (index: number) => {
        setConfirmedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index); else next.add(index);
            return next;
        });
    };

    // Only offer languages that actually have a translation on file for this
    // job — an empty switcher option that falls straight back to English
    // isn't a real choice.
    const availableLanguages = TRANSLATION_LANGUAGES.filter(l => job?.translations?.[l.code]);
    const jobT = locale !== 'en' ? job?.translations?.[locale] : undefined;
    const displayJob = job ? {
        title: jobT?.title || job.title,
        description: jobT?.description || job.description,
        required_skills: jobT?.required_skills?.length ? jobT.required_skills : job.required_skills,
        shift_schedule: jobT?.shift_schedule || job.shift_schedule,
        perks: jobT?.perks || job.perks,
        qualifying_questions: jobT?.qualifying_questions?.length ? jobT.qualifying_questions : job.qualifying_questions,
    } : null;

    const questions = displayJob?.qualifying_questions ?? [];
    const allQuestionsConfirmed = questions.length === 0 || confirmedQuestions.size === questions.length;

    const whatsappHref = job?.whatsapp_number
        ? `https://wa.me/${job.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Hi, I'd like to apply for the ${job.title} position${job.employer_name ? ` at ${job.employer_name}` : ''}.`
          )}`
        : null;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!job || !displayJob) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800">{t('jobDetail.jobNotFound')}</h2>
                    <button
                        onClick={() => navigate('/jobs')}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        {t('jobDetail.backToJobs')}
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
                {t('jobDetail.back')}
            </button>

            <div className="max-w-4xl mx-auto">
                {/* Job Header */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <div className="flex justify-between items-start mb-6 gap-4">
                        <div className="flex-1">
                            <button
                                onClick={handleViewCompany}
                                className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline text-lg mb-2"
                            >
                                <Building2 size={20} className="inline mr-2" />
                                {job.employer_name}
                            </button>
                            <h1 className="text-4xl font-bold text-slate-900 mb-4">{displayJob.title}</h1>

                            <div className="flex flex-wrap gap-4 text-slate-600">
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} />
                                    <span>{job.location}, {job.country}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={18} />
                                    <span>{formatSalaryRange(job.salary_min, job.salary_max, job.country)} {t('common.perYear')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Briefcase size={18} />
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                                        {job.status}
                                    </span>
                                </div>
                                {job.available_positions !== undefined && (
                                    <div className="flex items-center gap-2">
                                        <Users size={18} />
                                        <span>{t('jobDetail.positionsFilled', { filled: job.positions_filled ?? 0, total: job.available_positions })}</span>
                                    </div>
                                )}
                                {displayJob.shift_schedule && (
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} />
                                        <span>{displayJob.shift_schedule}</span>
                                    </div>
                                )}
                                {job.transport_provided && (
                                    <div className="flex items-center gap-2">
                                        <Bus size={18} />
                                        <span>{job.transport_details || t('jobDetail.transportProvided')}</span>
                                    </div>
                                )}
                                {job.accommodation_provided && (
                                    <div className="flex items-center gap-2">
                                        <Home size={18} />
                                        <span>{job.accommodation_details || t('jobDetail.accommodationProvided')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Locale switcher — only shown when this job actually has a
                            translation on file (see the async CSV workflow in
                            EmployerDashboard). Falls back per-field to the base
                            content, so a partial translation never blanks a field. */}
                        {availableLanguages.length > 0 && (
                            <div className="flex-shrink-0">
                                <label htmlFor="job-locale" className="sr-only">{t('header.language')}</label>
                                <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50">
                                    <Languages size={16} className="text-slate-500 flex-shrink-0" aria-hidden="true" />
                                    <select
                                        id="job-locale"
                                        value={locale}
                                        onChange={e => setLocale(e.target.value)}
                                        className="bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value="en">English</option>
                                        {availableLanguages.map(l => (
                                            <option key={l.code} value={l.code}>{l.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Perks & Allowances */}
                    {displayJob.perks && (
                        <div className="flex items-start gap-2 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                            <Gift size={18} className="mt-0.5 flex-shrink-0" />
                            <span className="text-sm font-medium">{displayJob.perks}</span>
                        </div>
                    )}

                    {/* Qualifying Questions — confirm-to-apply checklist, replaces a cover letter */}
                    {questions.length > 0 && (
                        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                            <h3 className="text-sm font-bold text-slate-900 mb-2">{t('jobDetail.beforeYouApply')}</h3>
                            <div className="space-y-2">
                                {questions.map((q, i) => (
                                    <label key={i} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={confirmedQuestions.has(i)}
                                            onChange={() => toggleQuestion(i)}
                                            className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span>{q}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Apply Button(s) */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleApply}
                            disabled={applying || hasApplied || !allQuestionsConfirmed}
                            title={!allQuestionsConfirmed ? t('jobDetail.confirmToApply') : undefined}
                            className={`flex-1 py-3 px-6 rounded-lg font-bold text-lg transition-colors ${hasApplied || !allQuestionsConfirmed
                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                        >
                            {hasApplied ? (
                                <>
                                    <CheckCircle size={20} className="inline mr-2" />
                                    {t('jobDetail.alreadyApplied')}
                                </>
                            ) : applying ? (
                                t('jobSearch.submitting')
                            ) : (
                                t('jobDetail.applyForPosition')
                            )}
                        </button>
                        {whatsappHref && (
                            <a
                                href={whatsappHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-disabled={!allQuestionsConfirmed}
                                onClick={(e) => { if (!allQuestionsConfirmed) e.preventDefault(); }}
                                className={`flex-1 py-3 px-6 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 ${!allQuestionsConfirmed
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none'
                                        : 'bg-[#25D366] text-white hover:bg-[#1ebc59]'
                                    }`}
                            >
                                <MessageCircle size={20} />
                                {t('jobDetail.whatsappToApply')}
                            </a>
                        )}
                    </div>
                </div>

                {/* Job Description */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('jobDetail.jobDescription')}</h2>
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{displayJob.description}</p>
                    </div>
                </div>

                {/* Required Skills */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('jobDetail.requiredSkills')}</h2>
                    <div className="flex flex-wrap gap-3">
                        {(displayJob.required_skills ?? []).map((skill, index) => (
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
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleApply}
                        disabled={applying || hasApplied || !allQuestionsConfirmed}
                        title={!allQuestionsConfirmed ? t('jobDetail.confirmToApply') : undefined}
                        className={`flex-1 py-3 px-6 rounded-lg font-bold text-lg transition-colors ${hasApplied || !allQuestionsConfirmed
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                    >
                        {hasApplied ? (
                            <>
                                <CheckCircle size={20} className="inline mr-2" />
                                {t('jobDetail.alreadyApplied')}
                            </>
                        ) : applying ? (
                            t('jobSearch.submitting')
                        ) : (
                            t('jobDetail.applyForPosition')
                        )}
                    </button>
                    {whatsappHref && (
                        <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-disabled={!allQuestionsConfirmed}
                            onClick={(e) => { if (!allQuestionsConfirmed) e.preventDefault(); }}
                            className={`flex-1 py-3 px-6 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 ${!allQuestionsConfirmed
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none'
                                    : 'bg-[#25D366] text-white hover:bg-[#1ebc59]'
                                }`}
                        >
                            <MessageCircle size={20} />
                            {t('jobDetail.whatsappToApply')}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
