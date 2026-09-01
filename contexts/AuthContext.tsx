import React, { useState, createContext, useContext, useEffect } from 'react';
import type { User, AuthContextType } from '../types';
import { UserRole } from '../types';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Preset demo accounts for quick testing before Supabase migration
export const DEMO_CREDENTIALS = {
    ADMIN: { id: 'admin', pass: 'admin123', role: UserRole.ADMIN, name: 'Operations Admin' },
    EMPLOYER: { id: 'emp', pass: 'emp123', role: UserRole.EMPLOYER, name: 'Apex Engineering HR' },
    WORKER: { id: 'worker', pass: 'worker123', role: UserRole.WORKER, name: 'Tan Wei Ming (Welder)' }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('mock_auth_user');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error reading mock_auth_user from localStorage:', e);
        }
        return null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If mock user already exists in localStorage, don't wait on Firebase
        const savedMock = localStorage.getItem('mock_auth_user');
        if (savedMock) {
            try {
                setUser(JSON.parse(savedMock));
                setLoading(false);
                return;
            } catch (e) {
                console.error(e);
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("AuthContext: Auth state changed", firebaseUser ? firebaseUser.uid : 'No user');
            if (firebaseUser) {
                try {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser({
                            id: firebaseUser.uid,
                            identifier: firebaseUser.email || 'Phone User',
                            role: userData.role,
                        });
                    } else {
                        setUser({
                            id: firebaseUser.uid,
                            identifier: firebaseUser.email || 'User',
                            role: UserRole.WORKER,
                        });
                    }
                } catch (error) {
                    console.error("AuthContext: Error fetching user role:", error);
                    setUser(null);
                }
            } else if (!localStorage.getItem('mock_auth_user')) {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (identifier: string, password: string) => {
        const cleanId = (identifier || '').trim().toLowerCase();
        const cleanPass = (password || '').trim();

        // 1. Check Admin Demo Account
        if (cleanId === 'admin' || cleanId === 'admin@ezjob.com' || cleanId.startsWith('admin')) {
            if (cleanPass === 'admin123' || cleanPass === '123123' || cleanPass === 'admin') {
                const adminUser: User = {
                    id: 'admin_demo_account',
                    identifier: 'admin',
                    role: UserRole.ADMIN
                };
                localStorage.setItem('mock_auth_user', JSON.stringify(adminUser));
                sessionStorage.setItem('isAdmin', 'true');
                setUser(adminUser);
                return;
            } else {
                throw new Error('Incorrect password for Admin. Please use PASS: admin123');
            }
        }

        // 2. Check Employer Demo Account
        if (cleanId === 'emp' || cleanId === 'emp@ezjob.com' || cleanId.startsWith('emp') || cleanId.startsWith('employer')) {
            if (cleanPass === 'emp123' || cleanPass === '123123' || cleanPass === 'emp' || cleanPass === 'employer123') {
                const empUser: User = {
                    id: 'emp_demo_account',
                    identifier: 'emp',
                    role: UserRole.EMPLOYER
                };
                localStorage.setItem('mock_auth_user', JSON.stringify(empUser));
                sessionStorage.removeItem('isAdmin');
                setUser(empUser);
                return;
            } else {
                throw new Error('Incorrect password for Employer. Please use PASS: emp123');
            }
        }

        // 3. Check Worker Demo Account
        if (cleanId === 'worker' || cleanId === 'worker@ezjob.com' || cleanId.startsWith('work') || cleanId === 'user') {
            if (cleanPass === 'worker123' || cleanPass === '123123' || cleanPass === 'worker') {
                const workerUser: User = {
                    id: 'worker_demo_account',
                    identifier: 'worker',
                    role: UserRole.WORKER
                };
                localStorage.setItem('mock_auth_user', JSON.stringify(workerUser));
                sessionStorage.removeItem('isAdmin');
                setUser(workerUser);
                return;
            } else {
                throw new Error('Incorrect password for Worker. Please use PASS: worker123');
            }
        }

        // 4. If identifier is NOT an email, log in as temporary worker or employer by default without calling Firebase
        if (!cleanId.includes('@')) {
            const tempUser: User = {
                id: `temp_${cleanId}_account`,
                identifier: cleanId,
                role: cleanId.includes('emp') ? UserRole.EMPLOYER : UserRole.WORKER
            };
            localStorage.setItem('mock_auth_user', JSON.stringify(tempUser));
            sessionStorage.removeItem('isAdmin');
            setUser(tempUser);
            return;
        }

        // 5. If it is an email, attempt Firebase authentication
        try {
            await signInWithEmailAndPassword(auth, identifier.trim(), password.trim());
            localStorage.removeItem('mock_auth_user');
        } catch (err: any) {
            console.warn('Firebase login failed, falling back to mock user session:', err.message);
            // In temporary demo mode, automatically allow the email login as a mock session
            const fallbackUser: User = {
                id: `user_${cleanId.replace(/[^a-zA-Z0-9]/g, '_')}`,
                identifier: identifier.trim(),
                role: cleanId.includes('admin') ? UserRole.ADMIN : (cleanId.includes('emp') ? UserRole.EMPLOYER : UserRole.WORKER)
            };
            localStorage.setItem('mock_auth_user', JSON.stringify(fallbackUser));
            setUser(fallbackUser);
        }
    };

    const register = async (email: string, password: string, role: UserRole) => {
        const cleanIdentifier = (email || '').trim();
        
        // If not a standard email, create mock registration immediately
        if (!cleanIdentifier.includes('@')) {
            const newUser: User = {
                id: `registered_${cleanIdentifier.toLowerCase()}_${Date.now()}`,
                identifier: cleanIdentifier,
                role: role
            };
            localStorage.setItem('mock_auth_user', JSON.stringify(newUser));
            setUser(newUser);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, cleanIdentifier, password);
            const uid = userCredential.user.uid;

            // Create user document in Firestore
            await setDoc(doc(db, 'users', uid), {
                id: uid,
                identifier: cleanIdentifier,
                role: role,
                createdAt: new Date().toISOString()
            });

            const newUser: User = {
                id: uid,
                identifier: cleanIdentifier,
                role: role
            };
            localStorage.removeItem('mock_auth_user');
            setUser(newUser);
        } catch (err: any) {
            console.warn('Firebase registration failed, saving mock session:', err.message);
            const fallbackUser: User = {
                id: `registered_${cleanIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}`,
                identifier: cleanIdentifier,
                role: role
            };
            localStorage.setItem('mock_auth_user', JSON.stringify(fallbackUser));
            setUser(fallbackUser);
        }
    };

    const logout = async () => {
        localStorage.removeItem('mock_auth_user');
        sessionStorage.removeItem('isAdmin');
        try {
            await signOut(auth);
        } catch (e) {
            // Ignore if wasn't signed in to firebase
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};