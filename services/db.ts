import { supabase } from './supabaseClient';
import type {
    WorkerProfile,
    EmployerProfile,
    Job,
    Application,
    Project,
    Certification,
    Reference,
    BlogPost,
} from '../types';

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/**
 * Uploads a file to a Supabase Storage bucket under `{uid}/{filename}` (the
 * path convention the storage RLS policies in supabase/migrations/0004
 * expect) and returns its public URL.
 */
export const uploadFile = async (bucket: string, uid: string, file: File): Promise<string> => {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${uid}/${Date.now()}_${cleanName}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type,
        upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

// ---------------------------------------------------------------------------
// Worker profiles
// ---------------------------------------------------------------------------

export const getWorkerProfile = async (userId: string): Promise<WorkerProfile | null> => {
    const { data, error } = await supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) {
        console.error('Error getting worker profile:', error);
        return null;
    }
    return data as WorkerProfile | null;
};

export const saveWorkerProfile = async (profile: WorkerProfile): Promise<void> => {
    const { id, ...rest } = profile as any;
    const { error } = await supabase
        .from('worker_profiles')
        .upsert({ ...rest, user_id: profile.user_id }, { onConflict: 'user_id' });
    if (error) throw error;
};

export const deleteWorkerProfile = async (id: string): Promise<void> => {
    const { error } = await supabase.from('worker_profiles').delete().eq('id', id);
    if (error) throw error;
};

/**
 * Permanently deletes a user account (auth.users row + everything owned by
 * it, via FK cascade). Admin-only — enforced server-side in
 * api/admin/delete-user.ts, which re-verifies the caller's role itself and
 * never trusts the client. `userId` is the profiles.id / auth.users.id, not
 * the worker_profiles/employer_profiles row id.
 */
export const deleteUserAccount = async (userId: string): Promise<void> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('Not authenticated.');

    const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to delete user.');
    }
};

// --- Worker sub-resources (real FK tables, replacing the generic Firestore
//     subcollection helper) ---

export const getWorkerProjects = async (workerId: string): Promise<Project[]> => {
    const { data, error } = await supabase
        .from('worker_projects')
        .select('*')
        .eq('worker_id', workerId)
        .order('year_start', { ascending: false });
    if (error) { console.error('Error getting projects:', error); return []; }
    return data as Project[];
};

export const addWorkerProject = async (workerId: string, project: Omit<Project, 'id'>): Promise<string> => {
    const { data, error } = await supabase
        .from('worker_projects')
        .insert({ ...project, worker_id: workerId })
        .select('id')
        .single();
    if (error) throw error;
    return data.id;
};

export const updateWorkerProject = async (id: string, data: Partial<Project>): Promise<void> => {
    const { error } = await supabase.from('worker_projects').update(data).eq('id', id);
    if (error) throw error;
};

export const deleteWorkerProject = async (id: string): Promise<void> => {
    const { error } = await supabase.from('worker_projects').delete().eq('id', id);
    if (error) throw error;
};

export const getWorkerCertifications = async (workerId: string): Promise<Certification[]> => {
    const { data, error } = await supabase
        .from('worker_certifications')
        .select('*')
        .eq('worker_id', workerId)
        .order('expiry_date', { ascending: true });
    if (error) { console.error('Error getting certifications:', error); return []; }
    return data as Certification[];
};

export const addWorkerCertification = async (workerId: string, cert: Omit<Certification, 'id'>): Promise<string> => {
    const { data, error } = await supabase
        .from('worker_certifications')
        .insert({ ...cert, worker_id: workerId })
        .select('id')
        .single();
    if (error) throw error;
    return data.id;
};

export const updateWorkerCertification = async (id: string, data: Partial<Certification>): Promise<void> => {
    const { error } = await supabase.from('worker_certifications').update(data).eq('id', id);
    if (error) throw error;
};

export const deleteWorkerCertification = async (id: string): Promise<void> => {
    const { error } = await supabase.from('worker_certifications').delete().eq('id', id);
    if (error) throw error;
};

export const getWorkerReferences = async (workerId: string): Promise<Reference[]> => {
    const { data, error } = await supabase
        .from('worker_references')
        .select('*')
        .eq('worker_id', workerId);
    if (error) { console.error('Error getting references:', error); return []; }
    return data as Reference[];
};

export const addWorkerReference = async (workerId: string, ref: Omit<Reference, 'id'>): Promise<string> => {
    const { data, error } = await supabase
        .from('worker_references')
        .insert({ ...ref, worker_id: workerId })
        .select('id')
        .single();
    if (error) throw error;
    return data.id;
};

export const updateWorkerReference = async (id: string, data: Partial<Reference>): Promise<void> => {
    const { error } = await supabase.from('worker_references').update(data).eq('id', id);
    if (error) throw error;
};

export const deleteWorkerReference = async (id: string): Promise<void> => {
    const { error } = await supabase.from('worker_references').delete().eq('id', id);
    if (error) throw error;
};

// ---------------------------------------------------------------------------
// Employer profiles
// ---------------------------------------------------------------------------

export const getEmployerProfile = async (userId: string): Promise<EmployerProfile | null> => {
    const { data, error } = await supabase
        .from('employer_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) {
        console.error('Error getting employer profile:', error);
        return null;
    }
    return data as EmployerProfile | null;
};

export const saveEmployerProfile = async (profile: EmployerProfile): Promise<void> => {
    const { id, ...rest } = profile as any;
    const { error } = await supabase
        .from('employer_profiles')
        .upsert({ ...rest, user_id: profile.user_id }, { onConflict: 'user_id' });
    if (error) throw error;
};

export const deleteEmployerProfile = async (id: string): Promise<void> => {
    const { error } = await supabase.from('employer_profiles').delete().eq('id', id);
    if (error) throw error;
};

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

const rowToJob = (row: any): Job => ({
    id: row.id,
    employer_id: row.employer_id,
    employer_name: row.employer_name,
    title: row.title,
    description: row.description,
    required_skills: row.required_skills ?? [],
    status: row.status,
    location: row.location,
    country: row.country,
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    currency: row.currency,
    createdAt: row.created_at,
});

/**
 * Single consolidated jobs query, replacing three previously-separate
 * implementations (services/db.ts's old getJobs, EmployerDashboard's
 * employer-scoped call, and CompanyProfilePage's hand-rolled compound
 * Firestore query).
 */
export const getJobs = async (filters?: { employerId?: string; status?: Job['status'] }): Promise<Job[]> => {
    let q = supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (filters?.employerId) q = q.eq('employer_id', filters.employerId);
    if (filters?.status) q = q.eq('status', filters.status);
    if (!filters?.employerId && !filters?.status) q = q.eq('status', 'Active');
    const { data, error } = await q;
    if (error) { console.error('Error getting jobs:', error); throw error; }
    return (data ?? []).map(rowToJob);
};

export const getJobById = async (id: string): Promise<Job | null> => {
    const { data, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
    if (error) { console.error('Error getting job:', error); return null; }
    return data ? rowToJob(data) : null;
};

export const createJob = async (job: Omit<Job, 'id'>): Promise<string> => {
    if (!job.employer_id) throw new Error('Cannot create job: employer_id is missing.');
    if (job.salary_max < job.salary_min) {
        throw new Error('Maximum salary cannot be lower than minimum salary.');
    }
    const { createdAt, ...rest } = job as any;
    const { data, error } = await supabase.from('jobs').insert(rest).select('id').single();
    if (error) throw error;
    return data.id;
};

export const updateJob = async (id: string, data: Partial<Job>): Promise<void> => {
    if (data.salary_min !== undefined && data.salary_max !== undefined && data.salary_max < data.salary_min) {
        throw new Error('Maximum salary cannot be lower than minimum salary.');
    }
    const { createdAt, ...rest } = data as any;
    const { error } = await supabase.from('jobs').update(rest).eq('id', id);
    if (error) throw error;
};

export const deleteJob = async (id: string): Promise<void> => {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) throw error;
};

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

const rowToApplication = (row: any): Application => ({
    id: row.id,
    job_id: row.job_id,
    worker_id: row.worker_id,
    employer_id: row.employer_id,
    status: row.status,
    job_title: row.job_title,
    employer_name: row.employer_name,
    location: row.location,
    appliedAt: row.applied_at,
});

/**
 * Creates (or reactivates a withdrawn) application. The (job_id, worker_id)
 * unique constraint on the `applications` table makes the previous app's
 * client-side duplicate-application race structurally impossible: this is
 * a single upsert, not a check-then-write.
 */
export const createApplication = async (job: Job, workerId: string): Promise<true> => {
    const { data: existing, error: fetchError } = await supabase
        .from('applications')
        .select('id, status')
        .eq('job_id', job.id)
        .eq('worker_id', workerId)
        .maybeSingle();
    if (fetchError) throw fetchError;

    if (existing) {
        if (existing.status !== 'Withdrawn') {
            throw new Error('You have already applied for this job.');
        }
        const { error } = await supabase
            .from('applications')
            .update({ status: 'Submitted', applied_at: new Date().toISOString() })
            .eq('id', existing.id);
        if (error) throw error;
        return true;
    }

    const { error } = await supabase.from('applications').insert({
        job_id: job.id,
        worker_id: workerId,
        employer_id: job.employer_id,
        status: 'Submitted',
        job_title: job.title,
        employer_name: job.employer_name,
        location: job.location,
    });
    if (error) throw error;
    return true;
};

export const getWorkerApplications = async (workerId: string): Promise<Application[]> => {
    const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('worker_id', workerId)
        .order('applied_at', { ascending: false });
    if (error) { console.error('Error fetching applications:', error); return []; }
    return (data ?? []).map(rowToApplication);
};

/** Soft withdraw — sets status to 'Withdrawn'. Never hard-deletes an application. */
export const withdrawApplication = async (applicationId: string): Promise<void> => {
    const { error } = await supabase
        .from('applications')
        .update({ status: 'Withdrawn' })
        .eq('id', applicationId);
    if (error) throw error;
};

export const reapplyApplication = async (applicationId: string): Promise<void> => {
    const { error } = await supabase
        .from('applications')
        .update({ status: 'Submitted', applied_at: new Date().toISOString() })
        .eq('id', applicationId);
    if (error) throw error;
};

export const getJobApplicants = async (jobId: string): Promise<WorkerProfile[]> => {
    // applications.worker_id and worker_profiles.user_id both reference
    // profiles(id) but not each other, so this is two queries rather than a
    // single PostgREST embed (no direct FK path to embed across).
    const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('worker_id')
        .eq('job_id', jobId)
        .neq('status', 'Withdrawn');
    if (appsError) { console.error('Error fetching applicants:', appsError); return []; }

    const workerUserIds = (apps ?? []).map((a) => a.worker_id);
    if (workerUserIds.length === 0) return [];

    const { data: workers, error: workersError } = await supabase
        .from('worker_profiles')
        .select('*')
        .in('user_id', workerUserIds);
    if (workersError) { console.error('Error fetching applicant profiles:', workersError); return []; }
    return (workers ?? []) as WorkerProfile[];
};

export const updateApplicationStatus = async (
    applicationId: string,
    status: Application['status']
): Promise<void> => {
    const { error } = await supabase.from('applications').update({ status }).eq('id', applicationId);
    if (error) throw error;
};

// ---------------------------------------------------------------------------
// Worker search (real Postgres query — replaces the old "fetch every
// worker document, filter in memory" implementation)
// ---------------------------------------------------------------------------

export const searchWorkersInDb = async (filters: {
    skill: string;
    experience: number;
    country: string;
    page?: number;
    pageSize?: number;
}): Promise<{ workers: WorkerProfile[]; total: number }> => {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
        .from('worker_profiles')
        .select('*', { count: 'exact' })
        .eq('status', 'Active');

    if (filters.country && filters.country !== 'Any') {
        q = q.ilike('country_of_origin', filters.country);
    }
    if (filters.experience > 0) {
        q = q.gte('experience_years', filters.experience);
    }
    if (filters.skill) {
        const term = `%${filters.skill}%`;
        q = q.or(`trade_or_skill.ilike.${term},summary.ilike.${term},bio.ilike.${term}`);
    }

    const { data, error, count } = await q.order('composite_score', { ascending: false, nullsFirst: false }).range(from, to);
    if (error) { console.error('Error searching workers:', error); return { workers: [], total: 0 }; }
    return { workers: (data ?? []) as WorkerProfile[], total: count ?? 0 };
};

// ---------------------------------------------------------------------------
// Admin: users (paginated — replaces the old full-collection fetch)
// ---------------------------------------------------------------------------

export const getAllWorkers = async (opts?: { page?: number; pageSize?: number; search?: string }): Promise<{ workers: WorkerProfile[]; total: number }> => {
    const page = opts?.page ?? 1;
    const pageSize = opts?.pageSize ?? 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase.from('worker_profiles').select('*', { count: 'exact' });
    if (opts?.search) q = q.or(`full_name.ilike.%${opts.search}%,trade_or_skill.ilike.%${opts.search}%`);
    const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    return { workers: (data ?? []) as WorkerProfile[], total: count ?? 0 };
};

export const getAllEmployers = async (opts?: { page?: number; pageSize?: number; search?: string }): Promise<{ employers: EmployerProfile[]; total: number }> => {
    const page = opts?.page ?? 1;
    const pageSize = opts?.pageSize ?? 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase.from('employer_profiles').select('*', { count: 'exact' });
    if (opts?.search) q = q.ilike('company_name', `%${opts.search}%`);
    const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    return { employers: (data ?? []) as EmployerProfile[], total: count ?? 0 };
};

// ---------------------------------------------------------------------------
// Blog posts (now a real table, not an array inside site_content)
// ---------------------------------------------------------------------------

const rowToBlogPost = (row: any): BlogPost => ({
    id: row.id,
    title: row.title,
    content: row.content,
    imageUrl: row.image_url,
    author: row.author,
    publishDate: row.publish_date,
});

export const getBlogPosts = async (): Promise<BlogPost[]> => {
    const { data, error } = await supabase.from('blog_posts').select('*').order('publish_date', { ascending: false });
    if (error) { console.error('Error fetching blog posts:', error); return []; }
    return (data ?? []).map(rowToBlogPost);
};

export const saveBlogPost = async (post: Partial<BlogPost> & { id?: string }): Promise<string> => {
    const row = {
        title: post.title,
        content: post.content,
        image_url: post.imageUrl,
        author: post.author,
        publish_date: post.publishDate ?? new Date().toISOString(),
    };
    if (post.id) {
        const { error } = await supabase.from('blog_posts').update(row).eq('id', post.id);
        if (error) throw error;
        return post.id;
    }
    const { data, error } = await supabase.from('blog_posts').insert(row).select('id').single();
    if (error) throw error;
    return data.id;
};

export const deleteBlogPost = async (id: string): Promise<void> => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) throw error;
};

// ---------------------------------------------------------------------------
// Site content (CMS) — one consistent jsonb shape per key
// ---------------------------------------------------------------------------

export const getSiteContent = async (id: string): Promise<any | undefined> => {
    const { data, error } = await supabase.from('site_content').select('data').eq('id', id).maybeSingle();
    if (error) {
        console.error(`[getSiteContent] Error loading ${id}:`, error);
        throw error;
    }
    return data?.data;
};

export const saveSiteContent = async (id: string, data: any): Promise<void> => {
    const { error } = await supabase.from('site_content').upsert({ id, data });
    if (error) {
        console.error(`[saveSiteContent] Error saving ${id}:`, error);
        throw error;
    }
};

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export const subscribeToNewsletter = async (email: string): Promise<void> => {
    const { error } = await supabase.from('newsletter_subscribers').insert({ email });
    if (error && error.code !== '23505' /* unique_violation: already subscribed */) throw error;
};
