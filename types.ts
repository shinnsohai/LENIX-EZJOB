
export enum UserRole {
    WORKER = 'WORKER',
    EMPLOYER = 'EMPLOYER',
    ADMIN = 'ADMIN',
}

export interface User {
    id: string;
    identifier: string; // Can be email or phone number
    role: UserRole;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
}

export interface PhysicalAttributes {
    height_cm?: number;
    weight_kg?: number;
    handedness?: string;
    color_blindness?: boolean;
}

export interface MediaLinks {
    intro_video_url?: string;
    skill_video_url?: string;
}

export interface TradeSpecifics {
    [key: string]: boolean | string;
}

export interface WorkerHistory {
    ex_singapore?: boolean;
    last_drawn_salary?: number;
    total_experience?: number;
}

export interface Project {
    id?: string;
    project_name: string;
    role: string;
    year_start: number;
    year_end: number;
    description?: string;
}

export interface Certification {
    id?: string;
    cert_name: string;
    expiry_date: string;
    document_url?: string;
}

export interface Reference {
    id?: string;
    name: string;
    contact?: string;
    relationship?: string;
}

// New Interface for Multi-Skilling
export interface UserSkill {
    trade: string;
    tags: TradeSpecifics;
    isPrimary: boolean;
}

export interface WorkerProfile {
    id: string;
    user_id: string;
    full_name: string;
    trade_or_skill: string; // Kept for backward compatibility (Primary Skill)
    experience_years: number;
    cv_url?: string;
    summary?: string;
    bio?: string;
    composite_score?: number;
    country_of_origin: string;
    experience_in_country: number;
    photo_url?: string;
    status?: 'Active' | 'Suspended';

    // Extended properties
    trade?: string; // Deprecated
    physical_attributes?: PhysicalAttributes;
    media_links?: MediaLinks;
    trade_specifics?: TradeSpecifics; // Kept for backward compatibility (Primary Tags)
    history?: WorkerHistory;
    is_verified?: boolean;

    // New Multi-Skilling Field
    skills?: UserSkill[];
}

export interface EmployerProfile {
    id: string;
    user_id: string;
    company_name: string;
    description?: string;
    website_url?: string;
    phone?: string;
    industry?: string;
    location?: string;
    company_size?: string;
    year_founded?: number;
    company_logo_url?: string;
    status?: 'Active' | 'Suspended';
}

export interface Job {
    id: string;
    employer_id: string;
    employer_name: string;
    title: string;
    description: string;
    required_skills: string[];
    status: 'Active' | 'On Hold' | 'Closed';
    location: string;
    country: string;
    salary_min: number;
    salary_max: number;
    currency?: string; // Currency code (e.g., 'SGD', 'USD', 'MYR')
    createdAt?: string;

    // Mobile-first fields for blue-collar/shift-based applicants (all optional
    // so existing jobs and forms keep working unchanged).
    shift_schedule?: string; // e.g. "12-hour rotating shifts, 6-day week, night allowance"
    perks?: string; // e.g. "Daily meal allowance, 1.5x OT, performance bonus"
    whatsapp_number?: string; // E.164 phone number for a "WhatsApp to apply" CTA
    qualifying_questions?: string[]; // 2-3 short screening questions shown before Apply
    transport_provided?: boolean;
    transport_details?: string; // pickup points / shuttle info
    accommodation_provided?: boolean;
    accommodation_details?: string; // dormitory / housing allowance info
}

export interface Application {
    id: string;
    job_id: string;
    worker_id: string;
    employer_id: string;
    status: 'Submitted' | 'Viewed' | 'Shortlisted' | 'Rejected' | 'Withdrawn';
    job_title: string;
    employer_name: string;
    location: string;
    appliedAt: string;
}

export interface BlogPost {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    author: string;
    publishDate: string;
}
