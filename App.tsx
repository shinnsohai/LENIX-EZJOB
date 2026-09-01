
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { User } from './types';
import { UserRole } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SiteContentProvider } from './contexts/SiteContentContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import WorkerDashboard from './pages/WorkerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import JobSearchPage from './pages/JobSearchPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AboutUsPage from './pages/AboutUsPage';
import ContactPage from './pages/ContactPage';
import CareersPage from './pages/CareersPage';
import BlogPage from './pages/BlogPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import AppliedJobsPage from './pages/AppliedJobsPage';
import JobDetailPage from './pages/JobDetailPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import Spinner from './components/Spinner';
import PublicWorkerProfile from './pages/PublicWorkerProfile';
import ErrorBoundary from './components/ErrorBoundary';


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
                <AuthProvider>
                    <SiteContentProvider>
                        <HashRouter>
                            <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
                                <Header />
                                <main className="flex-grow">
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
                                </main>
                                <Footer />
                            </div>
                        </HashRouter>
                    </SiteContentProvider>
                </AuthProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;
