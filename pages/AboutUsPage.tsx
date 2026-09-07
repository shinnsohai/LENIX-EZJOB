import React from 'react';
import { ShieldCheck, Cpu, Building2, Layers, Award } from 'lucide-react';
import BrandLogoCluster from '../components/BrandLogoCluster';

const AboutUsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 10%, #06b6d4 0%, transparent 60%)'
                }}
            />

            <div className="max-w-5xl mx-auto space-y-16 relative z-10">
                {/* Brand Showcase Header */}
                <div className="text-center space-y-5 animate-fade-in-up">
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-slate-900/90 dark:via-slate-950/90 dark:to-slate-900/90 border border-slate-200 dark:border-slate-800/80 p-2.5 sm:p-3 rounded-2xl shadow-sm mx-auto flex-wrap justify-center">
                        <BrandLogoCluster variant="footer" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        Powering Precision in{' '}
                        <span className="text-gradient-cyan-blue">Skilled Trades Matching</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 font-mono text-sm max-w-2xl mx-auto">
                        An enterprise initiative backed by Clarity E&C Holding and engineered by LENIX.
                    </p>
                </div>

                {/* Hierarchy: Holding, Operating Company, Product */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:items-start">
                    {/* Clarity */}
                    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-[11px] font-mono font-bold uppercase rounded-full">
                                    Holding Company
                                </span>
                                <Building2 size={20} className="text-orange-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clarity E&C</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">铭辉建设有限公司</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                                Provides institutional governance, tier-1 engineering sector standards, regional regulatory compliance, and infrastructure backing.
                            </p>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
                            Governance & Industry Foundation
                        </div>
                    </div>

                    {/* LENIX - the operating company, visually elevated as the current tier */}
                    <div className="bg-white dark:bg-slate-900/90 border border-fuchsia-200/70 dark:border-fuchsia-800/60 p-6 rounded-3xl shadow-md md:-mt-3 flex flex-col justify-between animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="px-2.5 py-1 bg-fuchsia-50 dark:bg-fuchsia-950/80 text-fuchsia-700 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-800 text-[11px] font-mono font-bold uppercase rounded-full">
                                    Operating Company
                                </span>
                                <Layers size={20} className="text-fuchsia-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">LENIX</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">Technology & AI Systems</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                                The technology driving proprietary matching algorithms, digital verification vaults, and cloud-native recruitment architecture.
                            </p>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px] text-fuchsia-600 dark:text-fuchsia-400 font-semibold">
                            Core Engineering & Innovation
                        </div>
                    </div>

                    {/* EZJOB */}
                    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between animate-fade-in-up" style={{ animationDelay: '220ms' }}>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="px-2.5 py-1 bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 text-[11px] font-mono font-bold uppercase rounded-full">
                                    Flagship Product
                                </span>
                                <Award size={20} className="text-cyan-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">EZJOB</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">Skilled Trades Matcher</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                                The next-generation recruitment portal pairing Digital Skill Passports with live AI job matching for accelerated technical placement.
                            </p>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                            End-User Platform & Ecosystem
                        </div>
                    </div>
                </div>

                {/* What the platform delivers - deliberately not a repeat of the boxed
                    3-card grid above: a plain divided band, since these three items are
                    peers with no internal hierarchy to signal via elevation. */}
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
                        What the platform delivers
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
                        <div className="p-6 sm:px-8 flex flex-col">
                            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                                <ShieldCheck size={22} strokeWidth={1.75} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Verified Integrity</h3>
                            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed">All trade certifications and licences are cross-referenced and verified in the Skill Vault.</p>
                        </div>

                        <div className="p-6 sm:px-8 flex flex-col">
                            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                                <Cpu size={22} strokeWidth={1.75} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">AI Velocity Engine</h3>
                            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed">Automated candidate matching and ranking scores based on technical fit and immediate availability.</p>
                        </div>

                        <div className="p-6 sm:px-8 flex flex-col">
                            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                                <Building2 size={22} strokeWidth={1.75} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Cross-Border Pipeline</h3>
                            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed">Connecting regional talent hubs across Singapore, Malaysia, and global technical markets.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUsPage;
