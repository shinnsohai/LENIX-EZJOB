import { GoogleGenAI, Type } from "@google/genai";
import type { Job, WorkerProfile } from '../types';

const apiKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.API_KEY) ||
    '';

const ai = new GoogleGenAI({ apiKey });

const jobSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: 'A unique UUID for the job' },
            employer_name: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING, description: 'A detailed job description of at least 100 words.' },
            required_skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            status: { type: Type.STRING, description: 'The current status of the job. Should always be "Active" for this simulation.' },
            location: { type: Type.STRING, description: 'A realistic city and state/province for the job location.' },
            country: { type: Type.STRING, description: 'The country of the job location.' },
            salary_min: { type: Type.INTEGER, description: 'A realistic minimum annual salary in local currency (e.g., 50000).' },
            salary_max: { type: Type.INTEGER, description: 'A realistic maximum annual salary in local currency (e.g., 70000).' },
        },
        required: ['id', 'employer_name', 'title', 'description', 'required_skills', 'status', 'location', 'country', 'salary_min', 'salary_max'],
    },
};

const workerProfileSchema = {
     type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: 'A unique UUID for the worker' },
            full_name: { type: Type.STRING },
            trade_or_skill: { type: Type.STRING },
            experience_years: { type: Type.INTEGER, description: 'Total years of professional experience.' },
            summary: { type: Type.STRING, description: 'A 2-3 sentence summary of their skills and experience.' },
            composite_score: { type: Type.INTEGER, description: 'A score from 0 to 100 representing the match quality for the job.' },
            country_of_origin: { type: Type.STRING, description: "The worker's country of origin." },
            experience_in_country: { type: Type.INTEGER, description: "Number of years of experience working in the country where the job is located." }
        },
        required: ['id', 'full_name', 'trade_or_skill', 'experience_years', 'summary', 'country_of_origin', 'experience_in_country'],
    },
};

const jobDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING, description: 'A detailed job description of at least 100 words.' },
        required_skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'An array of 5-7 key skills for the job.'
        }
    },
    required: ['description', 'required_skills']
};

export const generateJobs = async (query: string = "construction, plumbing, and electrical jobs"): Promise<Job[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a list of 5 realistic, diverse job listings for skilled trades. The query is: ${query}. Include realistic locations, countries, and salary ranges. Make sure descriptions are detailed and compelling. Set the status of all jobs to "Active".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: jobSchema,
            },
        });
        const parsedResponse = JSON.parse(response.text);
        return parsedResponse.map((job: any) => ({ ...job, employer_id: crypto.randomUUID() })) as Job[];
    } catch (error) {
        console.error("Error generating jobs:", error);
        return [];
    }
};

// Fix: Updated generateJobWithAI to use a response schema for reliable JSON output.
// This follows best practices for the Gemini API by ensuring the model returns structured data,
// eliminating the need for fragile string manipulation like removing markdown backticks.
export const generateJobWithAI = async (title: string, company: string): Promise<Partial<Job>> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create a detailed job description and a list of required skills for the job title: "${title}" at company "${company}". The description should be professional and at least 100 words. Provide 5-7 key skills.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: jobDetailsSchema,
            }
        });

        const parsed = JSON.parse(response.text);
        return {
            description: parsed.description,
            required_skills: parsed.required_skills,
        }
    } catch (error) {
        console.error("Error generating job details:", error);
        return { description: "Could not generate description.", required_skills: [] };
    }
};

export const generateApplicants = async (jobTitle: string, jobCountry: string): Promise<WorkerProfile[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a list of 3 diverse, fictional but realistic skilled worker profiles who would be a good fit to apply for the job: "${jobTitle}". The job is located in ${jobCountry}. For each applicant, provide their country_of_origin and their experience_in_country (years of experience specifically in ${jobCountry}).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: workerProfileSchema,
            },
        });
        const parsedResponse = JSON.parse(response.text);
        return parsedResponse.map((profile: any) => ({ ...profile, user_id: crypto.randomUUID() })) as WorkerProfile[];
    } catch (error) {
        console.error("Error generating applicants:", error);
        return [];
    }
};

// Renamed from searchWorkers to be more specific
export const generateRankedWorkersForJob = async (jobTitle: string, jobCountry: string): Promise<WorkerProfile[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a list of 5 diverse, fictional skilled worker profiles who would be a strong match for the job: "${jobTitle}". The job is located in ${jobCountry}. For each profile, include a "composite_score" from 0 to 100, where 100 is a perfect match. The scores should be varied and realistic. The list should be sorted by the composite_score in descending order. Also provide their country_of_origin and their experience_in_country (years of experience specifically in ${jobCountry}).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: workerProfileSchema,
            },
        });
        const parsedResponse = JSON.parse(response.text);
        return parsedResponse.map((profile: any) => ({ ...profile, user_id: crypto.randomUUID() })) as WorkerProfile[];
    } catch (error) {
        console.error("Error searching workers:", error);
        return [];
    }
};

// New function for the enhanced search panel
export const searchWorkers = async (filters: { skill: string; experience: number; country: string }): Promise<WorkerProfile[]> => {
    const { skill, experience, country } = filters;
    
    let prompt = `Generate a list of 10 diverse, fictional skilled worker profiles.`;
    if (skill) prompt += ` They should have the primary skill of "${skill}".`;
    if (experience > 0) prompt += ` They must have at least ${experience} years of experience.`;
    if (country) prompt += ` They must originate from "${country}".`;
    prompt += ` For each worker, provide a realistic summary, country of origin, and years of experience.`

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: workerProfileSchema,
            },
        });
        const parsedResponse = JSON.parse(response.text);
        return parsedResponse.map((profile: any) => ({ ...profile, user_id: crypto.randomUUID() })) as WorkerProfile[];
    } catch (error) {
        console.error("Error generating worker pool:", error);
        return [];
    }
};
