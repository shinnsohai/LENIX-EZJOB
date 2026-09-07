import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSiteContent } from '../contexts/SiteContentContext';
import { UserRole } from '../types';
import { User, Lock, UserCheck, Briefcase, MailCheck } from 'lucide-react';

interface AuthPageProps {
    mode: 'login' | 'register';
}

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.WORKER);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Set when registration succeeds but the Supabase project requires email
    // confirmation (no session comes back yet) -- shows a "check your email"
    // state instead of silently sitting on the form forever.
    const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);

    const { login, register, user, signInWithGoogle } = useAuth();
    const { isDark } = useTheme();
    const { siteAssets } = useSiteContent();
    const navigate = useNavigate();

    const isRegister = mode === 'register';

    const title = isRegister ? 'Create Your Account' : 'Account Login';
    const subTitle = isRegister
        ? "Join EZJOB by LENIX to connect with high-velocity skilled trade roles or verified talent."
        : "Sign in with your email and password to access your dashboard.";

    const clarityLogoSrc = '/assets/clarity-logo.jpeg';
    const lenixLogoSrc = isDark ? '/assets/lenix-logo-dark.jpeg' : '/assets/lenix-logo-light.png';
    const ezjobLogoSrc = isDark ? '/assets/ezjob-logo-dark.png' : '/assets/ezjob-logo-light.png';

    // Redirect once a resolved user is present -- covers both a just-completed
    // email/password login/register on this page (awaitingRedirect) and a
    // Google OAuth round-trip landing back on /login with a session already
    // established (no awaitingRedirect involved, since that's a fresh mount
    // of this component after the redirect). Also means visiting /login or
    // /register while already authenticated just bounces you to your
    // dashboard instead of showing the form again -- the more useful behavior.
    useEffect(() => {
        if (!user) {
            return;
        }

        const destination =
            user.role === UserRole.ADMIN ? '/admin/dashboard' :
            user.role === UserRole.EMPLOYER ? '/employer/dashboard' :
            '/worker/dashboard';

        navigate(destination, { replace: true });
    }, [user, navigate]);

    const handleGoogleSignIn = async () => {
        setError('');
        setIsLoading(true);
        try {
            await signInWithGoogle(isRegister ? role : undefined);
            // No further action here -- signInWithGoogle() redirects the
            // browser to Google immediately on success.
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to start Google sign-in.');
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!identifier.trim()) {
            setError('Email is required.');
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
                const { needsEmailConfirmation } = await register(identifier, password, role);
                if (needsEmailConfirmation) {
                    setPendingConfirmationEmail(identifier.trim());
                    setIsLoading(false);
                    return;
                }
            } else {
                await login(identifier, password);
            }
            // No explicit redirect call here -- the effect above fires once
            // AuthContext resolves `user` from the new session.
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
                    {pendingConfirmationEmail ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center">
                                <MailCheck size={26} className="text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Check your email</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed">
                                We sent a confirmation link to
                                <br />
                                <span className="text-slate-900 dark:text-white font-bold">{pendingConfirmationEmail}</span>
                                <br />
                                Click it to activate your account, then sign in below.
                            </p>
                            <div className="pt-2">
                                <Link
                                    to="/login"
                                    className="inline-block w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold uppercase text-xs font-mono rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25"
                                >
                                    Go to Sign In
                                </Link>
                            </div>
                        </div>
                    ) : (
                    <>
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1.5 leading-relaxed">{subTitle}</p>
                    </div>

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
                                Email Address
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    id="identifier"
                                    name="identifier"
                                    type="email"
                                    autoComplete="username"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-cyan-500 font-mono text-sm"
                                    placeholder="you@example.com"
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

                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">Or</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-mono text-xs font-bold rounded-xl transition-all hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div className="text-center mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {isRegister ? "Already registered?" : "Don't have an account yet?"}
                        <Link to={isRegister ? '/login' : '/register'} className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-bold ml-1.5 transition-colors">
                            {isRegister ? 'Sign In' : 'Sign Up'}
                        </Link>
                    </div>
                    </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
