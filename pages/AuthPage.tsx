import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSiteContent } from '../contexts/SiteContentContext';
import { UserRole } from '../types';
import { User, Lock, UserCheck, Briefcase, ShieldCheck, Zap } from 'lucide-react';

interface AuthPageProps {
    mode: 'login' | 'register';
}

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.WORKER);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, register } = useAuth();
    const { isDark } = useTheme();
    const { siteAssets } = useSiteContent();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.role) {
            setRole(location.state.role as UserRole);
        }
    }, [location.state]);

    const isRegister = mode === 'register';

    const title = isRegister ? 'Create Your Account' : 'Account Login';
    const subTitle = isRegister
        ? "Join EZJOB by LENIX to connect with high-velocity skilled trade roles or verified talent."
        : "Sign in with your temporary credentials to test and explore the platform.";

    const clarityLogoSrc = '/assets/clarity-logo.jpeg';
    const lenixLogoSrc = isDark ? '/assets/lenix-logo-dark.jpeg' : '/assets/lenix-logo-light.png';
    const ezjobLogoSrc = isDark ? '/assets/ezjob-logo-dark.png' : '/assets/ezjob-logo-light.png';

    const applyPreset = (presetKey: 'WORKER' | 'EMPLOYER' | 'ADMIN') => {
        const creds = DEMO_CREDENTIALS[presetKey];
        setIdentifier(creds.id);
        setPassword(creds.pass);
        setError('');
    };

    const handleQuickLogin = async (presetKey: 'WORKER' | 'EMPLOYER' | 'ADMIN') => {
        const creds = DEMO_CREDENTIALS[presetKey];
        setIdentifier(creds.id);
        setPassword(creds.pass);
        setIsLoading(true);
        setError('');

        try {
            await login(creds.id, creds.pass);
            if (creds.role === UserRole.ADMIN) {
                navigate('/admin/dashboard');
            } else if (creds.role === UserRole.EMPLOYER) {
                navigate('/employer/dashboard');
            } else {
                navigate('/worker/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login with preset.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!identifier.trim()) {
            setError('User ID or Email is required.');
            setIsLoading(false);
            return;
        }

        if (password.length < 3) {
            setError('Password must be at least 3 characters long.');
            setIsLoading(false);
            return;
        }

        try {
            if (isRegister) {
                await register(identifier, password, role);
                const destination = role === UserRole.WORKER ? '/worker/dashboard' : '/employer/dashboard';
                navigate(destination);
            } else {
                await login(identifier, password);
                const cleanId = identifier.trim().toLowerCase();
                if (cleanId === 'admin' || cleanId === 'admin@ezjob.com') {
                    navigate('/admin/dashboard');
                } else if (cleanId === 'emp' || cleanId === 'emp@ezjob.com' || cleanId === 'employer') {
                    navigate('/employer/dashboard');
                } else if (cleanId === 'worker' || cleanId === 'worker@ezjob.com') {
                    navigate('/worker/dashboard');
                } else {
                    navigate('/');
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to authenticate. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-900 dark:text-white transition-colors duration-300">
            {/* Background Glows */}
            <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-25"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 10%, #06b6d4 0%, transparent 50%), radial-gradient(circle at 80% 80%, #d946ef 0%, transparent 50%)'
                }}
            />

            <div className="w-full max-w-lg space-y-6 relative z-10">
                {/* Logo Banner */}
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-2 flex-wrap justify-center p-2 rounded-2xl bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-slate-900/90 dark:via-slate-950/90 dark:to-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className={`p-1 rounded-xl ${isDark ? 'bg-gradient-to-b from-white via-slate-100 to-slate-200 border border-slate-300 shadow-sm' : 'bg-white shadow-sm border border-slate-200/60'}`}>
                            <img 
                                src={clarityLogoSrc} 
                                alt="Clarity E&C Holding Company" 
                                className="h-11 sm:h-12 w-auto object-contain" 
                            />
                        </div>
                        <span className="text-slate-400 dark:text-cyan-400/80 font-mono text-sm sm:text-base font-bold select-none px-0.5">✕</span>
                        <div className={`p-1 rounded-xl ${isDark ? 'bg-gradient-to-b from-black via-slate-950 to-black border border-slate-800 shadow-md' : 'bg-white shadow-sm border border-slate-200/60'}`}>
                            <img 
                                src={lenixLogoSrc} 
                                alt="LENIX Company" 
                                className="h-9 sm:h-10 w-auto object-contain" 
                            />
                        </div>
                        <div className="h-7 w-[1.5px] bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent mx-0.5"></div>
                        <img 
                            src={ezjobLogoSrc} 
                            alt="EZJOB Product" 
                            className="h-9 sm:h-10 w-auto object-contain" 
                        />
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-7 sm:p-9 rounded-3xl shadow-xl backdrop-blur-xl transition-colors">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1.5 leading-relaxed">{subTitle}</p>
                    </div>

                    {/* Quick Demo Credentials Panel (For Login mode) */}
                    {!isRegister && (
                        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-cyan-50/80 via-white to-sky-50/80 dark:from-cyan-950/40 dark:via-slate-900 dark:to-slate-950 border border-cyan-200 dark:border-cyan-800/60 shadow-sm">
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="font-mono text-[11px] font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <Zap size={14} className="text-cyan-500 animate-pulse" />
                                    1-Click Test Credentials
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Pre-Supabase Mode</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                                {/* Worker Preset */}
                                <button
                                    type="button"
                                    onClick={() => handleQuickLogin('WORKER')}
                                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 border border-slate-200 dark:border-slate-700 hover:border-cyan-400 text-left transition-all group cursor-pointer shadow-xs"
                                >
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-700 dark:text-cyan-400 mb-0.5">
                                        <UserCheck size={12} />
                                        <span>Worker</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">ID: worker</div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Pass: worker123</div>
                                </button>

                                {/* Employer Preset */}
                                <button
                                    type="button"
                                    onClick={() => handleQuickLogin('EMPLOYER')}
                                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/60 border border-slate-200 dark:border-slate-700 hover:border-fuchsia-400 text-left transition-all group cursor-pointer shadow-xs"
                                >
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-0.5">
                                        <Briefcase size={12} />
                                        <span>Employer</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">ID: emp</div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Pass: emp123</div>
                                </button>

                                {/* Admin Preset */}
                                <button
                                    type="button"
                                    onClick={() => handleQuickLogin('ADMIN')}
                                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-amber-50 dark:hover:bg-amber-950/60 border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-left transition-all group cursor-pointer shadow-xs"
                                >
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-0.5">
                                        <ShieldCheck size={12} />
                                        <span>Admin</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">ID: admin</div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Pass: admin123</div>
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                        {isRegister && (
                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold mb-2">
                                    Select Account Type
                                </label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setRole(UserRole.WORKER)}
                                        className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            role === UserRole.WORKER 
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md' 
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <UserCheck size={14} />
                                        <span>Worker</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole(UserRole.EMPLOYER)}
                                        className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            role === UserRole.EMPLOYER 
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md' 
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <Briefcase size={14} />
                                        <span>Employer</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold mb-1.5">
                                User ID / Email
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    id="identifier" 
                                    name="identifier" 
                                    type="text" 
                                    autoComplete="username" 
                                    value={identifier} 
                                    onChange={(e) => setIdentifier(e.target.value)} 
                                    required
                                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-cyan-500 font-mono text-sm"
                                    placeholder="worker, emp, or admin"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold mb-1.5">
                                Security Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    autoComplete={isRegister ? "new-password" : "current-password"} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required
                                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-cyan-500 font-mono text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs text-center font-mono leading-relaxed">
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold uppercase rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isLoading ? 'Authenticating...' : (isRegister ? 'Create Account' : 'Sign In')}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {isRegister ? "Already registered?" : "Don't have an account yet?"}
                        <Link to={isRegister ? '/login' : '/register'} className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-bold ml-1.5 transition-colors">
                            {isRegister ? 'Sign In' : 'Sign Up'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;