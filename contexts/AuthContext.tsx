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

// Fetches the public.profiles row for a freshly-authenticated Supabase user.
// Right after sign-up there can be a brief race with the `handle_new_user`
// trigger that populates this row, so we retry a few times before giving up.
const fetchProfile = async (userId: string, retries = 3, delayMs = 400): Promise<User | null> => {
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
            };
        }

        if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return null;
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

        let profile: User | null = null;
        try {
            profile = await fetchProfile(session.user.id);
        } catch (error) {
            console.error('AuthContext: failed to fetch profile', error);
        }

        if (requestIdRef.current !== requestId) {
            // A newer auth event superseded this one; discard the result.
            return;
        }

        setUser(profile);
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

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
