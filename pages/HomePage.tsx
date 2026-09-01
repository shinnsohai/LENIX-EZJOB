import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSiteContent } from '../contexts/SiteContentContext';
import { UserRole } from '../types';

const HeroSection = () => {
    const navigate = useNavigate();
    const { homepageContent } = useSiteContent();

    return (
        <section className="relative w-full pt-12 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
            {/* Background Decorative Glows */}
            <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-25" 
                style={{
                    backgroundImage: 'radial-gradient(circle at 80% -20%, #3b82f6 0%, transparent 45%), radial-gradient(circle at 20% 120%, #d946ef 0%, transparent 45%), radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 60%)'
                }}
            />

            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10 items-center">
                <div className="lg:col-span-7 flex flex-col gap-6 text-left">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-cyan-500/30 rounded-full w-fit shadow-sm">
                        <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400 text-[18px]">bolt</span>
                        <span className="font-mono text-xs uppercase tracking-widest text-cyan-700 dark:text-cyan-300 font-semibold">Accelerated Hiring Engine</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
                        Engineering the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-sky-500 to-fuchsia-600 dark:from-cyan-400 dark:via-sky-400 dark:to-fuchsia-500">
                            Future of Work.
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
                        {homepageContent.hero.subheadline || 'EZJOB by LENIX matches elite industrial talent with leading technical projects in real-time. Experience precision recruitment powered by advanced AI.'}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <button
                            onClick={() => navigate('/jobs')}
                            className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs uppercase tracking-wider px-8 py-4 rounded-full font-bold shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 group cursor-pointer"
                        >
                            Find Opportunities
                            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                        <button
                            onClick={() => navigate('/register', { state: { role: UserRole.EMPLOYER } })}
                            className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 hover:border-cyan-400/60 font-mono text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px] text-cyan-600 dark:text-cyan-400">add_circle</span>
                            Post a Role
                        </button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-6 pt-8 mt-2 border-t border-slate-200 dark:border-slate-800/90">
                        <div>
                            <span className="block text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">12k+</span>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Projects</span>
                        </div>
                        <div>
                            <span className="block text-2xl sm:text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">98%</span>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Match Rate</span>
                        </div>
                        <div>
                            <span className="block text-2xl sm:text-3xl font-extrabold text-fuchsia-600 dark:text-fuchsia-400">24h</span>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg. Placement</span>
                        </div>
                    </div>
                </div>

                {/* Hero Right Visual */}
                <div className="lg:col-span-5 relative hidden lg:block">
                    <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 transition-colors">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-2">LENIX MATCH ENGINE v2.5</span>
                            </div>
                            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800/50 font-bold">LIVE STREAM</span>
                        </div>

                        {/* Simulated Match Card */}
                        <div className="mt-6 space-y-4">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/40 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                                            MO
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Marcus O'Reilly</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Heavy Machinery Operator</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                                        94% MATCH
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 w-[94%] rounded-full"></div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:border-fuchsia-500/40 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center font-bold text-xs">
                                            EW
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Elena Wong</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">High Voltage Specialist</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-mono text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-950/80 border border-fuchsia-300 dark:border-fuchsia-800 px-2 py-0.5 rounded-full font-bold">
                                        91% MATCH
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-fuchsia-400 to-orange-400 w-[91%] rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                            <span>Verification Protocol: SECURE</span>
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold">1 Click Connect &rarr;</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const HighVelocityRolesSection = () => {
    const navigate = useNavigate();

    const sampleRoles = [
        {
            title: "Lead Structural Architect",
            desc: "Oversee structural integrity for major commercial tower projects. Advanced CAD and site oversight.",
            category: "Immediate Start",
            color: "border-orange-500",
            badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
            rate: "$95 - $120 / hr",
            location: "Singapore CBD"
        },
        {
            title: "Industrial Pipefitter & TIG Welder",
            desc: "High-pressure stainless steel pipe fabrication, ISO compliant blueprint reading and hydro testing.",
            category: "Hot Role",
            color: "border-fuchsia-500",
            badgeColor: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
            rate: "$65 - $80 / hr",
            location: "Jurong Island, SG"
        },
        {
            title: "High-Voltage Substation Technician",
            desc: "Installation, preventative maintenance, and troubleshooting of 66kV industrial switchgear systems.",
            category: "Verified Talent",
            color: "border-cyan-500",
            badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
            rate: "$55 - $75 / hr",
            location: "Johor Bahru / SG"
        }
    ];

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-colors duration-300">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-bold">Featured Opportunities</span>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">High-Velocity Roles</h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">Real-time matching for industrial, engineering, and certified technical specialists.</p>
                </div>
                <button 
                    onClick={() => navigate('/jobs')}
                    className="inline-flex items-center gap-2 text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 font-mono text-xs uppercase font-bold transition-colors self-start md:self-auto cursor-pointer"
                >
                    View All Active Roles
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sampleRoles.map((role, idx) => (
                    <div 
                        key={idx}
                        className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border-l-4 ${role.color} border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group`}
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase border ${role.badgeColor}`}>
                                    {role.category}
                                </span>
                                <span className="text-slate-400 text-xs font-mono">{role.location}</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors mb-2">
                                {role.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                                {role.desc}
                            </p>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{role.rate}</span>
                            <button
                                onClick={() => navigate('/jobs')}
                                className="bg-slate-900 dark:bg-slate-800 hover:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-mono text-[11px] uppercase px-4 py-2 rounded-full font-semibold transition-colors cursor-pointer"
                            >
                                Apply Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

const FeaturesSection = () => {
    const features = [
        { icon: 'smart_toy', name: 'AI Job Studio', desc: 'Generate complete, optimized job specifications in seconds.' },
        { icon: 'verified_user', name: 'Verified Passport', desc: 'Digital credentialing & authenticated certification records.' },
        { icon: 'bolt', name: 'High-Speed Match', desc: 'Ranked candidate recommendations based on actual trade skills.' },
        { icon: 'shield', name: 'Structural Integrity', desc: 'Enterprise data compliance and fraud-resistant skill scoring.' },
        { icon: 'public', name: 'Cross-Border Mobility', desc: 'Regional deployment ready across SG, MY, and APAC hubs.' },
        { icon: 'picture_as_pdf', name: 'PDF Skill Export', desc: 'Download standardized, print-ready trade portfolios.' },
    ];

    return (
        <section className="py-16 bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-bold">Platform Capabilities</span>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Built for Industrial Precision</h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">Every feature in EZJOB by LENIX is architected to eliminate hiring friction in skilled trades.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 border border-cyan-100 dark:border-cyan-800">
                                <span className="material-symbols-outlined text-[26px]">{f.icon}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{f.name}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const AiInActionSection = () => {
    const [jobTitle, setJobTitle] = useState('Heavy Machinery Operator');
    const [generatedJD, setGeneratedJD] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        if (!jobTitle) return;
        setIsGenerating(true);
        setTimeout(() => {
            setGeneratedJD(
                `REQUISITION: Senior ${jobTitle}\n` +
                `STATUS: High-Priority Deployment\n\n` +
                `SUMMARY:\nWe are deploying a certified Senior ${jobTitle} for multi-million industrial infrastructure operations. The candidate must possess authenticated trade credentials, rigorous safety compliance, and proven on-site execution.\n\n` +
                `CORE REQUIREMENTS:\n` +
                `• 5+ Years verifiable experience in heavy industrial environments\n` +
                `• Valid High-Risk Work License / SafeWork Accreditation\n` +
                `• Equipment mastery & precision load management\n` +
                `• Verified Skill Passport on EZJOB by LENIX (Integrity Score > 85%)`
            );
            setIsGenerating(false);
        }, 600);
    };

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-colors duration-300">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 blur-3xl pointer-events-none"></div>

                <div className="max-w-3xl mx-auto text-center mb-8 relative z-10">
                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">Interactive Demo</span>
                    <h2 className="text-3xl font-extrabold text-white mt-1">EZJOB AI Job Studio in Action</h2>
                    <p className="text-slate-300 text-sm mt-2">Enter a skilled trade title to test the LENIX AI requisition generator.</p>
                </div>

                <div className="max-w-2xl mx-auto relative z-10">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g., Structural Welder, Electrician..."
                            className="flex-grow px-5 py-3.5 bg-slate-950/80 border border-slate-700 text-white rounded-full focus:outline-none focus:border-cyan-400 font-mono text-sm"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs uppercase px-8 py-3.5 rounded-full font-bold shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                        >
                            {isGenerating ? (
                                <span>Generating...</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                    Generate Ad
                                </>
                            )}
                        </button>
                    </div>

                    {generatedJD && (
                        <div className="mt-6 p-6 rounded-2xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed shadow-xl">
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[10px] text-cyan-400 uppercase tracking-widest">
                                <span>AI Studio Output</span>
                                <span>Engine: Gemini 2.5 Flash</span>
                            </div>
                            {generatedJD}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

const ComparisonSection = () => (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-colors duration-300">
        <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-bold">Why We Are Different</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">EZJOB by LENIX vs. Generic Portals</h2>
        </div>

        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="py-4 px-6 font-semibold">Capability</th>
                            <th className="py-4 px-6 font-semibold text-cyan-600 dark:text-cyan-400 text-center">EZJOB by LENIX</th>
                            <th className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400 text-center">Generic Job Boards</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                        <tr>
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">Skilled Trades Specialized Matching</td>
                            <td className="py-4 px-6 text-center text-cyan-600 dark:text-cyan-400 font-bold">Yes (AI Algorithm)</td>
                            <td className="py-4 px-6 text-center text-slate-400">Keyword Only</td>
                        </tr>
                        <tr className="bg-slate-50/60 dark:bg-slate-950/40">
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">Digital Skill Passport & Verification</td>
                            <td className="py-4 px-6 text-center text-cyan-600 dark:text-cyan-400 font-bold">Yes (Integrity Score)</td>
                            <td className="py-4 px-6 text-center text-slate-400">No (PDF Upload only)</td>
                        </tr>
                        <tr>
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">1-Click AI Requisition Studio</td>
                            <td className="py-4 px-6 text-center text-cyan-600 dark:text-cyan-400 font-bold">Built-in (Gemini AI)</td>
                            <td className="py-4 px-6 text-center text-slate-400">Manual Entry</td>
                        </tr>
                        <tr className="bg-slate-50/60 dark:bg-slate-950/40">
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">Direct Worker Video Portfolios</td>
                            <td className="py-4 px-6 text-center text-cyan-600 dark:text-cyan-400 font-bold">Integrated</td>
                            <td className="py-4 px-6 text-center text-slate-400">Not Supported</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>
);

const TestimonialsSection = () => {
    const { homepageContent } = useSiteContent();

    return (
        <section className="py-16 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-bold">Trust & Integrity</span>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Endorsed by Industry Leaders</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {homepageContent.testimonials.map((t) => (
                        <div key={t.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                            <p className="text-slate-700 dark:text-slate-300 italic text-sm leading-relaxed mb-4">"{t.quote}"</p>
                            <p className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400 text-right">{t.author}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FaqSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const { homepageContent } = useSiteContent();

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full transition-colors duration-300">
            <div className="text-center mb-10">
                <span className="font-mono text-xs uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-bold">Support & Information</span>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3">
                {homepageContent.faqs.map((faq, index) => (
                    <div key={faq.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full flex justify-between items-center text-left p-5 font-semibold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                        >
                            <span className="text-base">{faq.q}</span>
                            <span className="font-mono text-lg text-slate-400 ml-4">{openIndex === index ? '−' : '+'}</span>
                        </button>
                        {openIndex === index && (
                            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                                <p>{faq.a}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

const FinalCtaSection = () => {
    const navigate = useNavigate();

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950 text-white relative overflow-hidden transition-colors duration-300">
            <div className="absolute inset-0 pointer-events-none opacity-25" 
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 60%)'
                }}
            />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                    Ready to Deploy or Build Your Career?
                </h2>
                <p className="text-slate-300 text-base max-w-xl mx-auto mb-8 leading-relaxed">
                    Join thousands of verified skilled trades professionals and tier-1 employers on EZJOB by LENIX.
                </p>
                <div className="flex flex-wrap justify-center items-center gap-4">
                    <button
                        onClick={() => navigate('/register', { state: { role: UserRole.WORKER } })}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs uppercase tracking-wider font-bold py-3.5 px-8 rounded-full shadow-lg transition-all cursor-pointer"
                    >
                        Create Skill Passport
                    </button>
                    <button
                        onClick={() => navigate('/register', { state: { role: UserRole.EMPLOYER } })}
                        className="bg-slate-950 dark:bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-mono text-xs uppercase tracking-wider font-semibold py-3.5 px-8 rounded-full transition-all cursor-pointer"
                    >
                        Post Requisition
                    </button>
                </div>
            </div>
        </section>
    );
};

const HomePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <HeroSection />
            <HighVelocityRolesSection />
            <FeaturesSection />
            <AiInActionSection />
            <ComparisonSection />
            <TestimonialsSection />
            <FaqSection />
            <FinalCtaSection />
        </div>
    );
};

export default HomePage;

