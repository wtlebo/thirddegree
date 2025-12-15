import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signOut } from 'firebase/auth';
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

    // UseEffect redirect removed to allow users to see the Profile/Logout page
    // Users can navigate to specific tools via buttons now.

    const handleLogin = async (providerName: 'google' | 'facebook' | 'apple') => {
        let provider: any;
        switch (providerName) {
            case 'google':
                provider = new GoogleAuthProvider();
                break;
            case 'facebook':
                provider = new FacebookAuthProvider();
                break;
            case 'apple':
                provider = new OAuthProvider('apple.com');
                break;
        }

        try {
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error(`${providerName} Login Error:`, err);
            if (err.code !== 'auth/popup-closed-by-user') {
                alert(`Login failed: ${err.message}`);
            }
        }
    };

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseUser || !newHandle.trim()) return;

        setIsCreating(true);
        setCreationError('');

        try {
            // Re-check permissions/role
            const { checkUserAllowed } = await import('../services/userService');
            const { role } = await checkUserAllowed(firebaseUser.email || '');

            const finalRole = role || 'player'; // Default to player

            await createUserProfile(firebaseUser.uid, firebaseUser.email || '', newHandle.trim(), finalRole);

            // Refresh context to pull the new profile
            await refreshProfile();
        } catch (err: any) {
            console.error("Profile creation error:", err);
            setCreationError(err.message);
        }
        setIsCreating(false);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/'); // Go home after logout
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    if (loading) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Loading...</div>;
    }

    // Scenario 0: Logged In and Has Profile -> Show Profile / Logout View
    if (currentUser) {
        return (
            <div style={{ padding: '20px', color: 'white', maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '10px', color: 'var(--color-primary)' }}>My Account</h1>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '15px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-secondary)', color: 'black',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', fontWeight: 'bold',
                        margin: '0 auto 20px auto'
                    }}>
                        {currentUser.handle.charAt(0).toUpperCase()}
                    </div>

                    <h2 style={{ marginBottom: '5px' }}>{currentUser.handle}</h2>
                    <p style={{ opacity: 0.6, marginBottom: '30px' }}>{currentUser.role === 'player' ? 'Player' : currentUser.role.toUpperCase()}</p>

                    {(currentUser.role === 'admin' || currentUser.role === 'pm') && (
                        <button
                            onClick={() => navigate('/admin')}
                            style={{
                                width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '5px', border: 'none',
                                background: 'var(--color-primary)', color: 'black', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            Enter Admin Portal
                        </button>
                    )}

                    <button
                        onClick={handleSignOut}
                        style={{
                            width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.2)',
                            background: 'transparent', color: 'white', cursor: 'pointer'
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    // Scenario 1: Not logged in at all
    if (!firebaseUser) {
        return (
            <div style={{ padding: '20px', color: 'white', maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '10px', color: 'var(--color-primary)' }}>Sign In / Sign Up</h1>
                <p style={{ marginBottom: '30px', opacity: 0.8 }}>
                    Create a free account to sync your stats across devices and keep your streak alive!
                </p>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button
                        onClick={() => handleLogin('google')}
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

                    <button
                        onClick={() => handleLogin('facebook')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            width: '100%', padding: '12px', borderRadius: '5px', border: 'none',
                            background: '#1877F2', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer'
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Sign in with Facebook
                    </button>

                    <button
                        onClick={() => handleLogin('apple')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            width: '100%', padding: '12px', borderRadius: '5px', border: 'none',
                            background: 'black', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer'
                        }}
                    >
                        <svg viewBox="0 0 384 512" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
                        </svg>
                        Sign in with Apple
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
                <p>You've been invited to join Hang 10.</p>
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
