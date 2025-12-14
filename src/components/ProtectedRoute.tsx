import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUsers } from '../contexts/UsersContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { currentUser, firebaseUser, loading } = useUsers();

    if (loading) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    }

    // If not logged in at all -> Login
    if (!firebaseUser) {
        return <Navigate to="/login" replace />;
    }

    // If logged in, but no profile (Authorized but new) OR (Unauthorized) -> Login Page handles these states!
    // So we actually WANT to let them render if they are firebase authenticated, 
    // BUT the AdminPage expects a currentUser to work fully.
    // However, if we redirect to /login here when they are "authorized but pending profile", 
    // it works because /login handles the onboarding.

    // If they are unauthorized (contextError set), they also stay on /login (or get redirected there).

    // So, strict protection: if no currentUser, redirect to login?
    // If they are Onboarding, currentUser is null. Admin Page relies on currentUser.
    // So if currentUser is null, go to Login.
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
