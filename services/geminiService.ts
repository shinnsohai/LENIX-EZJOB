import type { Job } from '../types';

// Thin client wrapper. All actual Gemini API calls happen server-side in
// /api/ai/*.ts (Vercel serverless functions) — the API key never ships to
// the browser. This replaces the old geminiService.ts, which called
// Google's API directly from the client and leaked the key.
//
// The old generateJobs / generateApplicants / generateRankedWorkersForJob /
// searchWorkers functions (which fabricated entire fake job/candidate lists
// and presented them as real data) have been removed rather than ported —
// see migration plan finding #7. Real job listings and worker search go
// through services/db.ts (getJobs / searchWorkersInDb) instead.

export interface GeneratedJobDetails {
    description: string;
    required_skills: string[];
}

/**
 * AI-assisted job description + skills generation. Used by the employer's
 * "Generate with AI" button, and by the HomePage "AI Job Studio" demo
 * (which used to fake this with a setTimeout + template string).
 */
export const generateJobWithAI = async (title: string, company: string): Promise<GeneratedJobDetails> => {
    try {
        const res = await fetch('/api/ai/generate-job-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, company }),
        });
        if (!res.ok) throw new Error(`AI service responded with ${res.status}`);
        const data = await res.json();
        return { description: data.description, required_skills: data.required_skills ?? [] };
    } catch (error) {
        console.error('Error generating job details:', error);
        return { description: 'Could not generate description.', required_skills: [] };
    }
};

// Kept for the type signature call sites expect when building a full Job
// object from AI-generated details (e.g. the employer "new job" form).
export type PartialAIJob = Partial<Job>;
