import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Server-only. SUPABASE_SERVICE_ROLE_KEY must NOT have a VITE_ prefix.
// This is the one operation the app needs that must bypass RLS: permanently
// deleting a user account (auth.users row), which cascades via FK to
// profiles / worker_profiles / employer_profiles / jobs / applications.
// Every caller is verified as an authenticated ADMIN before anything runs.
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    const { userId } = (req.body ?? {}) as { userId?: string };
    if (!userId || typeof userId !== 'string') {
        res.status(400).json({ error: 'A valid "userId" is required.' });
        return;
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Resolve the caller from their access token.
    const { data: callerData, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !callerData?.user) {
        res.status(401).json({ error: 'Invalid session.' });
        return;
    }

    // 2. Confirm the caller is actually an admin (never trust a client-sent role).
    const { data: callerProfile, error: profileError } = await admin
        .from('profiles')
        .select('role')
        .eq('id', callerData.user.id)
        .maybeSingle();
    if (profileError || callerProfile?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
    }

    // 3. Delete the target user (cascades to all owned rows via FK).
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
        console.error('delete-user error:', deleteError);
        res.status(502).json({ error: 'Failed to delete user.' });
        return;
    }

    res.status(200).json({ success: true });
}
