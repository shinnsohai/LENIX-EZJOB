import type { Job, WorkerProfile } from '../types';

function normalize(s: string): string {
    return s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** True if two skill/keyword strings count as "the same skill" for matching
 * purposes: exact match after normalizing, one contains the other, or they
 * share a distinctive (3+ char) word — e.g. "MIG Welding" vs "MIG/TIG
 * Welding Certified". Deliberately simple keyword overlap rather than a
 * fuzzy/ML similarity score: this feeds a worker-facing "how well am I
 * positioned" percentage, so a worker needs to be able to look at a missing
 * skill and understand exactly why it didn't match. */
function skillsOverlap(a: string, b: string): boolean {
    const na = normalize(a);
    const nb = normalize(b);
    if (!na || !nb) return false;
    if (na === nb || na.includes(nb) || nb.includes(na)) return true;
    const wordsA = new Set(na.split(' ').filter(w => w.length > 2));
    return nb.split(' ').some(w => w.length > 2 && wordsA.has(w));
}

/** Every skill/trade keyword a worker profile can be matched against: each
 * skill's trade name (e.g. "Welding & Fabrication") plus every tag they've
 * checked true / filled in under any of their skills (e.g. "MIG Welding"). */
export function flattenWorkerSkills(profile: Pick<WorkerProfile, 'skills'> | null | undefined): string[] {
    if (!profile?.skills) return [];
    const out: string[] = [];
    for (const skill of profile.skills) {
        if (skill.trade) out.push(skill.trade);
        for (const [tag, value] of Object.entries(skill.tags || {})) {
            if (value) out.push(tag);
        }
    }
    return out;
}

export interface SkillMatchResult {
    matched: string[];
    missing: string[];
    /** 0-100, rounded. 100 when the job lists no required skills at all
     * (nothing to fall short of), 0 when the worker has no flattened
     * skills to compare against a non-empty requirement list. */
    percent: number;
}

/** Keyword-overlap match between a job's required_skills and a worker's
 * flattened skill/tag list — the algorithm behind the worker-facing match
 * percentage shown on job cards and the job detail page (see
 * SkillMatchPanel in JobDetailPage.tsx and the badge in JobSearchPage.tsx). */
export function computeSkillMatch(requiredSkills: string[] | undefined, workerSkills: string[]): SkillMatchResult {
    const required = requiredSkills ?? [];
    if (required.length === 0) return { matched: [], missing: [], percent: 100 };
    const matched: string[] = [];
    const missing: string[] = [];
    for (const req of required) {
        if (workerSkills.some(ws => skillsOverlap(req, ws))) matched.push(req);
        else missing.push(req);
    }
    return { matched, missing, percent: Math.round((matched.length / required.length) * 100) };
}

/** Convenience wrapper for ranking/badging a list of jobs against one
 * worker's profile — flattens the profile once and reuses it per job. */
export function rankJobsByMatch(jobs: Job[], profile: Pick<WorkerProfile, 'skills'> | null | undefined): Map<string, SkillMatchResult> {
    const workerSkills = flattenWorkerSkills(profile);
    const result = new Map<string, SkillMatchResult>();
    for (const job of jobs) {
        result.set(job.id, computeSkillMatch(job.required_skills, workerSkills));
    }
    return result;
}
