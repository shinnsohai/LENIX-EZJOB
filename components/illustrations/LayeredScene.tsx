import React, { useEffect } from 'react';
import { useInView } from '../../hooks/useInView';

export type SceneId = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09';

interface LayeredSceneProps {
    id: SceneId;
    baseSrc?: string;
    finalSrc: string;
    alt: string;
    /** Scene 04 is the one deliberately load-triggered scene (see
     * index.css's Services/Solutions illustration system comment) — it
     * greets the page already settling instead of waiting for scroll. */
    trigger?: 'scroll' | 'load';
}

function sceneLayers(id: SceneId, finalSrc: string): React.ReactNode {
    switch (id) {
        case '01':
            return (
                <div className="layer-sprite shield-sprite">
                    <img className="layer-source" src={finalSrc} alt="" />
                </div>
            );
        case '02':
            return (
                <>
                    <svg className="layer-vector" viewBox="0 0 1536 1024" aria-hidden="true">
                        <circle className="toggle-layer" cx="778" cy="310" r="17" fill="#0f172a" />
                    </svg>
                    <div className="layer-sprite document-card document-card--1">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                    <div className="layer-sprite document-card document-card--2">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                    <div className="layer-sprite document-card document-card--3">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                    <div className="layer-sprite document-card document-card--4">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                </>
            );
        case '03':
            return (
                <svg className="layer-vector" viewBox="0 0 1536 1024" aria-hidden="true">
                    <defs>
                        <linearGradient id="routeGradient03" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#06b6d4" />
                            <stop offset="1" stopColor="#3b82f6" />
                        </linearGradient>
                        <mask id="routeMask03">
                            <path
                                className="route-mask"
                                pathLength={1}
                                d="M318 575 C450 560 468 634 590 636 C740 638 806 624 928 628 C1050 632 1115 704 1242 664"
                                fill="none"
                                stroke="white"
                                strokeWidth="20"
                                strokeLinecap="round"
                            />
                        </mask>
                    </defs>
                    <path
                        d="M318 575 C450 560 468 634 590 636 C740 638 806 624 928 628 C1050 632 1115 704 1242 664"
                        fill="none"
                        stroke="url(#routeGradient03)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray="8 17"
                        mask="url(#routeMask03)"
                    />
                    <g fill="#f0f9ff" stroke="url(#routeGradient03)" strokeWidth="7" mask="url(#routeMask03)">
                        <circle cx="318" cy="575" r="13" />
                        <circle cx="928" cy="628" r="13" />
                        <circle cx="1242" cy="664" r="13" />
                    </g>
                </svg>
            );
        case '04':
            return (
                <div className="layer-sprite matched-worker-sprite">
                    <img className="layer-source" src={finalSrc} alt="" />
                </div>
            );
        case '05':
            return (
                <>
                    <div className="layer-sprite zone-sprite zone-sprite--1">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                    <div className="layer-sprite zone-sprite zone-sprite--2">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                    <div className="layer-sprite zone-sprite zone-sprite--3">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                </>
            );
        case '06':
            return (
                <>
                    <svg className="layer-vector split-lines" viewBox="0 0 1536 1024" aria-hidden="true">
                        <defs>
                            <marker id="arrow06" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                                <path d="M0 0L10 5L0 10" fill="none" stroke="#0f172a" strokeWidth="1.6" />
                            </marker>
                        </defs>
                        <path
                            d="M768 278 C690 300 565 315 490 360 M768 278 L768 360 M768 278 C850 300 970 315 1048 360"
                            fill="none"
                            stroke="#0f172a"
                            strokeWidth="4"
                            strokeLinecap="round"
                            markerEnd="url(#arrow06)"
                        />
                        <path d="M490 516V612 M768 516V612 M1048 516V612" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                        <g fill="#f0f9ff" stroke="#0f172a" strokeWidth="4">
                            <circle cx="490" cy="612" r="9" />
                            <circle cx="768" cy="612" r="9" />
                            <circle cx="1048" cy="612" r="9" />
                        </g>
                    </svg>
                    <div className="layer-sprite source-document">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                    <div className="layer-sprite split-document split-document--1">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                    <div className="layer-sprite split-document split-document--2">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                    <div className="layer-sprite split-document split-document--3">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                </>
            );
        case '07':
            return (
                <svg className="layer-vector" viewBox="0 0 1536 1024" aria-hidden="true">
                    <defs>
                        <linearGradient id="ringGradient07" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#06b6d4" />
                            <stop offset="1" stopColor="#3b82f6" />
                        </linearGradient>
                    </defs>
                    <circle
                        className="verification-ring"
                        pathLength={1}
                        cx="768"
                        cy="448"
                        r="108"
                        fill="none"
                        stroke="url(#ringGradient07)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        transform="rotate(-90 768 448)"
                    />
                </svg>
            );
        case '08':
            return (
                <>
                    <div className="layer-sprite badge-sprite badge-sprite--1">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                    <div className="layer-sprite badge-sprite badge-sprite--2">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                    <div className="layer-sprite badge-sprite badge-sprite--3">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                    <div className="layer-sprite badge-sprite badge-sprite--4">
                        <img className="layer-source" src={finalSrc} alt="" />
                    </div>
                </>
            );
        case '09':
            return (
                <svg className="layer-vector" viewBox="0 0 1536 1024" aria-hidden="true">
                    <defs>
                        <linearGradient id="sparkGradient09" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#06b6d4" />
                            <stop offset="1" stopColor="#3b82f6" />
                        </linearGradient>
                    </defs>
                    <g className="spark-layer" fill="none" stroke="url(#sparkGradient09)" strokeWidth="9" strokeLinecap="round">
                        <path d="M782 312V342 M782 420V450 M716 381H746 M818 381H848 M735 334L755 355 M809 407L829 428 M829 334L809 355 M755 407L735 428" />
                    </g>
                </svg>
            );
        default:
            return null;
    }
}

/** One AI-generated illustration, animated as a "layered sprite" — see the
 * Services/Solutions illustration system comment in index.css for the
 * technique and the design-system.md exception it documents. */
export default function LayeredScene({ id, baseSrc, finalSrc, alt, trigger = 'scroll' }: LayeredSceneProps) {
    const { ref, inView } = useInView<HTMLDivElement>();
    const isVisible = trigger === 'load' ? true : inView;

    return (
        <div
            ref={trigger === 'scroll' ? ref : undefined}
            className={`layered-stage${baseSrc ? '' : ' layer-blank'}${isVisible ? ' scene-visible' : ''}`}
        >
            {baseSrc && <img className="layer-base" src={baseSrc} alt={alt} loading="lazy" />}
            {sceneLayers(id, finalSrc)}
        </div>
    );
}
