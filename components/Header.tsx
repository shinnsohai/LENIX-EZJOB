import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { useSiteContent } from '../contexts/SiteContentContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { siteAssets } = useSiteContent();
    const { isDark, toggleTheme } = useTheme();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    // Determine appropriate logos based on theme
    const clarityLogoSrc = '/assets/clarity-logo.jpeg';
    const lenixLogoSrc = isDark ? '/assets/lenix-logo-dark.jpeg' : '/assets/lenix-logo-light.png';
    const ezjobLogoSrc = isDark ? '/assets/ezjob-logo-dark.png' : '/assets/ezjob-logo-light.png';

    const Logo = () => (
        <Link 
            to="/" 
            className="flex items-center gap-2 sm:gap-3 group select-none py-1 px-2.5 sm:px-3.5 rounded-2xl bg-gradient-to-r from-slate-50/80 via-white/90 to-slate-50/80 dark:from-slate-900/80 dark:via-slate-950/90 dark:to-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:shadow-cyan-500/5 hover:border-cyan-500/40 transition-all duration-300"
        >
            {/* 1. Clarity (Holding Company) */}
            <div className={`p-1 rounded-xl transition-all duration-300 flex items-center justify-center ${
                isDark 
                    ? 'bg-gradient-to-b from-white via-slate-100 to-slate-200 shadow-md border border-slate-300' 
                    : 'bg-gradient-to-b from-white to-slate-50 shadow-sm border border-slate-200/60'
            }`}>
                <img 
                    src={clarityLogoSrc} 
                    alt="Clarity E&C Holding Company" 
                    className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
            </div>

            {/* Multiplier Cross */}
            <span className="text-slate-400 dark:text-cyan-400/80 font-mono text-sm sm:text-base font-extrabold select-none px-0.5 sm:px-1">
                ✕
            </span>

            {/* 2. Lenix (Current Company) */}
            <div className={`p-1 rounded-xl transition-all duration-300 flex items-center justify-center ${
                isDark 
                    ? 'bg-gradient-to-b from-black via-slate-950 to-black shadow-lg shadow-cyan-500/10 border border-slate-800' 
                    : 'bg-gradient-to-b from-white via-slate-50 to-white shadow-sm border border-slate-200/60'
            }`}>
                <img 
                    src={lenixLogoSrc} 
                    alt="LENIX Company Logo" 
                    className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
            </div>

            {/* Subtle Gradient Vertical Divider */}
            <div className="h-9 w-[1.5px] bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent hidden sm:block mx-1"></div>

            {/* 3. EZJOB (Product Logo) */}
            <div className={`p-1 rounded-xl transition-all duration-300 flex items-center justify-center ${
                isDark 
                    ? 'bg-gradient-to-b from-slate-900/60 to-transparent' 
                    : 'bg-gradient-to-b from-white/80 to-transparent'
            }`}>
                <img 
                    src={ezjobLogoSrc} 
                    alt="EZJOB Product Logo" 
                    className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
            </div>
        </Link>
    );

    return (
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between min-h-[92px] py-2 sm:py-3">
                    <div className="flex items-center">
                        <Logo />
                    </div>

                    {/* Navigation links */}
                    <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
                        <Link 
                            to="/jobs" 
                            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                                isActive('/jobs') 
                                    ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/80 font-semibold shadow-sm' 
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                            }`}
                        >
                            Find Jobs
                        </Link>
                        
                        {user?.role === UserRole.ADMIN && (
                            <Link 
                                to="/admin/dashboard" 
                                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                                    isActive('/admin/dashboard') 
                                        ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 font-semibold shadow-sm' 
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                                }`}
                            >
                                Admin Console
                            </Link>
                        )}

                        {user?.role === UserRole.EMPLOYER ? (
                            <Link 
                                to="/employer/dashboard" 
                                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                                    isActive('/employer/dashboard') 
                                        ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/80 font-semibold shadow-sm' 
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                                }`}
                            >
                                Employer Studio
                            </Link>
                        ) : (
                            <Link 
                                to="/register" 
                                state={{ role: UserRole.EMPLOYER }}
                                className="px-3.5 py-2 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                            >
                                For Employers
                            </Link>
                        )}

                        {user?.role === UserRole.WORKER ? (
                            <>
                                <Link 
                                    to="/worker/dashboard" 
                                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                                        isActive('/worker/dashboard') 
                                            ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/80 font-semibold shadow-sm' 
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                                    }`}
                                >
                                    Skill Passport
                                </Link>
                                <Link 
                                    to="/worker/applications" 
                                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                                        isActive('/worker/applications') 
                                            ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/80 font-semibold shadow-sm' 
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                                    }`}
                                >
                                    Applied Jobs
                                </Link>
                            </>
                        ) : (
                            <Link 
                                to="/register" 
                                state={{ role: UserRole.WORKER }}
                                className="px-3.5 py-2 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                            >
                                Skill Passport
                            </Link>
                        )}

                        <Link 
                            to="/blog" 
                            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                                isActive('/blog') 
                                    ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/80 font-semibold shadow-sm' 
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                            }`}
                        >
                            Insights
                        </Link>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            aria-label="Toggle light and dark theme"
                            className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-cyan-400 hover:scale-105 hover:border-cyan-500 transition-all cursor-pointer shadow-sm"
                            title={isDark ? "Switch to Light Theme (White background)" : "Switch to Dark Theme (Black background)"}
                        >
                            {isDark ? (
                                <Sun size={18} className="text-amber-400 animate-spin-slow" />
                            ) : (
                                <Moon size={18} className="text-slate-700" />
                            )}
                        </button>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex flex-col text-right">
                                    <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">{user.identifier}</span>
                                    <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">{user.role}</span>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-cyan-100 dark:ring-cyan-900">
                                    {user.identifier.charAt(0).toUpperCase()}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs uppercase px-3 py-2 rounded-full transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link 
                                    to="/login" 
                                    className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono text-xs uppercase px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                                >
                                    Login
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs uppercase px-5 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;