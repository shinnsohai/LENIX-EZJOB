import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** React Router doesn't reset scroll position on navigation — without this,
 * clicking a link while scrolled down (e.g. the header logo from deep in a
 * long page) changes the URL but leaves the viewport exactly where it was,
 * which reads as "the link did nothing." Scrolls to the top on every
 * pathname change; ignores query/hash-only changes so in-page anchors and
 * filter updates aren't yanked back to the top. */
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
