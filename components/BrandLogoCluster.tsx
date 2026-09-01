import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface BrandLogoClusterProps {
    /** CMS-configured product logo URL (siteAssets.logoUrl). Falls back to the bundled default when empty. */
    ezjobLogoUrl?: string;
    /** Visual treatment: 'header' (larger, hover-scale, used inside the Header's Link) or 'footer' (compact, static). */
    variant?: 'header' | 'footer';
}

/**
 * Shared "Clarity x LENIX x EZJOB" logo cluster used by both Header and Footer.
 * Renders only the inner logo group — the caller supplies the outer wrapper
 * (Header wraps it in a <Link>, Footer wraps it in a plain div) since the two
 * wrappers differ (navigation vs. static branding block).
 */
const BrandLogoCluster: React.FC<BrandLogoClusterProps> = ({ ezjobLogoUrl, variant = 'header' }) => {
    const { isDark } = useTheme();

    const clarityLogoSrc = '/assets/clarity-logo.jpeg';
    const lenixLogoSrc = isDark ? '/assets/lenix-logo-dark.jpeg' : '/assets/lenix-logo-light.png';
    const defaultEzjobLogoSrc = isDark ? '/assets/ezjob-logo-dark.png' : '/assets/ezjob-logo-light.png';
    // Prefer the CMS-configured logo (Site Assets & Branding), fall back to the bundled default.
    const ezjobLogoSrc = ezjobLogoUrl || defaultEzjobLogoSrc;

    if (variant === 'footer') {
        return (
            <>
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
            </>
        );
    }

    return (
        <>
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
        </>
    );
};

export default BrandLogoCluster;
