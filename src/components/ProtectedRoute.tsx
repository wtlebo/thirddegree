import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/analytics';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth State Changed:", user);
            if (user && !user.isAnonymous) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        });

        return () => unsubscribe();
    }, []);

    if (isAuthenticated === null) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
