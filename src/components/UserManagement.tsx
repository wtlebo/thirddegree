import { useState, useEffect } from 'react';
import { useUsers } from '../contexts/UsersContext';
import { getAllInvites, inviteUser, checkUserAllowed } from '../services/userService';
import type { AllowedUser } from '../types';

export const UserManagement = () => {
    const { currentUser } = useUsers();
    const [invites, setInvites] = useState<AllowedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'pm'>('pm');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadInvites = async () => {
        setLoading(true);
        try {
            const data = await getAllInvites();
            setInvites(data);
        } catch (err: any) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadInvites();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!currentUser) return;
        if (!inviteEmail) {
            setError("Email is required");
            return;
        }

        try {
            // Check if already exists
            const existing = await checkUserAllowed(inviteEmail);

            // If they exist AND have the exact same role, block it.
            if (existing.allowed && existing.role === inviteRole) {
                setError(`User already exists as ${existing.role.toUpperCase()}`);
                return;
            }

            // Otherwise (brand new user OR existing user changing roles), proceed.
            await inviteUser(inviteEmail, inviteRole, currentUser.uid);

            if (existing.allowed) {
                setMessage(`Updated ${inviteEmail} to ${inviteRole.toUpperCase()}`);
            } else {
                setMessage(`Invited ${inviteEmail} as ${inviteRole.toUpperCase()}`);
            }
            setInviteEmail('');
            loadInvites();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (currentUser?.role !== 'admin') {
        return <div>Access Denied. Admins only.</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>User Management</h2>

            <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
                <h3>Invite New User</h3>
                <form onSubmit={handleInvite} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                    />
                    <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as any)}
                        style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                    >
                        <option value="pm">Puzzle Master</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button type="submit" style={{ padding: '10px 20px', background: 'var(--color-primary)', border: 'none', borderRadius: '5px', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}>
                        Invite
                    </button>
                </form>
                {message && <div style={{ color: 'var(--color-primary)', marginTop: '10px' }}>{message}</div>}
                {error && <div style={{ color: 'var(--color-error)', marginTop: '10px' }}>{error}</div>}
            </div>

            <h3 style={{ marginTop: '30px' }}>Authorized Users</h3>
            <div className="admin-table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ padding: '10px' }}>Email</th>
                            <th style={{ padding: '10px' }}>Role</th>
                            <th style={{ padding: '10px' }}>Added By</th>
                            <th style={{ padding: '10px' }}>Date Added</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
                        ) : invites.map((user, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '10px' }}>{user.email}</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        background: user.role === 'admin' ? 'var(--color-accent)' : 'var(--color-secondary)',
                                        color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}>
                                        {user.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', opacity: 0.7 }}>{user.addedBy === 'system_bootstrap' ? 'System' : 'Admin'}</td>
                                <td style={{ padding: '10px', opacity: 0.7 }}>
                                    {user.addedAt?.seconds ? new Date(user.addedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
