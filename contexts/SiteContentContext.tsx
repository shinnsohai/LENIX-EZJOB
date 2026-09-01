import React, { useState, createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import type { BlogPost } from '../types';
import {
    getSiteContent,
    saveSiteContent,
    getBlogPosts,
    saveBlogPost as dbSaveBlogPost,
    deleteBlogPost as dbDeleteBlogPost,
} from '../services/db';

// Types
export interface QuickLink {
    id: string;
    text: string;
    url: string;
}

export interface LegalPagesContent {
    privacyPolicy: string;
    termsOfService: string;
}

export interface AboutPageContent {
    title: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    paragraph4: string;
}

export interface ContactPageContent {
    title: string;
    intro: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
}

export interface CareersPageContent {
    title: string;
    intro: string;
    openRolesTitle: string;
    openRolesText: string;
    resumeEmail: string;
}

export interface Testimonial {
    id: string;
    quote: string;
    author: string;
}

export interface FAQ {
    id: string;
    q: string;
    a: string;
}

export interface HomepageContent {
    hero: {
        headline: string;
        subheadline: string;
    };
    testimonials: Testimonial[];
    faqs: FAQ[];
}

export interface SiteAssets {
    logoUrl: string;
    heroBackgroundUrl: string;
}

interface SiteContentContextType {
    quickLinks: QuickLink[];
    legalPagesContent: LegalPagesContent;
    blogPosts: BlogPost[];
    aboutPageContent: AboutPageContent;
    contactPageContent: ContactPageContent;
    careersPageContent: CareersPageContent;
    homepageContent: HomepageContent;
    siteAssets: SiteAssets;
    /** Non-null when the most recent load or save against site_content/blog_posts failed. */
    error: string | null;
    updateQuickLinks: (newLinks: QuickLink[]) => Promise<void>;
    updateLegalPagesContent: (newContent: LegalPagesContent) => Promise<void>;
    /** Upserts a single blog post (create when `id` is absent, update otherwise). */
    saveBlogPost: (post: Partial<BlogPost> & { id?: string }) => Promise<void>;
    deleteBlogPost: (id: string) => Promise<void>;
    updateAboutPageContent: (newContent: AboutPageContent) => Promise<void>;
    updateContactPageContent: (newContent: ContactPageContent) => Promise<void>;
    updateCareersPageContent: (newContent: CareersPageContent) => Promise<void>;
    updateHomepageContent: (newContent: HomepageContent) => Promise<void>;
    updateSiteAssets: (newAssets: SiteAssets) => Promise<void>;
}

// Initial Data (in-memory fallback only — never written back to the DB).
// The real starting content lives in supabase/migrations/0005_seed.sql; these
// are used only if a row is unexpectedly missing/unreachable at runtime.
const initialQuickLinks: QuickLink[] = [
    { id: 'ql1', text: 'About Us', url: '/about' },
    { id: 'ql2', text: 'Contact', url: '/contact' },
    { id: 'ql3', text: 'Careers', url: '/careers' },
    { id: 'ql4', text: 'Blog', url: '/blog' },
];

const initialLegalPages: LegalPagesContent = {
    privacyPolicy: `Your privacy is important to us. It is EZJOB by LENIX's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate. We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.`,
    termsOfService: `By accessing the website at EZJOB by LENIX, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.`
};

const initialAboutPageContent: AboutPageContent = {
    title: 'About EZJOB by LENIX',
    paragraph1: 'EZJOB by LENIX was engineered with a clear mission: to accelerate and empower the skilled trades and technical workforce through state-of-the-art AI matching and verified digital credentialing.',
    paragraph2: 'We eliminate friction in industrial staffing by fusing precision matchmaking with structural integrity.',
    paragraph3: 'By combining the LENIX intelligence engine with verified Skill Passports, workers showcase authenticated certifications and real-world project portfolios, while employers fill critical roles with unmatched speed.',
    paragraph4: 'Whether you are a certified heavy equipment operator, an electrical specialist, or a tier-1 general contractor, EZJOB by LENIX is your enterprise partner for high-performance workforce solutions.'
};

const initialContactPageContent: ContactPageContent = {
    title: 'Contact EZJOB by LENIX',
    intro: 'Have inquiries about enterprise matching, custom integrations, or skilled workforce verification? Connect directly with our team.',
    email: 'support@lenix.ai',
    phone: '+65 6800 5800',
    addressLine1: 'LENIX Innovation Hub, 100 Marina Boulevard',
    addressLine2: 'Singapore 018983'
};

const initialCareersPageContent: CareersPageContent = {
    title: 'Careers at LENIX',
    intro: 'Join our team building the next generation of AI-powered workforce intelligence and skilled trade infrastructure.',
    openRolesTitle: 'Current Opportunities',
    openRolesText: 'We are expanding our AI engineering and talent verification teams. Reach out with your portfolio to',
    resumeEmail: 'careers@lenix.ai'
};

const initialHomepageContent: HomepageContent = {
    hero: {
        headline: 'Engineering the Future of Work. Instant AI-Powered Matching.',
        subheadline: 'EZJOB by LENIX matches elite industrial and technical talent with leading enterprises in real-time.',
    },
    testimonials: [
        { id: 't1', quote: "Matched and deployed 5 certified structural welders within 24 hours. The AI compatibility score was spot-on.", author: "— Regional Project Director, Singapore" },
        { id: 't2', quote: "My verified Skill Passport got me hired on a tier-1 energy project with zero paperwork hassle.", author: "— Senior Heavy Equipment Specialist, Malaysia" },
        { id: 't3', quote: "The integrity verification saved our site compliance team hundreds of vetting hours.", author: "— VP of Talent Acquisition, Infrastructure Corp" },
    ],
    faqs: [
        { id: 'f1', q: "What is EZJOB by LENIX?", a: "EZJOB by LENIX is an AI-driven recruitment and skill verification platform specifically engineered for the skilled trades, construction, electrical, and heavy industrial sectors." },
        { id: 'f2', q: "How does the Digital Skill Passport work?", a: "Workers build a verified digital passport featuring credentials, certifications, video demos, and track records. The system computes a profile integrity score that fast-tracks placement." },
        { id: 'f3', q: "How does the AI Job Studio help employers?", a: "Employers can type simple job parameters, and our Gemini-powered engine instantly crafts comprehensive, industry-tailored job requisitions and candidate match criteria." },
        { id: 'f4', q: "Is the platform secure and compliant?", a: "Yes. We utilize enterprise Google Firebase infrastructure, strict data security policies, and verified identity workflows to ensure full regulatory compliance." }
    ]
};

const initialSiteAssets: SiteAssets = {
    logoUrl: '/assets/lenix-logo-light.png',
    heroBackgroundUrl: '',
};


// Context
const SiteContentContext = createContext<SiteContentContextType | null>(null);

// Hook
export const useSiteContent = () => {
    const context = useContext(SiteContentContext);
    if (!context) {
        throw new Error('useSiteContent must be used within a SiteContentProvider');
    }
    return context;
};

// Provider
export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [quickLinks, setQuickLinks] = useState<QuickLink[]>(initialQuickLinks);
    const [legalPagesContent, setLegalPagesContent] = useState<LegalPagesContent>(initialLegalPages);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [aboutPageContent, setAboutPageContent] = useState<AboutPageContent>(initialAboutPageContent);
    const [contactPageContent, setContactPageContent] = useState<ContactPageContent>(initialContactPageContent);
    const [careersPageContent, setCareersPageContent] = useState<CareersPageContent>(initialCareersPageContent);
    const [homepageContent, setHomepageContent] = useState<HomepageContent>(initialHomepageContent);
    const [siteAssets, setSiteAssets] = useState<SiteAssets>(initialSiteAssets);
    const [error, setError] = useState<string | null>(null);

    // Load content from Postgres (site_content + blog_posts). The DB is the
    // source of truth — the seed migration (0005_seed.sql) already populates
    // every site_content row, so a missing row here is treated as an error
    // case: fall back to an in-memory default for rendering, but never write
    // it back (no more runtime re-seeding of the prod DB).
    useEffect(() => {
        let cancelled = false;

        const load = async <T,>(id: string, setter: (v: T) => void, defaultVal: T) => {
            try {
                const data = await getSiteContent(id);
                if (cancelled) return;
                setter(data !== undefined ? (data as T) : defaultVal);
            } catch (err) {
                console.error(`[SiteContent] Failed to load "${id}":`, err);
                if (cancelled) return;
                setter(defaultVal);
                setError(prev => prev ?? `Failed to load some site content ("${id}"). Showing defaults — changes here may not be saved until this is resolved.`);
            }
        };

        const loadBlogPosts = async () => {
            try {
                const posts = await getBlogPosts();
                if (cancelled) return;
                setBlogPosts(posts);
            } catch (err) {
                console.error('[SiteContent] Failed to load blog posts:', err);
                if (cancelled) return;
                setError(prev => prev ?? 'Failed to load blog posts.');
            }
        };

        Promise.all([
            load('quickLinks', setQuickLinks, initialQuickLinks),
            load('legalPages', setLegalPagesContent, initialLegalPages),
            loadBlogPosts(),
            load('aboutPage', setAboutPageContent, initialAboutPageContent),
            load('contactPage', setContactPageContent, initialContactPageContent),
            load('careersPage', setCareersPageContent, initialCareersPageContent),
            load('homepage', setHomepageContent, initialHomepageContent),
            load('assets', setSiteAssets, initialSiteAssets),
        ]);

        return () => { cancelled = true; };
    }, []);


    const updateQuickLinks = useCallback(async (newLinks: QuickLink[]) => {
        try {
            // Plain array, no {data: [...]} wrapper — site_content.data stores
            // the content value directly for every key, including this one.
            await saveSiteContent('quickLinks', newLinks);
            setQuickLinks(newLinks);
            setError(null);
        } catch (err) {
            console.error('[SiteContent] Failed to save quickLinks:', err);
            setError('Failed to save quick links.');
            throw err;
        }
    }, []);

    const updateLegalPagesContent = useCallback(async (newContent: LegalPagesContent) => {
        try {
            await saveSiteContent('legalPages', newContent);
            setLegalPagesContent(newContent);
            setError(null);
        } catch (err) {
            console.error('[SiteContent] Failed to save legalPages:', err);
            setError('Failed to save legal pages.');
            throw err;
        }
    }, []);

    const saveBlogPost = useCallback(async (post: Partial<BlogPost> & { id?: string }) => {
        try {
            const id = await dbSaveBlogPost(post);
            const saved: BlogPost = {
                id,
                title: post.title ?? '',
                content: post.content ?? '',
                imageUrl: post.imageUrl,
                author: post.author ?? '',
                publishDate: post.publishDate ?? new Date().toISOString(),
            };
            setBlogPosts(prev => {
                const exists = prev.some(p => p.id === id);
                return exists ? prev.map(p => (p.id === id ? saved : p)) : [saved, ...prev];
            });
            setError(null);
        } catch (err) {
            console.error('[SiteContent] Failed to save blog post:', err);
            setError('Failed to save blog post.');
            throw err;
        }
    }, []);

    const deleteBlogPost = useCallback(async (id: string) => {
        try {
            await dbDeleteBlogPost(id);
            setBlogPosts(prev => prev.filter(p => p.id !== id));
            setError(null);
        } catch (err) {
            console.error('[SiteContent] Failed to delete blog post:', err);
            setError('Failed to delete blog post.');
            throw err;
        }
    }, []);

    const updateAboutPageContent = useCallback(async (newContent: AboutPageContent) => {
        try {
            await saveSiteContent('aboutPage', newContent);
            setAboutPageContent(newContent);
            setError(null);
        } catch (err) {
            console.error('[SiteContent] Failed to save aboutPage:', err);
            setError('Failed to save the About page.');
            throw err;
        }
    }, []);

    const updateContactPageContent = useCallback(async (newContent: ContactPageContent) => {
        try {
            await saveSiteContent('contactPage', newContent);
            setContactPageContent(newContent);
            setError(null);
        } catch (err) {
            console.error('[SiteContent] Failed to save contactPage:', err);
            setError('Failed to save the Contact page.');
            throw err;
        }
    }, []);

    const updateCareersPageContent = useCallback(async (newContent: CareersPageContent) => {
        try {
            await saveSiteContent('careersPage', newContent);
            setCareersPageContent(newContent);
            setError(null);
        } catch (err) {
            console.error('[SiteContent] Failed to save careersPage:', err);
            setError('Failed to save the Careers page.');
            throw err;
        }
    }, []);

    const updateHomepageContent = useCallback(async (newContent: HomepageContent) => {
        try {
            await saveSiteContent('homepage', newContent);
            setHomepageContent(newContent);
            setError(null);
        } catch (err) {
            console.error('[SiteContent] Failed to save homepage:', err);
            setError('Failed to save the homepage content.');
            throw err;
        }
    }, []);

    const updateSiteAssets = useCallback(async (newAssets: SiteAssets) => {
        try {
            await saveSiteContent('assets', newAssets);
            setSiteAssets(newAssets);
            setError(null);
        } catch (err) {
            console.error('[SiteContent] Failed to save site assets:', err);
            setError('Failed to save site assets.');
            throw err;
        }
    }, []);

    const value = useMemo(() => ({
        quickLinks,
        legalPagesContent,
        blogPosts,
        aboutPageContent,
        contactPageContent,
        careersPageContent,
        homepageContent,
        siteAssets,
        error,
        updateQuickLinks,
        updateLegalPagesContent,
        saveBlogPost,
        deleteBlogPost,
        updateAboutPageContent,
        updateContactPageContent,
        updateCareersPageContent,
        updateHomepageContent,
        updateSiteAssets,
    }), [quickLinks, legalPagesContent, blogPosts, aboutPageContent, contactPageContent, careersPageContent, homepageContent, siteAssets, error, updateQuickLinks, updateLegalPagesContent, saveBlogPost, deleteBlogPost, updateAboutPageContent, updateContactPageContent, updateCareersPageContent, updateHomepageContent, updateSiteAssets]);

    return (
        <SiteContentContext.Provider value={value}>
            {children}
        </SiteContentContext.Provider>
    );
};
