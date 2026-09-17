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
 *
 * Deliberately two rows, not one wide row: Clarity + LENIX (the corporate
 * lineage — de-emphasized, small) on top, EZJOB (the actual product,
 * what a visitor actually cares about) large underneath. Was previously a
 * single flex-wrap row of three logos + two dividers; once the logo
 * assets were trimmed to their real (wider) aspect ratios that row no
 * longer fit the Footer's narrow column at most widths, so it wrapped —
 * EZJOB dropping alone onto its own line with a dangling divider above
 * it. Making that intentional (a real two-row layout, no wrap-dependent
 * positioning) fixes the awkward wrap and reads better anyway: the
 * product mark now gets the visual weight it should have.
 */
const BrandLogoCluster: React.FC<BrandLogoClusterProps> = ({ ezjobLogoUrl }) => {
    const { isDark } = useTheme();

    const clarityLogoSrc = '/assets/clarity-logo.jpeg';
    const lenixLogoSrc = isDark ? '/assets/lenix-logo-dark.jpeg' : '/assets/lenix-logo-light.png';
    const defaultEzjobLogoSrc = isDark ? '/assets/ezjob-logo-dark.png' : '/assets/ezjob-logo-light.png';
    // Prefer the CMS-configured logo (Site Assets & Branding), fall back to the bundled default.
    const ezjobLogoSrc = ezjobLogoUrl || defaultEzjobLogoSrc;

    return (
        <div className="flex flex-col items-center gap-2.5">
            <div className="flex items-center gap-2">
                <div className={`p-1 rounded-xl ${isDark ? 'bg-gradient-to-b from-white via-slate-100 to-slate-200 border border-slate-300 shadow-sm' : 'bg-white shadow-sm border border-slate-200/60'}`}>
                    <img
                        src={clarityLogoSrc}
                        alt="Clarity E&C Holding Company"
                        width={107}
                        height={100}
                        className="h-8 sm:h-9 w-auto object-contain"
                    />
                </div>
                <span className="text-slate-400 dark:text-cyan-400/70 font-mono text-xs font-bold select-none px-0.5">✕</span>
                <div className={`p-1 rounded-xl ${isDark ? 'bg-gradient-to-b from-black via-slate-950 to-black border border-slate-800' : 'bg-white shadow-sm border border-slate-200/60'}`}>
                    <img
                        src={lenixLogoSrc}
                        alt="LENIX Company Logo"
                        width={260}
                        height={100}
                        className="h-6 sm:h-7 w-auto object-contain"
                    />
                </div>
            </div>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
            <img
                src={ezjobLogoSrc}
                alt="EZJOB Product Logo"
                width={310}
                height={100}
                className="h-9 sm:h-10 w-auto object-contain"
            />
        </div>
    );
};

export default BrandLogoCluster;
