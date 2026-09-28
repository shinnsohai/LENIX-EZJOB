import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Server-only (service-role key). Creates an employer login + company
// profile so an admin can publish a company page for a business that hasn't
// signed up itself yet. The account gets a random password nobody is told;
// handing it over to the company needs a password-reset flow (not built yet).
// Every caller is verified as an authenticated ADMIN before anything runs.
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    if (!supabaseUrl || !serviceRoleKey) {
        res.status(500).json({ error: 'Admin service is not configured.' });
        return;
    }

    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        res.status(401).json({ error: 'Missing bearer token.' });
        return;
    }

    const { email, company_name, industry, website_url, phone } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        res.status(400).json({ error: 'A valid company email is required.' });
        return;
    }
    if (typeof company_name !== 'string' || !company_name.trim()) {
        res.status(400).json({ error: 'Company name is required.' });
        return;
    }
    const optional = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerData, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !callerData?.user) {
        res.status(401).json({ error: 'Invalid session.' });
        return;
    }
    const { data: callerProfile, error: profileError } = await admin
        .from('profiles')
        .select('role')
        .eq('id', callerData.user.id)
        .maybeSingle();
    if (profileError || callerProfile?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: cleanEmail,
        password: randomBytes(24).toString('base64url'),
        email_confirm: true,
        user_metadata: { role: 'EMPLOYER', identifier: cleanEmail },
    });
    if (createError || !created?.user) {
        const alreadyExists = /already|registered|exists/i.test(createError?.message ?? '');
        res.status(alreadyExists ? 409 : 502).json({
            error: alreadyExists ? 'An account with this email already exists.' : 'Failed to create the company account.',
        });
        return;
    }

    const { error: insertError } = await admin.from('employer_profiles').insert({
        user_id: created.user.id,
        company_name: company_name.trim(),
        industry: optional(industry),
        website_url: optional(website_url),
        phone: optional(phone),
    });
    if (insertError) {
        console.error('create-company profile insert error:', insertError);
        // Don't leave a half-created login behind.
        await admin.auth.admin.deleteUser(created.user.id);
        res.status(502).json({ error: 'Failed to create the company profile.' });
        return;
    }

    res.status(200).json({ userId: created.user.id });
}
