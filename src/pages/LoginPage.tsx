import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/analytics';
import { useUsers } from '../contexts/UsersContext';
import { createUserProfile } from '../services/userService';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { currentUser, firebaseUser, loading, error: contextError, refreshProfile } = useUsers();

    // Local state for the handle creation form
    const [newHandle, setNewHandle] = useState('');
    const [creationError, setCreationError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        // If we have a full profile, we recall redirecting
        if (currentUser) {
            navigate('/admin');
        }
    }, [currentUser, navigate]);

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // Context will automatically pick up the user change and run logic
        } catch (err: any) {
            console.error("Google Login Error:", err);
            // If it's a popup closed by user, ignore. Otherwise show alert?
            if (err.code !== 'auth/popup-closed-by-user') {
                alert("Login failed: " + err.message);
            }
        }
    };

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseUser || !newHandle.trim()) return;

        setIsCreating(true);
        setCreationError('');

        try {
            // Role is determined by what invite they had (or admin if bootstrap).
            // But we need to know what role to give them.
            // The context checkUserAllowed returned it, but didn't expose it to us here.
            // We can re-check or just assume PM for now? 
            // Better: Context could expose 'detectedRole' or we can fetch it again.
            // Let's re-check the allow list one last time to be safe and get the role.
            const { checkUserAllowed } = await import('../services/userService');
            const { allowed, role } = await checkUserAllowed(firebaseUser.email || '');

            if (!allowed) {
                throw new Error("Access validation failed. Please contact admin.");
            }

            const finalRole = role || 'pm'; // Safe fallback

            await createUserProfile(firebaseUser.uid, firebaseUser.email || '', newHandle.trim(), finalRole);

            // Refresh context to pull the new profile
            await refreshProfile();
        } catch (err: any) {
            console.error("Profile creation error:", err);
            setCreationError(err.message);
        }
        setIsCreating(false);
    };

    if (loading) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Loading...</div>;
    }

    // Scenario 1: Not logged in at all
    if (!firebaseUser) {
        return (
            <div style={{ padding: '20px', color: 'white', maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '30px', color: 'var(--color-primary)' }}>Admin Portal</h1>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '15px' }}>
                    <p style={{ marginBottom: '20px', opacity: 0.8 }}>
                        Access is restricted to authorized Puzzle Masters and Admins.
                    </p>
                    <button
                        onClick={handleGoogleLogin}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            width: '100%', padding: '12px', borderRadius: '5px', border: 'none',
                            background: 'white', color: '#333', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer'
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.059 -13.144 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.769 -21.864 51.959 -21.864 51.129 C -21.864 50.299 -21.734 49.489 -21.484 48.729 L -21.484 45.639 L -25.464 45.639 C -26.284 47.269 -26.754 49.129 -26.754 51.129 C -26.754 53.129 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z" />
                                <path fill="#EA4335" d="M -14.754 43.769 C -12.984 43.769 -11.424 44.379 -10.174 45.579 L -6.714 42.119 C -8.804 40.169 -11.514 39.009 -14.754 39.009 C -19.444 39.009 -23.494 41.709 -25.464 45.639 L -21.484 48.729 C -20.534 45.879 -17.884 43.769 -14.754 43.769 Z" />
                            </g>
                        </svg>
                        Sign in with Google
                    </button>
                    {contextError && (
                        <div style={{ marginTop: '20px', color: 'var(--color-error)', fontSize: '0.9rem' }}>
                            {contextError}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Scenario 2: Logged in (Google), but Access Denied (not in allowlist)
    if (contextError) {
        return (
            <div style={{ padding: '20px', color: 'white', maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--color-error)' }}>Access Denied</h2>
                <p style={{ margin: '20px 0' }}>{contextError}</p>
                <button onClick={() => signOut(auth)} style={{ padding: '10px', cursor: 'pointer' }}>
                    Sign Out
                </button>
            </div>
        );
    }

    // Scenario 3: Logged in, Allowed, but NO Profile (First time setup)
    if (!currentUser && firebaseUser) {
        return (
            <div style={{ padding: '20px', color: 'white', maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '20px' }}>Welcome!</h1>
                <p>You've been invited to join Hang 5.</p>
                <p style={{ marginBottom: '20px', opacity: 0.8 }}>Please choose your "Puzzle Master Handle". This name will appear publicly on puzzles you create.</p>

                <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Handle / Display Name</label>
                        <input
                            value={newHandle}
                            onChange={e => setNewHandle(e.target.value)}
                            placeholder="e.g. The Riddler"
                            maxLength={30}
                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none' }}
                        />
                    </div>

                    {creationError && <div style={{ color: 'var(--color-error)' }}>{creationError}</div>}

                    <button
                        type="submit"
                        disabled={isCreating}
                        style={{
                            padding: '12px', background: 'var(--color-primary)', border: 'none', borderRadius: '5px',
                            color: 'black', fontWeight: 'bold', cursor: 'pointer', opacity: isCreating ? 0.7 : 1
                        }}
                    >
                        {isCreating ? 'Creating Profile...' : 'Complete Setup'}
                    </button>

                    <button type="button" onClick={() => signOut(auth)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', marginTop: '10px' }}>
                        Cancel & Sign Out
                    </button>
                </form>
            </div>
        );
    }

    return <div>Redirecting...</div>;
};
