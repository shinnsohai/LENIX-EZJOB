
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
    register: (email: string, password: string, role: UserRole) => Promise<{ needsEmailConfirmation: boolean }>;
    logout: () => Promise<void>;
    /** Redirects to Google immediately; there's no meaningful resolved value, only a thrown error if the redirect itself couldn't start. `intendedRole` matters only for a brand-new account (pass the register screen's current Worker/Employer selection); omit for a plain "Continue with Google" login. */
    signInWithGoogle: (intendedRole?: UserRole) => Promise<void>;
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

    // Async translation workflow: never written by an in-app LLM call. The
    // employer exports jobs to CSV, translates/optimizes offline in their
    // own batch process (a few times a week), and re-imports the result —
    // see JobTranslationsCsvRow below. Keyed by short language code (e.g.
    // 'zh', 'bn', 'ta', 'ms', 'my'); every field within one language is
    // optional so a partial translation still renders (falls back to the
    // base English field for anything missing).
    translations?: Record<string, {
        title?: string;
        description?: string;
        required_skills?: string[];
        shift_schedule?: string;
        perks?: string;
        qualifying_questions?: string[];
    }>;

    // Position fulfillment. available_positions is set by the employer at
    // posting time (undefined = not tracked, the default for every existing
    // job). positions_filled is server-maintained — it only ever changes via
    // the applications_sync_job_positions DB trigger when an applicant's
    // status transitions to/from 'Hired'; never write it directly from the
    // client.
    available_positions?: number;
    positions_filled?: number;
}

/** One row of the translations CSV: one job x one language per row. */
export interface JobTranslationsCsvRow {
    job_id: string;
    job_title: string; // reference only, ignored on import
    language_code: string;
    title: string;
    description: string;
    required_skills: string; // ';'-separated, matching the job-import CSV convention
    shift_schedule: string;
    perks: string;
    qualifying_questions: string; // newline-separated, matching the job form's convention
}

export interface Application {
    id: string;
    job_id: string;
    worker_id: string;
    employer_id: string;
    status: 'Submitted' | 'Viewed' | 'Shortlisted' | 'Rejected' | 'Withdrawn' | 'Hired';
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
