import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import type { CompanyPageContent } from '../../types';

type Talent = NonNullable<CompanyPageContent['talents']>[number];

const MASK = 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)';

const initials = (name: string) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('');

const TalentCard: React.FC<{ talent: Talent; decorative: boolean }> = ({ talent, decorative }) => {
    const rating = Math.max(1, Math.min(5, Math.round(talent.rating ?? 5)));
    return (
        <motion.div
            initial="rest"
            animate="rest"
            whileHover="hover"
            whileFocus="hover"
            tabIndex={decorative ? -1 : 0}
            aria-hidden={decorative || undefined}
            className="group relative h-20 px-6 shrink-0 flex items-center gap-4 rounded-full bg-white border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:bg-slate-900 dark:border-slate-700/70 dark:hover:border-slate-600"
        >
            {talent.avatar_url ? (
                <img
                    src={talent.avatar_url}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 shrink-0 rounded-full object-cover object-top bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-slate-800 dark:to-slate-700"
                />
            ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white">
                    {initials(talent.name)}
                </span>
            )}
            <span className="flex flex-col whitespace-nowrap">
                <span className="text-[14px] font-semibold text-[#0a1b33] dark:text-white">{talent.name}</span>
                <span className="text-[12px] text-slate-500 dark:text-slate-400">{talent.role}</span>
            </span>

            {/* Testimonial popup. x is set through motion (not a translate
                class) because motion writes the transform for scale and
                would otherwise overwrite a Tailwind translate. */}
            <motion.div
                variants={{ rest: { opacity: 0, scale: 0.95 }, hover: { opacity: 1, scale: 1 } }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ x: '-50%' }}
                className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 w-72 rounded-xl bg-[#0a1b33] p-4 text-white shadow-xl"
            >
                <span className="flex gap-0.5 text-amber-400" aria-label={`${rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={14} className={i < rating ? 'fill-current' : 'opacity-30'} />
                    ))}
                </span>
                <p className="mt-2 whitespace-normal text-[13px] leading-relaxed">“{talent.testimonial}”</p>
                <p className="mt-2 text-[11px] text-slate-400">{talent.name} · {talent.role}</p>
            </motion.div>
        </motion.div>
    );
};

/** Infinite right-scrolling row of talents (see .company-marquee-track in
 * index.css). The list renders twice so -50% -> 0 loops seamlessly; the
 * second copy is hidden from assistive tech and keyboard focus. The bottom
 * padding is room for the hover popup, which would otherwise be clipped by
 * the horizontal overflow mask. */
// With only a few talents, one copy of the row could be narrower than the
// screen and leave a visible gap in the loop, so short lists are repeated
// up to this length first (repeats are decorative, like the second copy).
const MIN_ITEMS_PER_COPY = 8;

const TalentMarquee: React.FC<{ talents: Talent[] }> = ({ talents }) => {
    const repeats = Math.max(1, Math.ceil(MIN_ITEMS_PER_COPY / talents.length));
    const row = Array.from({ length: repeats }, () => talents).flat();
    return (
        <div
            className="company-marquee-viewport relative overflow-hidden pt-2 pb-40"
            style={{ maskImage: MASK, WebkitMaskImage: MASK }}
        >
            {/* pr-4 matches gap-4 so both halves are exactly equal width —
                without it, -50% lands half a gap short and the loop jumps. */}
            <div className="company-marquee-track flex w-max gap-4 pr-4 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
                {[0, 1].map(copy =>
                    row.map((talent, i) => (
                        <TalentCard key={`${copy}-${i}`} talent={talent} decorative={copy === 1 || i >= talents.length} />
                    ))
                )}
            </div>
        </div>
    );
};

export default TalentMarquee;
