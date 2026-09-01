import React, { useState, createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import type { BlogPost } from '../types';
import { getSiteContent, saveSiteContent } from '../services/db';

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
    updateQuickLinks: (newLinks: QuickLink[]) => void;
    updateLegalPagesContent: (newContent: LegalPagesContent) => void;
    updateBlogPosts: (newPosts: BlogPost[]) => void;
    updateAboutPageContent: (newContent: AboutPageContent) => void;
    updateContactPageContent: (newContent: ContactPageContent) => void;
    updateCareersPageContent: (newContent: CareersPageContent) => void;
    updateHomepageContent: (newContent: HomepageContent) => void;
    updateSiteAssets: (newAssets: SiteAssets) => void;
}

// Initial Data (Defaults if DB is empty)
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

const initialBlogPosts: BlogPost[] = [
    {
        id: 'bp1',
        title: 'Top 10 High-Velocity Construction & Engineering Jobs',
        content: 'An in-depth look at the most in-demand roles in the industrial sector, from structural engineers to certified heavy machinery operators. We explore salary expectations and required certifications.',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop',
        author: 'LENIX Intelligence Team',
        publishDate: '2025-08-15T10:00:00Z',
    },
    {
        id: 'bp2',
        title: 'How LENIX AI Engine Is Revolutionizing Skilled Trades Recruitment',
        content: 'Discover how precision matching and verified skill passports connect top industrial talent with infrastructure projects in minutes rather than weeks.',
        imageUrl: 'https://images.unsplash.com/photo-1678453140515-aa21c81c2dfd?q=80&w=2070&auto=format&fit=crop',
        author: 'LENIX AI Labs',
        publishDate: '2025-08-10T14:30:00Z',
    },
    {
        id: 'bp3',
        title: 'Workforce Mobility & Skill Passport Standards',
        content: 'A comprehensive guide to digital trade credentialing and cross-border project deployment across Singapore, Malaysia, and regional hubs.',
        imageUrl: 'https://images.unsplash.com/photo-1560942485-b2a1a20628fd?q=80&w=1935&auto=format&fit=crop',
        author: 'LENIX Standards Board',
        publishDate: '2025-08-05T09:00:00Z',
    },
];

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
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
    const [aboutPageContent, setAboutPageContent] = useState<AboutPageContent>(initialAboutPageContent);
    const [contactPageContent, setContactPageContent] = useState<ContactPageContent>(initialContactPageContent);
    const [careersPageContent, setCareersPageContent] = useState<CareersPageContent>(initialCareersPageContent);
    const [homepageContent, setHomepageContent] = useState<HomepageContent>(initialHomepageContent);
    const [siteAssets, setSiteAssets] = useState<SiteAssets>(initialSiteAssets);

    // Load initial data from Firestore
    useEffect(() => {
        const loadContent = async () => {
            const load = async (id: string, setter: any, defaultVal: any) => {
                try {
                    const data = await getSiteContent(id);
                    if (data !== undefined) {
                        setter(data);
                    } else {
                        console.log(`[SiteContent] Seeding ${id} with defaults`);
                        await saveSiteContent(id, defaultVal);
                    }
                } catch (error) {
                    console.error(`[SiteContent] Failed to load ${id}:`, error);
                }
            };

            await Promise.all([
                load('quickLinks', (d: any) => setQuickLinks(d.data), { data: initialQuickLinks }),
                load('legalPages', setLegalPagesContent, initialLegalPages),
                load('blogPosts', (d: any) => setBlogPosts(d.data), { data: initialBlogPosts }),
                load('aboutPage', setAboutPageContent, initialAboutPageContent),
                load('contactPage', setContactPageContent, initialContactPageContent),
                load('careersPage', setCareersPageContent, initialCareersPageContent),
                load('homepage', setHomepageContent, initialHomepageContent),
                load('assets', setSiteAssets, initialSiteAssets),
            ]);
        };
        loadContent();
    }, []);


    const updateQuickLinks = useCallback(async (newLinks: QuickLink[]) => {
        setQuickLinks(newLinks);
        await saveSiteContent('quickLinks', { data: newLinks });
    }, []);

    const updateLegalPagesContent = useCallback(async (newContent: LegalPagesContent) => {
        setLegalPagesContent(newContent);
        await saveSiteContent('legalPages', newContent);
    }, []);

    const updateBlogPosts = useCallback(async (newPosts: BlogPost[]) => {
        setBlogPosts(newPosts);
        await saveSiteContent('blogPosts', { data: newPosts });
    }, []);

    const updateAboutPageContent = useCallback(async (newContent: AboutPageContent) => {
        setAboutPageContent(newContent);
        await saveSiteContent('aboutPage', newContent);
    }, []);

    const updateContactPageContent = useCallback(async (newContent: ContactPageContent) => {
        setContactPageContent(newContent);
        await saveSiteContent('contactPage', newContent);
    }, []);

    const updateCareersPageContent = useCallback(async (newContent: CareersPageContent) => {
        setCareersPageContent(newContent);
        await saveSiteContent('careersPage', newContent);
    }, []);

    const updateHomepageContent = useCallback(async (newContent: HomepageContent) => {
        setHomepageContent(newContent);
        await saveSiteContent('homepage', newContent);
    }, []);

    const updateSiteAssets = useCallback(async (newAssets: SiteAssets) => {
        setSiteAssets(newAssets);
        await saveSiteContent('assets', newAssets);
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
        updateQuickLinks,
        updateLegalPagesContent,
        updateBlogPosts,
        updateAboutPageContent,
        updateContactPageContent,
        updateCareersPageContent,
        updateHomepageContent,
        updateSiteAssets,
    }), [quickLinks, legalPagesContent, blogPosts, aboutPageContent, contactPageContent, careersPageContent, homepageContent, siteAssets, updateQuickLinks, updateLegalPagesContent, updateBlogPosts, updateAboutPageContent, updateContactPageContent, updateCareersPageContent, updateHomepageContent, updateSiteAssets]);

    return (
        <SiteContentContext.Provider value={value}>
            {children}
        </SiteContentContext.Provider>
    );
};