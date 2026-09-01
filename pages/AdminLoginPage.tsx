import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import { ShieldCheck, Lock, User } from 'lucide-react';

const AdminLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, logout } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);

            // AuthContext resolves the profile asynchronously via
            // onAuthStateChange; fetch the fresh session/profile directly here
            // so we can gate on the real role before granting access.
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                setError('Login failed. Please try again.');
                setIsLoading(false);
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (profileError || !profile || profile.role !== UserRole.ADMIN) {
                await logout();
                setError('This account does not have admin access.');
                setIsLoading(false);
                return;
            }

            navigate('/admin/dashboard');
        } catch (err: any) {
            console.error('Admin login error:', err);
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-300">
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 30%, #06b6d4 0%, transparent 60%)'
                }}
            />

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl backdrop-blur-xl transition-colors">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center mb-4 shadow-sm">
                            <ShieldCheck size={26} />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Admin Operations Console</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">EZJOB by LENIX Intelligence & Moderation</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                        <div>
                            <label className="block text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px] mb-1.5 font-bold">Admin Email</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-amber-500 font-mono text-sm"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px] mb-1.5 font-bold">Security Key</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-amber-500 font-mono text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs text-center font-mono">
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold uppercase rounded-xl transition-all shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 cursor-pointer"
                            >
                                {isLoading ? 'Verifying Credentials...' : 'Access Admin Console'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-xs text-slate-500 dark:text-slate-400">
                        Need regular access?{' '}
                        <Link to="/login" className="text-cyan-600 dark:text-cyan-400 hover:underline font-bold">
                            User Portal
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
