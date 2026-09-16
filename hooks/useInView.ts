import { useEffect, useRef, useState } from 'react';

/** Fires once, true, the first time the element crosses 15% into the
 * viewport — never resets back to false. Settles instantly true under
 * prefers-reduced-motion, so a scroll-reveal degrades to "just visible"
 * instead of a static element permanently waiting for an observer it'll
 * never meaningfully animate for. Extracted from HomePage.tsx (originally
 * a local hook there) once ServicesPage/SolutionsPage needed the exact same
 * scroll-trigger pattern for their illustration animations — three call
 * sites is the point past which a copy-pasted hook should live in one file. */
export function useInView<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState<boolean>(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        if (inView || !ref.current) return;
        const node = ref.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        observer.observe(node);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { ref, inView };
}
