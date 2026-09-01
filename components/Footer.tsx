import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../contexts/SiteContentContext';
import { useTheme } from '../contexts/ThemeContext';

const Footer: React.FC = () => {
    const { quickLinks, siteAssets } = useSiteContent();
    const { isDark } = useTheme();

    const clarityLogoSrc = '/assets/clarity-logo.jpeg';
    const lenixLogoSrc = isDark ? '/assets/lenix-logo-dark.jpeg' : '/assets/lenix-logo-light.png';
    const ezjobLogoSrc = isDark ? '/assets/ezjob-logo-dark.png' : '/assets/ezjob-logo-light.png';

    return (
        <footer className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* Column 1: Logo and About */}
                    <div className="md:col-span-1 flex flex-col gap-3">
                        <div className="flex items-center gap-2.5 flex-wrap p-2 rounded-2xl bg-gradient-to-r from-slate-200/60 via-white/80 to-slate-200/60 dark:from-slate-900/90 dark:via-slate-950/80 dark:to-slate-900/90 border border-slate-200 dark:border-slate-800/80 w-fit">
                            <div className={`p-1 rounded-xl ${isDark ? 'bg-gradient-to-b from-white via-slate-100 to-slate-200 border border-slate-300 shadow-sm' : 'bg-white shadow-sm border border-slate-200/60'}`}>
                                <img 
                                    src={clarityLogoSrc} 
                                    alt="Clarity E&C Holding Company" 
                                    className="h-10 sm:h-11 w-auto object-contain" 
                                />
                            </div>
                            <span className="text-slate-400 dark:text-cyan-400/70 font-mono text-xs sm:text-sm font-bold select-none px-0.5">✕</span>
                            <div className={`p-1 rounded-xl ${isDark ? 'bg-gradient-to-b from-black via-slate-950 to-black border border-slate-800' : 'bg-white shadow-sm border border-slate-200/60'}`}>
                                <img 
                                    src={lenixLogoSrc} 
                                    alt="LENIX Company Logo" 
                                    className="h-8 sm:h-9 w-auto object-contain" 
                                />
                            </div>
                            <div className="h-6 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent mx-0.5"></div>
                            <img 
                                src={ezjobLogoSrc} 
                                alt="EZJOB Product Logo" 
                                className="h-8 sm:h-9 w-auto object-contain" 
                            />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                            A Clarity E&C Holding enterprise solution powered by LENIX technology. Precision recruitment and authenticated skill credentialing for the skilled trades.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                                AI Engine Active
                            </span>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-4">Platform Navigation</h3>
                        <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                            <li><Link to="/jobs" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Search All Jobs</Link></li>
                            {quickLinks.map(link => (
                                <li key={link.id}>
                                    <Link to={link.url} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{link.text}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Legal */}
                    <div>
                        <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-4">Compliance & Trust</h3>
                        <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                            <li><Link to="/privacy" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
                            <li><span className="text-slate-400 dark:text-slate-500 cursor-not-allowed">ISO 27001 Security (Compliant)</span></li>
                        </ul>
                    </div>

                    {/* Column 4: Newsletter & Contact */}
                    <div>
                        <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-4">Stay Ahead</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Get real-time alerts for high-priority skilled trade requisitions.</p>
                        <form className="flex" onSubmit={(e) => { e.preventDefault(); alert('Subscribed to EZJOB by LENIX alerts!'); }}>
                            <input 
                                type="email" 
                                required
                                placeholder="work@company.com" 
                                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-l-lg focus:outline-none focus:border-cyan-500" 
                            />
                            <button 
                                type="submit" 
                                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2.5 rounded-r-lg font-mono text-xs font-semibold transition-all cursor-pointer"
                            >
                                Join
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <p>&copy; {new Date().getFullYear()} EZJOB by LENIX. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <span className="text-slate-500">Singapore • Malaysia • Regional Hubs</span>
                        <Link to="/admin/login" className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-mono transition-colors">Console</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;