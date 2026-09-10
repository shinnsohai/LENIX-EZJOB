import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { useSiteContent } from '../contexts/SiteContentContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Menu, X } from 'lucide-react';
import BrandLogoCluster from './BrandLogoCluster';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { siteAssets } = useSiteContent();
    const { isDark, toggleTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setIsMobileMenuOpen(false);
        navigate('/');
    };

    // Exact match, or match plus a path-boundary ('/') so sibling routes sharing a
    // prefix (e.g. /jobs vs /jobs-something) don't both light up.
    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const navLinkClass = (path: string) =>
        `px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
            isActive(path)
                ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/80 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
        }`;

    const mobileNavLinkClass = (path: string) =>
        `block w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            isActive(path)
                ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/80 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
        }`;

    const Logo = () => (
        <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 group select-none py-1 px-2.5 sm:px-3.5 rounded-2xl bg-gradient-to-r from-slate-50/80 via-white/90 to-slate-50/80 dark:from-slate-900/80 dark:via-slate-950/90 dark:to-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:shadow-cyan-500/5 hover:border-cyan-500/40 transition-all duration-300"
        >
            <BrandLogoCluster ezjobLogoUrl={siteAssets.logoUrl} variant="header" />
        </Link>
    );

    return (
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between min-h-[92px] py-2 sm:py-3">
                    <div className="flex items-center">
                        <Logo />
                    </div>

                    {/* Navigation links (desktop) */}
                    <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
                        <Link to="/jobs" className={navLinkClass('/jobs')}>
                            Find Jobs
                        </Link>

                        {user?.role === UserRole.ADMIN && (
                            <Link to="/admin/dashboard" className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                                isActive('/admin/dashboard')
                                    ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 font-semibold shadow-sm'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                            }`}>
                                Admin Console
                            </Link>
                        )}

                        {user?.role === UserRole.EMPLOYER || user?.role === UserRole.ADMIN ? (
                            <Link to="/employer/dashboard" className={navLinkClass('/employer/dashboard')}>
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

                        {user?.role === UserRole.WORKER || user?.role === UserRole.ADMIN ? (
                            <>
                                <Link to="/worker/dashboard" className={navLinkClass('/worker/dashboard')}>
                                    Skill Passport
                                </Link>
                                <Link to="/worker/applications" className={navLinkClass('/worker/applications')}>
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

                        <Link to="/blog" className={navLinkClass('/blog')}>
                            Insights
                        </Link>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
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
                            <div className="hidden md:flex items-center gap-3">
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
                            <div className="hidden md:flex items-center gap-2">
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

                        {/* Mobile hamburger toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(prev => !prev)}
                            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                            aria-expanded={isMobileMenuOpen}
                            className="md:hidden p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-cyan-500 transition-all cursor-pointer shadow-sm"
                        >
                            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>

                {/* Mobile navigation panel */}
                {isMobileMenuOpen && (
                    <div className="md:hidden pb-4 border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1">
                        <Link to="/jobs" className={mobileNavLinkClass('/jobs')} onClick={closeMobileMenu}>
                            Find Jobs
                        </Link>

                        {user?.role === UserRole.ADMIN && (
                            <Link
                                to="/admin/dashboard"
                                onClick={closeMobileMenu}
                                className={`block w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    isActive('/admin/dashboard')
                                        ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 font-semibold shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                                }`}
                            >
                                Admin Console
                            </Link>
                        )}

                        {user?.role === UserRole.EMPLOYER || user?.role === UserRole.ADMIN ? (
                            <Link to="/employer/dashboard" className={mobileNavLinkClass('/employer/dashboard')} onClick={closeMobileMenu}>
                                Employer Studio
                            </Link>
                        ) : (
                            <Link
                                to="/register"
                                state={{ role: UserRole.EMPLOYER }}
                                onClick={closeMobileMenu}
                                className="block w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                            >
                                For Employers
                            </Link>
                        )}

                        {user?.role === UserRole.WORKER || user?.role === UserRole.ADMIN ? (
                            <>
                                <Link to="/worker/dashboard" className={mobileNavLinkClass('/worker/dashboard')} onClick={closeMobileMenu}>
                                    Skill Passport
                                </Link>
                                <Link to="/worker/applications" className={mobileNavLinkClass('/worker/applications')} onClick={closeMobileMenu}>
                                    Applied Jobs
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/register"
                                state={{ role: UserRole.WORKER }}
                                onClick={closeMobileMenu}
                                className="block w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                            >
                                Skill Passport
                            </Link>
                        )}

                        <Link to="/blog" className={mobileNavLinkClass('/blog')} onClick={closeMobileMenu}>
                            Insights
                        </Link>

                        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                            {user ? (
                                <div className="flex items-center justify-between gap-3 px-4 py-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">{user.identifier}</span>
                                        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">{user.role}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs uppercase px-3 py-2 rounded-full transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4">
                                    <Link
                                        to="/login"
                                        onClick={closeMobileMenu}
                                        className="flex-1 text-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono text-xs uppercase px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={closeMobileMenu}
                                        className="flex-1 text-center bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs uppercase px-4 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all"
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;
