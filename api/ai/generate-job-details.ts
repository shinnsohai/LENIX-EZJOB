import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

// Server-only. GEMINI_API_KEY must NOT have a VITE_ prefix — it is only ever
// read here, inside a Vercel serverless function, never shipped to the
// client bundle. (The old client-side geminiService.ts leaked this key —
// see the migration plan's findings #2.)
const apiKey = process.env.GEMINI_API_KEY;

const jobDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING, description: 'A detailed job description of at least 100 words.' },
        required_skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'An array of 5-7 key skills for the job.',
        },
    },
    required: ['description', 'required_skills'],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    if (!apiKey) {
        res.status(500).json({ error: 'AI service is not configured (missing GEMINI_API_KEY).' });
        return;
    }

    const { title, company } = (req.body ?? {}) as { title?: string; company?: string };
    if (!title || typeof title !== 'string' || title.length > 200) {
        res.status(400).json({ error: 'A valid "title" is required.' });
        return;
    }
    const safeCompany = typeof company === 'string' && company.length <= 200 ? company : 'the company';

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a detailed job description and a list of required skills for the job title: "${title}" at company "${safeCompany}". The description should be professional and at least 100 words. Provide 5-7 key skills.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: jobDetailsSchema,
            },
        });
        const parsed = JSON.parse(response.text);
        res.status(200).json({
            description: parsed.description as string,
            required_skills: parsed.required_skills as string[],
        });
    } catch (error) {
        console.error('generate-job-details error:', error);
        res.status(502).json({ error: 'Failed to generate job details.' });
    }
}
