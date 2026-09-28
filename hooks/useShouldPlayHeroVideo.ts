import { useEffect, useState } from 'react';

/** Whether an autoplaying background video should actually mount.
 * False (poster image only, no <video> in the DOM at all — not just hidden)
 * under prefers-reduced-motion, or when the browser's own Data Saver mode
 * (navigator.connection.saveData) is on — a real, user-expressed "don't
 * download extra video" preference, unlike guessing from viewport width.
 * Plays on every screen size otherwise, phones included. Re-evaluates live
 * if either signal changes (OS setting or Data Saver toggling mid-session). */
export function useShouldPlayHeroVideo() {
    const [shouldPlay, setShouldPlay] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const connection = (navigator as any).connection;
        const update = () => setShouldPlay(!motionQuery.matches && !(connection && connection.saveData));
        update();
        motionQuery.addEventListener('change', update);
        connection?.addEventListener?.('change', update);
        return () => {
            motionQuery.removeEventListener('change', update);
            connection?.removeEventListener?.('change', update);
        };
    }, []);

    return shouldPlay;
}
