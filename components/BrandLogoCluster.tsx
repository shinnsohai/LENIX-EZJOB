import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface BrandLogoClusterProps {
    /** CMS-configured product logo URL (siteAssets.logoUrl). Falls back to the bundled default when empty. */
    ezjobLogoUrl?: string;
}

/**
 * "Clarity x LENIX x EZJOB" logo cluster used by the Footer (and other
 * static branding blocks, e.g. AboutUsPage). The Header shows only the
 * EZJOB product mark on its own — see Header.tsx's Logo component — so
 * this component no longer needs a header/footer variant switch.
 */
const BrandLogoCluster: React.FC<BrandLogoClusterProps> = ({ ezjobLogoUrl }) => {
    const { isDark } = useTheme();

    const clarityLogoSrc = '/assets/clarity-logo.jpeg';
    const lenixLogoSrc = isDark ? '/assets/lenix-logo-dark.jpeg' : '/assets/lenix-logo-light.png';
    const defaultEzjobLogoSrc = isDark ? '/assets/ezjob-logo-dark.png' : '/assets/ezjob-logo-light.png';
    // Prefer the CMS-configured logo (Site Assets & Branding), fall back to the bundled default.
    const ezjobLogoSrc = ezjobLogoUrl || defaultEzjobLogoSrc;

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
};

export default BrandLogoCluster;
