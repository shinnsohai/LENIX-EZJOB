
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { User } from './types';
import { UserRole } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SiteContentProvider } from './contexts/SiteContentContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Spinner from './components/Spinner';
import ErrorBoundary from './components/ErrorBoundary';

// Route-level code splitting: each page is its own chunk instead of one
// ~800KB bundle. The main JS payload dropped from ~217KB gzip to a shell +
// only the current route's chunk (see Suspense fallback below).
const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const WorkerDashboard = lazy(() => import('./pages/WorkerDashboard'));
const EmployerDashboard = lazy(() => import('./pages/EmployerDashboard'));
const JobSearchPage = lazy(() => import('./pages/JobSearchPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const AppliedJobsPage = lazy(() => import('./pages/AppliedJobsPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage'));
const PublicWorkerProfile = lazy(() => import('./pages/PublicWorkerProfile'));

const RouteFallback: React.FC = () => (
    <div className="min-h-[60vh] flex justify-center items-center">
        <Spinner size="lg" />
    </div>
);


// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const ProtectedRoute: React.FC<{ children: React.ReactElement; role: UserRole }> = ({ children, role }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-slate-100 dark:bg-slate-950">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user.role !== role) {
        return <Navigate to="/" replace />;
    }

    return children;
};


function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <ToastProvider>
                <AuthProvider>
                    <SiteContentProvider>
                        <BrowserRouter>
                            <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
                                <Header />
                                <main className="flex-grow">
                                    <Suspense fallback={<RouteFallback />}>
                                    <Routes>
                                        <Route path="/" element={<HomePage />} />
                                        <Route path="/login" element={<AuthPage mode="login" />} />
                                        <Route path="/register" element={<AuthPage mode="register" />} />
                                        <Route path="/jobs" element={<JobSearchPage />} />
                                        <Route path="/jobs/:id" element={<JobDetailPage />} />
                                        <Route path="/employer/profile/:id" element={<CompanyProfilePage />} />

                                        {/* Static & Legal Pages */}
                                        <Route path="/about" element={<AboutUsPage />} />
                                        <Route path="/contact" element={<ContactPage />} />
                                        <Route path="/careers" element={<CareersPage />} />
                                        <Route path="/blog" element={<BlogPage />} />
                                        <Route path="/privacy" element={<PrivacyPolicyPage />} />
                                        <Route path="/terms" element={<TermsOfServicePage />} />

                                        {/* Public Worker Profile */}
                                        <Route path="/worker/profile/:id" element={<PublicWorkerProfile />} />

                                        <Route
                                            path="/worker/dashboard"
                                            element={
                                                <ProtectedRoute role={UserRole.WORKER}>
                                                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                        <WorkerDashboard />
                                                    </div>
                                                </ProtectedRoute>
                                            }
                                        />

                                        <Route
                                            path="/worker/applications"
                                            element={
                                                <ProtectedRoute role={UserRole.WORKER}>
                                                    <AppliedJobsPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        <Route
                                            path="/employer/dashboard"
                                            element={
                                                <ProtectedRoute role={UserRole.EMPLOYER}>
                                                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                        <EmployerDashboard />
                                                    </div>
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Admin Routes */}
                                        <Route path="/admin/login" element={<AdminLoginPage />} />
                                        <Route
                                            path="/admin/dashboard"
                                            element={
                                                <AdminProtectedRoute>
                                                    <AdminDashboard />
                                                </AdminProtectedRoute>
                                            }
                                        />

                                        <Route path="*" element={<Navigate to="/" />} />
                                    </Routes>
                                    </Suspense>
                                </main>
                                <Footer />
                            </div>
                        </BrowserRouter>
                    </SiteContentProvider>
                </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;
