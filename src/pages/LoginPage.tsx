import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/analytics';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/admin');
        } catch (err: any) {
            console.error("Login error:", err);
            setError('Failed to login. Please check your credentials.');
        }
    };

    return (
        <div style={{ padding: '20px', color: 'white', maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
            <h1 style={{ marginBottom: '20px', color: 'var(--color-primary)' }}>Admin Login</h1>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ padding: '12px', borderRadius: '5px', border: 'none' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ padding: '12px', borderRadius: '5px', border: 'none' }}
                />
                {error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}
                <button type="submit" style={{
                    padding: '12px',
                    background: 'var(--color-primary)',
                    border: 'none',
                    color: '#0f172a',
                    fontWeight: 'bold',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                }}>
                    Login
                </button>
            </form>
        </div>
    );
};
