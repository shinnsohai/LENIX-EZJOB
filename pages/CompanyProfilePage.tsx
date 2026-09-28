import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployerProfile, getJobs, getCompanyPage, getCompanyPageBySlug } from '../services/db';
import Spinner from '../components/Spinner';
import CompanyHero from '../components/company/CompanyHero';
import TalentMarquee from '../components/company/TalentMarquee';
import { MapPin, Globe, Phone, Mail, Users, Calendar, Building2, Linkedin, Facebook, Instagram, ArrowUpRight, Briefcase, DollarSign, Clock } from 'lucide-react';
import type { EmployerProfile, Job, CompanyPageContent } from '../types';
import { UserRole } from '../types';
import { formatSalaryRange } from '../data/currencies';
import { useLocale } from '../contexts/LocaleContext';
import { useAuth } from '../contexts/AuthContext';

const SectionHeading: React.FC<{ eyebrow: string; title: string; id?: string }> = ({ eyebrow, title, id }) => (
    <div className="mb-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400">{eyebrow}</p>
        <h2 id={id} className="mt-2 font-display text-3xl md:text-4xl font-medium tracking-tight text-[#0a1b33] dark:text-white">{title}</h2>
    </div>
);

const ContactRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
    <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{icon}</span>
        <div className="min-w-0">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <div className="text-sm text-[#0a1b33] dark:text-slate-100 break-words">{children}</div>
        </div>
    </div>
);

const externalHref = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
const displayUrl = (url: string) => url.replace(/^https?:\/\//i, '').replace(/\/$/, '');

/**
 * Public showcase page for a hiring company. Reachable by employer id
 * (/employer/profile/:id — what job pages link to) or by the admin-assigned
 * slug (/company/:slug). Basic facts come from employer_profiles; the curated
 * showcase content (capabilities, sectors, projects, talents...) comes from
 * the admin-managed company page in site_content.
 */
export default function CompanyProfilePage() {
    const { id, slug } = useParams<{ id?: string; slug?: string }>();
    const { t } = useLocale();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<EmployerProfile | null>(null);
    const [page, setPage] = useState<CompanyPageContent>({});
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCompanyData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let userId = id;
            let content: CompanyPageContent | null = null;
            if (slug) {
                const found = await getCompanyPageBySlug(slug);
                userId = found?.userId;
                content = found?.content ?? null;
            } else if (id) {
                content = await getCompanyPage(id);
            }
            if (!userId) {
                setProfile(null);
                return;
            }
            const [profileData, activeJobs] = await Promise.all([
                getEmployerProfile(userId),
                getJobs({ employerId: userId, status: 'Active' }),
            ]);
            setProfile(profileData);
            setPage(content ?? {});
            setJobs(activeJobs);
        } catch (err) {
            console.error('Error fetching company data:', err);
            setError("Couldn't load this company's page. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [id, slug]);

    useEffect(() => {
        fetchCompanyData();
    }, [fetchCompanyData]);

    const scrollTo = (sectionId: string) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleJoinTeam = () => {
        if (!user) {
            navigate('/register', { state: { role: UserRole.WORKER } });
        } else {
            scrollTo('open-roles');
        }
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
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-red-600">{error}</h2>
                <button onClick={fetchCompanyData} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Retry
                </button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">This company page isn't available</h2>
                <p className="mt-2 text-slate-500 text-sm">The company may not have published a profile yet, or the link has changed.</p>
                <button onClick={() => navigate('/jobs')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Browse Jobs
                </button>
            </div>
        );
    }

    const talents = page.talents ?? [];
    const stats = page.stats ?? [];
    const capabilities = page.capabilities ?? [];
    const sectors = page.sectors ?? [];
    const projects = page.projects ?? [];
    const socials = [
        { url: page.linkedin_url, label: 'LinkedIn', icon: <Linkedin size={16} /> },
        { url: page.facebook_url, label: 'Facebook', icon: <Facebook size={16} /> },
        { url: page.instagram_url, label: 'Instagram', icon: <Instagram size={16} /> },
    ].filter(s => !!s.url);
    const address = page.address || profile.location;

    return (
        <div className="min-h-screen bg-[#f9fafb] dark:bg-slate-950 px-4 sm:px-6 py-8 sm:py-10 font-sans">
            <CompanyHero
                companyName={profile.company_name}
                logoUrl={profile.company_logo_url}
                videoUrl={page.hero_video_url}
                onViewCompany={() => scrollTo('about')}
                onOpenRoles={() => scrollTo('open-roles')}
                onAbout={() => scrollTo('about')}
                onJoinTeam={handleJoinTeam}
            />

            {talents.length > 0 && (
                <section aria-labelledby="talents-heading" className="mt-10 max-w-[1400px] mx-auto">
                    <p id="talents-heading" className="mb-4 text-center font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Talents who joined {profile.company_name}
                    </p>
                    <TalentMarquee talents={talents} />
                </section>
            )}

            <div className={`max-w-6xl mx-auto space-y-20 ${talents.length > 0 ? '' : 'mt-20'}`}>
                {/* About & contact */}
                <section id="about" className="scroll-mt-28">
                    <SectionHeading eyebrow="About the company" title={page.tagline || profile.company_name} />
                    <div className="grid gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3 rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-4">
                                {profile.company_logo_url ? (
                                    <img src={profile.company_logo_url} alt="" className="h-16 w-16 rounded-2xl border border-slate-200 object-cover dark:border-slate-700" />
                                ) : (
                                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800"><Building2 size={28} /></span>
                                )}
                                <div>
                                    <h3 className="font-display text-2xl font-medium text-[#0a1b33] dark:text-white">{profile.company_name}</h3>
                                    {profile.industry && <p className="text-sm text-slate-500 dark:text-slate-400">{profile.industry}</p>}
                                </div>
                            </div>
                            {profile.description && (
                                <p className="mt-6 whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300">{profile.description}</p>
                            )}
                            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                                {profile.company_size && <span className="flex items-center gap-1.5"><Users size={15} /> {profile.company_size}</span>}
                                {profile.year_founded && <span className="flex items-center gap-1.5"><Calendar size={15} /> Founded {profile.year_founded}</span>}
                            </div>
                        </div>

                        <div className="lg:col-span-2 rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm space-y-5 dark:border-slate-800 dark:bg-slate-900">
                            {address && <ContactRow icon={<MapPin size={16} />} label="Address">{address}</ContactRow>}
                            {profile.phone && (
                                <ContactRow icon={<Phone size={16} />} label="Phone">
                                    <a href={`tel:${profile.phone.replace(/[^+\d]/g, '')}`} className="hover:text-cyan-600">{profile.phone}</a>
                                </ContactRow>
                            )}
                            {page.email && (
                                <ContactRow icon={<Mail size={16} />} label="Email">
                                    <a href={`mailto:${page.email}`} className="hover:text-cyan-600">{page.email}</a>
                                </ContactRow>
                            )}
                            {profile.website_url && (
                                <ContactRow icon={<Globe size={16} />} label="Website">
                                    <a href={externalHref(profile.website_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-cyan-600">
                                        {displayUrl(profile.website_url)} <ArrowUpRight size={13} />
                                    </a>
                                </ContactRow>
                            )}
                            {socials.length > 0 && (
                                <div className="flex gap-2 pt-2">
                                    {socials.map(s => (
                                        <a
                                            key={s.label}
                                            href={externalHref(s.url!)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={s.label}
                                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors dark:border-slate-700 dark:text-slate-300"
                                        >
                                            {s.icon}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {stats.length > 0 && (
                        <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                            {stats.map(stat => (
                                <div key={stat.label} className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <dt className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</dt>
                                    <dd className="mt-1 font-display text-4xl font-medium text-[#0a1b33] dark:text-white">{stat.value}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </section>

                {/* Scope of work & capabilities */}
                {(capabilities.length > 0 || sectors.length > 0 || projects.length > 0) && (
                    <section id="capabilities" className="scroll-mt-28">
                        <SectionHeading eyebrow="Scope of work" title="Capabilities & experience" />

                        {capabilities.length > 0 && (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {capabilities.map((cap, i) => (
                                    <div key={cap.title} className="rounded-3xl border border-slate-200/70 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">{String(i + 1).padStart(2, '0')}</span>
                                        <h3 className="mt-3 font-display text-xl font-medium text-[#0a1b33] dark:text-white">{cap.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{cap.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sectors.length > 0 && (
                            <div className="mt-10">
                                <h3 className="mb-4 font-display text-2xl font-medium text-[#0a1b33] dark:text-white">Sectors served</h3>
                                <div className="grid gap-4 md:grid-cols-3">
                                    {sectors.map(sector => (
                                        <div key={sector.title} className="rounded-3xl bg-[#0a1b33] p-7 text-white">
                                            <h4 className="font-display text-xl font-medium">{sector.title}</h4>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-300">{sector.description}</p>
                                            {sector.focus && (
                                                <p className="mt-4 border-t border-white/10 pt-4 text-sm text-slate-300">
                                                    <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">Project focus</span>
                                                    {sector.focus}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {projects.length > 0 && (
                            <div className="mt-10">
                                <h3 className="mb-4 font-display text-2xl font-medium text-[#0a1b33] dark:text-white">Recent projects</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {projects.map(project => (
                                        <div key={project.title} className="rounded-3xl border border-slate-200/70 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">{project.sector}</p>
                                            <h4 className="mt-2 font-display text-xl font-medium text-[#0a1b33] dark:text-white">{project.title}</h4>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{project.summary}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Open roles */}
                <section id="open-roles" className="scroll-mt-28 pb-8">
                    <SectionHeading eyebrow="Now hiring" title={`Open roles (${jobs.length})`} />
                    {jobs.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
                            <Briefcase size={36} className="mx-auto text-slate-300" />
                            <p className="mt-3 text-slate-500 dark:text-slate-400">No open roles right now — check back soon.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {jobs.map(job => (
                                <button
                                    key={job.id}
                                    type="button"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                    className="group rounded-3xl border border-slate-200/70 bg-white p-6 text-left shadow-sm transition-all hover:border-cyan-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-700"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-display text-xl font-medium text-[#0a1b33] group-hover:text-cyan-700 dark:text-white dark:group-hover:text-cyan-400">{job.title}</h3>
                                        <ArrowUpRight size={18} className="shrink-0 text-slate-300 group-hover:text-cyan-600" />
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
                                        <span className="flex items-center gap-1.5"><DollarSign size={14} /> {formatSalaryRange(job.salary_min, job.salary_max, job.country)} {t('common.perYear')}</span>
                                        {job.shift_schedule && <span className="flex items-center gap-1.5"><Clock size={14} /> {job.shift_schedule}</span>}
                                    </div>
                                    <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{job.description}</p>
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {(job.required_skills ?? []).slice(0, 4).map(skill => (
                                            <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{skill}</span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
