
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getJobById, getEmployerProfile, getWorkerApplications, createApplication, getWorkerProfile, saveWorkerProfile } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Spinner from '../components/Spinner';
import { MapPin, DollarSign, Briefcase, Calendar, Building2, ArrowLeft, CheckCircle, Clock, Bus, Home, MessageCircle, Gift, Languages, Users, Plus, Check } from 'lucide-react';
import { UserRole } from '../types';
import type { Job, WorkerProfile, EmployerProfile } from '../types';
import { formatSalaryRange } from '../data/currencies';
import { TRANSLATION_LANGUAGES, languageLabel } from '../data/languages';
import { useLocale } from '../contexts/LocaleContext';
import { flattenWorkerSkills, computeSkillMatch } from '../utils/jobMatch';

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { t } = useLocale();
    const [job, setJob] = useState<Job | null>(null);
    // The job's own employer_name/logo are a snapshot taken at posting time
    // (see EmployerDashboard's handleCreateJob) — this is the live company
    // profile, fetched by the same employer_id the "View Company" link
    // navigates to, so the name shown here never drifts from that page.
    const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    // Worker-only: powers the "Your Skill Match" panel below (see
    // utils/jobMatch.ts for the keyword-overlap algorithm).
    const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
    const [addingSkill, setAddingSkill] = useState<string | null>(null);
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
            const isWorker = user && user.role === UserRole.WORKER;
            const [jobData, applications, profile] = await Promise.all([
                getJobById(id),
                isWorker ? getWorkerApplications(user!.id) : Promise.resolve([]),
                isWorker ? getWorkerProfile(user!.id) : Promise.resolve(null),
            ]);

            if (jobData) {
                setJob(jobData);
                getEmployerProfile(jobData.employer_id).then(setEmployerProfile);
            } else {
                console.error("Job not found");
            }

            const alreadyApplied = applications.some(app => app.job_id === id && app.status !== 'Withdrawn');
            setHasApplied(alreadyApplied);
            setWorkerProfile(profile);
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

    // Adds a missing-but-required skill as a tag under the worker's primary
    // skill (or their first skill if none is flagged primary). Only offered
    // once a Skill Passport already exists — a fresh upsert from this panel
    // with just a skill tag would be missing required profile fields
    // (full_name, trade_or_skill, etc.) and fail the DB's NOT NULL checks.
    const handleAddSkill = async (skillName: string) => {
        if (!user || !workerProfile || !workerProfile.skills || workerProfile.skills.length === 0) return;
        setAddingSkill(skillName);
        try {
            const skills = [...workerProfile.skills];
            const targetIndex = Math.max(0, skills.findIndex(s => s.isPrimary));
            skills[targetIndex] = { ...skills[targetIndex], tags: { ...skills[targetIndex].tags, [skillName]: true } };
            const updatedProfile = { ...workerProfile, skills };
            await saveWorkerProfile(updatedProfile);
            setWorkerProfile(updatedProfile);
            showToast(t('jobDetail.skillAdded', { skill: skillName }), 'success');
        } catch (error) {
            console.error('Error adding skill:', error);
            showToast(t('jobDetail.skillAddFailed'), 'error');
        } finally {
            setAddingSkill(null);
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

    const isWorkerViewer = user?.role === UserRole.WORKER;
    const skillMatch = isWorkerViewer
        ? computeSkillMatch(displayJob?.required_skills, flattenWorkerSkills(workerProfile))
        : null;

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
                                className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline text-lg mb-2 inline-flex items-center gap-2"
                            >
                                {employerProfile?.company_logo_url ? (
                                    <img src={employerProfile.company_logo_url} alt="" className="h-6 w-6 rounded object-cover flex-shrink-0" />
                                ) : (
                                    <Building2 size={20} className="flex-shrink-0" />
                                )}
                                {employerProfile?.company_name || job.employer_name}
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

                {/* Skill Match — worker-only "how well am I positioned" illustration.
                    See utils/jobMatch.ts for the keyword-overlap algorithm behind it. */}
                {isWorkerViewer && skillMatch && (
                    <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                            <h2 className="text-2xl font-bold text-slate-900">{t('jobDetail.skillMatchTitle')}</h2>
                            <span className={`text-sm font-bold font-mono ${
                                skillMatch.percent >= 70 ? 'text-emerald-600' : skillMatch.percent >= 40 ? 'text-amber-600' : 'text-slate-500'
                            }`}>
                                {t('jobDetail.skillMatchPercent', { percent: skillMatch.percent })}
                            </span>
                        </div>

                        <div className="flex gap-1.5 mb-6" role="progressbar" aria-valuenow={skillMatch.percent} aria-valuemin={0} aria-valuemax={100}>
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                                        i < Math.round(skillMatch.percent / 10) ? 'bg-emerald-500' : 'bg-slate-200'
                                    }`}
                                />
                            ))}
                        </div>

                        {skillMatch.missing.length === 0 ? (
                            <p className="text-emerald-700 font-medium flex items-center gap-2">
                                <Check size={18} /> {t('jobDetail.allSkillsMatched')}
                            </p>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-slate-700 mb-3">{t('jobDetail.addTheseSkills')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {skillMatch.missing.map(skill => (
                                        <button
                                            key={skill}
                                            type="button"
                                            onClick={() => handleAddSkill(skill)}
                                            disabled={!workerProfile?.skills?.length || addingSkill === skill}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-emerald-300 text-emerald-700 font-medium text-sm hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                        >
                                            <Plus size={14} className={addingSkill === skill ? 'animate-spin' : ''} />
                                            {skill}
                                        </button>
                                    ))}
                                </div>
                                {!workerProfile?.skills?.length && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm flex items-center justify-between gap-3 flex-wrap">
                                        <span>{t('jobDetail.buildPassportPrompt')}</span>
                                        <Link to="/worker/dashboard" className="font-bold whitespace-nowrap hover:underline">
                                            {t('jobDetail.buildPassportCta')}
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Required Skills */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('jobDetail.requiredSkills')}</h2>
                    <div className="flex flex-wrap gap-3">
                        {(displayJob.required_skills ?? []).map((skill, index) => {
                            const isMatched = skillMatch?.matched.includes(skill);
                            const isMissing = skillMatch?.missing.includes(skill);
                            return (
                            <span
                                key={index}
                                className={`px-4 py-2 rounded-full font-medium flex items-center gap-1.5 ${
                                    isMissing
                                        ? 'bg-slate-100 text-slate-600 border border-slate-300'
                                        : 'bg-emerald-100 text-emerald-800'
                                }`}
                            >
                                {isMatched && <Check size={14} />}
                                {skill}
                            </span>
                            );
                        })}
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
