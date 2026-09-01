
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const AdminProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const location = useLocation();
    const { user, loading } = useAuth();
    const isUserAdmin = user?.role === UserRole.ADMIN;

    if (loading) {
        return null;
    }

    if (!isUserAdmin) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default AdminProtectedRoute;
