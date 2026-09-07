import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import type { User, AuthContextType } from '../types';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Set by signInWithGoogle() right before the OAuth redirect, when the user
// picked a role on the register screen. Read back once, after the OAuth
// round-trip lands and a session exists, to apply that choice -- see
// applyPendingOAuthRole() below. Google (or any OAuth provider) has no way
// for us to pass this through the redirect itself, so sessionStorage is the
// bridge; it's per-tab and cleared on success, so a stale value can't leak
// into an unrelated later sign-in in the same tab.
const PENDING_OAUTH_ROLE_KEY = 'ezjob_pending_oauth_role';

// Fetches the public.profiles row for a freshly-authenticated Supabase user.
// Right after sign-up there can be a brief race with the `handle_new_user`
// trigger that populates this row, so we retry a few times before giving up.
const fetchProfile = async (userId: string, retries = 3, delayMs = 400): Promise<(User & { role_locked: boolean }) | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data && !error) {
            return {
                id: data.id,
                identifier: data.identifier,
                role: data.role as UserRole,
                role_locked: data.role_locked,
            };
        }

        if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return null;
};

// If this OAuth sign-in is brand new (role_locked = false, meaning
// handle_new_user() had no explicit role to assign) and the register screen
// stashed an intended role before redirecting, apply it now. This is the
// one-time self-service correction the 0007 migration's trigger allows --
// after this write, role_locked flips to true and the choice is final
// (same as everyone who registered with email/password).
const applyPendingOAuthRole = async (profile: User & { role_locked: boolean }): Promise<User> => {
    const { role_locked, ...user } = profile;
    if (role_locked) return user;

    let pending: string | null = null;
    try {
        pending = sessionStorage.getItem(PENDING_OAUTH_ROLE_KEY);
    } catch {
        // sessionStorage unavailable (private mode edge cases) -- nothing to apply.
        return user;
    }

    if (pending !== UserRole.WORKER && pending !== UserRole.EMPLOYER) {
        return user;
    }

    // Runs even when `pending` already equals the default WORKER role --
    // the point of this write isn't just the role, it's also flipping
    // role_locked to true so this branch isn't re-entered on every future
    // sign-in.
    const { data, error } = await supabase
        .from('profiles')
        .update({ role: pending, role_locked: true })
        .eq('id', profile.id)
        .select('*')
        .single();

    if (error || !data) {
        console.error('AuthContext: failed to apply pending OAuth role selection', error);
        return user; // leave the pending key in place; a later attempt in this tab can retry
    }

    try {
        sessionStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
    } catch {
        // Non-fatal -- worst case the key lingers until the tab closes.
    }

    return { id: data.id, identifier: data.identifier, role: data.role as UserRole };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    // Prevents a stale async profile fetch from clobbering state after a newer
    // auth event (e.g. rapid login -> logout) has already resolved.
    const requestIdRef = useRef(0);

    const applySession = async (session: Session | null) => {
        const requestId = ++requestIdRef.current;

        if (!session?.user) {
            setUser(null);
            setLoading(false);
            return;
        }

        let user: User | null = null;
        try {
            const profile = await fetchProfile(session.user.id);
            if (profile) {
                user = await applyPendingOAuthRole(profile);
            }
        } catch (error) {
            console.error('AuthContext: failed to fetch profile', error);
        }

        if (requestIdRef.current !== requestId) {
            // A newer auth event superseded this one; discard the result.
            return;
        }

        setUser(user);
        setLoading(false);
    };

    useEffect(() => {
        supabase.auth.getSession()
            .then(({ data: { session } }) => applySession(session))
            .catch((error) => {
                // Network failure or misconfigured Supabase env vars — fail
                // open to a logged-out state rather than hanging on
                // `loading` forever (which would block the whole app,
                // since children only render once loading is false).
                console.error('AuthContext: failed to resolve session', error);
                setUser(null);
                setLoading(false);
            });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            applySession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (identifier: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email: identifier.trim(),
            password,
        });

        if (error) {
            throw error;
        }
    };

    const register = async (identifier: string, password: string, role: UserRole) => {
        const cleanIdentifier = identifier.trim();

        const { data, error } = await supabase.auth.signUp({
            email: cleanIdentifier,
            password,
            options: {
                data: {
                    role,
                    identifier: cleanIdentifier,
                },
            },
        });

        if (error) {
            throw error;
        }

        // If the Supabase project has "Confirm email" enabled, signUp()
        // creates the auth user (and, via the trigger, their profile) but
        // returns no session — the caller needs to know this so it can show
        // a "check your email" state instead of waiting forever for a
        // redirect that will never come.
        return { needsEmailConfirmation: !data.session };
    };

    // `intendedRole` matters only for a brand-new account (register screen
    // passes the Worker/Employer toggle's current value); omit it for a
    // plain "Continue with Google" login where the account, if it already
    // exists, already has a role. Google immediately navigates the browser
    // away, so there's nothing meaningful to return here besides a thrown
    // error for the (rare) case the redirect itself can't start.
    const signInWithGoogle = async (intendedRole?: UserRole) => {
        try {
            if (intendedRole) {
                sessionStorage.setItem(PENDING_OAUTH_ROLE_KEY, intendedRole);
            } else {
                sessionStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
            }
        } catch {
            // sessionStorage unavailable -- proceed anyway; worst case a new
            // OAuth signup lands as the default WORKER role, correctable by
            // an admin.
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/login` },
        });

        if (error) {
            throw error;
        }
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, signInWithGoogle }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
