import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/analytics';
import { getUserProfile, checkUserAllowed } from '../services/userService';
import type { UserProfile } from '../types';

interface UsersContextType {
    currentUser: UserProfile | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType>({
    currentUser: null,
    firebaseUser: null,
    loading: true,
    error: null,
    refreshProfile: async () => { },
});

export const useUsers = () => useContext(UsersContext);

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshProfile = async () => {
        if (!firebaseUser) return;
        try {
            const profile = await getUserProfile(firebaseUser.uid);
            setCurrentUser(profile);
        } catch (err: any) {
            console.error("Error refreshing profile:", err);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            setLoading(true);
            setError(null);

            if (user) {
                // Ignore anonymous users (Guests) -> allow them to exist but no profile
                if (user.isAnonymous) {
                    setCurrentUser(null);
                    setLoading(false);
                    return;
                }

                try {
                    // Check if allowed first (security layer)
                    const { allowed } = await checkUserAllowed(user.email || '');

                    if (!allowed) {
                        setError("Access Denied: Your email is not on the invited list.");
                        setCurrentUser(null);
                        setLoading(false);
                        return;
                    }

                    // Fetch full profile
                    const profile = await getUserProfile(user.uid);
                    setCurrentUser(profile); // Might be null if they haven't onboarded yet
                } catch (err: any) {
                    console.error("Auth context error:", err);
                    setError(err.message);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <UsersContext.Provider value={{ currentUser, firebaseUser, loading, error, refreshProfile }}>
            {children}
        </UsersContext.Provider>
    );
};
