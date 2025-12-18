import { useEffect, useState } from 'react';
import { getAdminStats, getRecentGames } from '../services/analytics';
import type { GameLog } from '../services/analytics';
import { getDailyPuzzle } from '../data/puzzles';
import { PuzzleMasterPortal } from '../components/PuzzleMasterPortal';

interface AdminStats {
    totalGames: number;
    winRate: number;
    averageScore: number;
}

const GameDetailsModal = ({ game, onClose }: { game: GameLog | null, onClose: () => void }) => {
    if (!game) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                background: 'var(--color-bg-primary)', padding: '20px', borderRadius: '10px',
                maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
                border: '1px solid var(--color-border)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Game Details</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <p><strong>User ID:</strong> <span style={{ fontFamily: 'monospace' }}>{game.userId || 'Anonymous'}</span></p>
                    <p><strong>Time:</strong> {new Date(game.timestamp || Date.now()).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span style={{ color: game.status === 'won' ? 'var(--color-primary)' : 'var(--color-error)' }}>{game.status.toUpperCase()}</span></p>
                    <p><strong>Score:</strong> {game.score}</p>
                    <p><strong>Strikes:</strong> {game.strikes}</p>
                </div>

                <h3>Guesses ({game.guesses.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {game.guesses.map((guess, i) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '10px', background: 'var(--color-bg-secondary)', borderRadius: '5px',
                            borderLeft: `4px solid ${guess.isCorrect ? 'var(--color-primary)' : 'var(--color-error)'}`
                        }}>
                            <span>Puzzle #{guess.puzzleIndex + 1}: <strong>{guess.letter}</strong></span>
                            <span>{guess.isCorrect ? 'Correct' : 'Incorrect'}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

import { UserManagement } from '../components/UserManagement';
import { useUsers } from '../contexts/UsersContext';
import { updateUserHandle } from '../services/userService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getTrendData, type TrendDataPoint } from '../services/analytics';

const TrendsDashboard = () => {
    const [data, setData] = useState<TrendDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState(30);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await getTrendData(range);
            setData(res);
            setLoading(false);
        };
        load();
    }, [range]);

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading trends...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                <select
                    value={range}
                    onChange={e => setRange(Number(e.target.value))}
                    style={{ padding: '8px', borderRadius: '5px', background: 'var(--color-bg-secondary)', color: 'white', border: '1px solid var(--color-border)' }}
                >
                    <option value={14}>Last 14 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={60}>Last 60 Days</option>
                    <option value={90}>Last 90 Days</option>
                </select>
            </div>

            {/* CHART 1: PLAYS */}
            <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Play Activity</h3>
                <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} syncId="trends" margin={{ top: 10, right: 50, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="date" stroke="#aaa" tickFormatter={str => str.slice(5)} angle={-45} textAnchor="end" height={60} />
                            <YAxis stroke="#aaa" width={40} />
                            <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }} />
                            <Legend verticalAlign="top" height={36} />
                            <Line type="monotone" dataKey="plays" name="Total Plays" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* CHART 2: SCORES & RATINGS */}
            <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Puzzle Quality & Difficulty</h3>
                <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} syncId="trends" margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="date" stroke="#aaa" tickFormatter={str => str.slice(5)} angle={-45} textAnchor="end" height={60} />
                            <YAxis yAxisId="left" stroke="#aaa" orientation="left" domain={[0, 10]} width={40} />
                            <YAxis yAxisId="right" stroke="#aaa" orientation="right" domain={[0, 100]} unit="%" width={40} />
                            <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }} />
                            <Legend verticalAlign="top" height={36} />
                            <Line yAxisId="left" type="monotone" dataKey="avgScore" name="Avg Score (0-10)" stroke="var(--color-secondary)" strokeWidth={2} dot={false} />
                            <Line yAxisId="left" type="monotone" dataKey="avgRating" name="Avg Rating (1-10)" stroke="var(--color-primary)" strokeWidth={2} dot={false} connectNulls />
                            <Line yAxisId="right" type="monotone" dataKey="winRate" name="Win Rate %" stroke="var(--color-accent)" strokeWidth={2} dot={false}
                                data={data.map(d => ({ ...d, winRate: d.plays > 0 ? Math.round((d.wins / d.plays) * 100) : null }))} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export const AdminPage = () => {
    const dailyPuzzle = getDailyPuzzle();
    const { currentUser } = useUsers();

    // Default to 'dashboard', 'puzzles', or 'users'
    const [mode, setMode] = useState<'dashboard' | 'puzzles' | 'users' | 'profile' | 'trends'>('dashboard');
    const [selectedDate, setSelectedDate] = useState(dailyPuzzle.date);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentGames, setRecentGames] = useState<GameLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedGame, setSelectedGame] = useState<GameLog | null>(null);
    const [pmStats, setPmStats] = useState<import('../services/statsService').PMStat[]>([]);

    // Sort configuration
    const [sortConfig, setSortConfig] = useState<{
        key: keyof import('../services/statsService').PMStat;
        direction: 'asc' | 'desc';
    }>({ key: 'publishedCount', direction: 'desc' });

    const handleSort = (key: keyof import('../services/statsService').PMStat) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedPmStats = [...pmStats].sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        // Handle nulls (treat as -1 or infinity depending on desire, here we typically treat as 0 for stats)
        const numA = typeof valA === 'number' ? valA : 0;
        const numB = typeof valB === 'number' ? valB : 0;

        if (numA < numB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (numA > numB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    useEffect(() => {
        if (mode === 'puzzles' || mode === 'users') return; // Don't fetch dashboard data if not in dashboard mode

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Dynamically import to avoid circular dependencies if any
                const { getPMStats } = await import('../services/statsService');

                const [statsData, gamesData, pmData] = await Promise.all([
                    getAdminStats(selectedDate),
                    getRecentGames(50, selectedDate),
                    getPMStats()
                ]);
                setStats(statsData);
                setRecentGames(gamesData);
                setPmStats(pmData);
            } catch (e: any) {
                console.error("Dashboard error:", e);
                setError(e.message || "Failed to load dashboard data");
            }
            setLoading(false);
        };
        fetchData();
    }, [selectedDate, mode]);

    const handleDateChange = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ margin: '0 0 10px 0' }}>Admin Portal</h1>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>{currentUser?.handle}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{currentUser?.role.toUpperCase()}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setMode('dashboard')}
                        style={{
                            background: 'none', border: 'none',
                            color: mode === 'dashboard' ? 'var(--color-primary)' : 'var(--color-text)',
                            fontSize: '1.2rem', cursor: 'pointer', paddingBottom: '10px',
                            borderBottom: mode === 'dashboard' ? '2px solid var(--color-primary)' : '2px solid transparent'
                        }}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setMode('puzzles')}
                        style={{
                            background: 'none', border: 'none',
                            color: mode === 'puzzles' ? 'var(--color-primary)' : 'var(--color-text)',
                            fontSize: '1.2rem', cursor: 'pointer', paddingBottom: '10px',
                            borderBottom: mode === 'puzzles' ? '2px solid var(--color-primary)' : '2px solid transparent'
                        }}
                    >
                        Puzzle Master
                    </button>
                    <button
                        onClick={() => setMode('profile')}
                        style={{
                            background: 'none', border: 'none',
                            color: mode === 'profile' ? 'var(--color-primary)' : 'var(--color-text)',
                            fontSize: '1.2rem', cursor: 'pointer', paddingBottom: '10px',
                            borderBottom: mode === 'profile' ? '2px solid var(--color-primary)' : '2px solid transparent'
                        }}
                    >
                        My Profile
                    </button>
                    <button
                        onClick={() => setMode('trends')}
                        style={{
                            background: 'none', border: 'none',
                            color: mode === 'trends' ? 'var(--color-primary)' : 'var(--color-text)',
                            fontSize: '1.2rem', cursor: 'pointer', paddingBottom: '10px',
                            borderBottom: mode === 'trends' ? '2px solid var(--color-primary)' : '2px solid transparent'
                        }}
                    >
                        Trends
                    </button>
                    {currentUser?.role === 'admin' && (
                        <button
                            onClick={() => setMode('users')}
                            style={{
                                background: 'none', border: 'none',
                                color: mode === 'users' ? 'var(--color-primary)' : 'var(--color-text)',
                                fontSize: '1.2rem', cursor: 'pointer', paddingBottom: '10px',
                                borderBottom: mode === 'users' ? '2px solid var(--color-primary)' : '2px solid transparent'
                            }}
                        >
                            Users
                        </button>
                    )}
                </div>

                {mode === 'dashboard' && (
                    <div className="admin-date-nav">
                        <button
                            onClick={() => handleDateChange(-1)}
                            style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            ←
                        </button>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                background: 'var(--color-bg-secondary)', color: 'var(--color-text)',
                                border: '1px solid var(--color-border)', padding: '5px 10px', borderRadius: '5px',
                                fontSize: '1rem', fontFamily: 'inherit'
                            }}
                        />

                        <button
                            onClick={() => handleDateChange(1)}
                            disabled={isToday}
                            style={{
                                background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)',
                                padding: '5px 10px', borderRadius: '5px', cursor: isToday ? 'default' : 'pointer',
                                opacity: isToday ? 0.3 : 1
                            }}
                        >
                            →
                        </button>
                    </div>
                )}
            </div>

            {mode === 'users' && <UserManagement />}

            {mode === 'puzzles' && <PuzzleMasterPortal />}

            {mode === 'trends' && (
                <TrendsDashboard />
            )}

            {mode === 'profile' && (
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div className="admin-stats-container">
                        {(() => {
                            const myStats = pmStats.find(s => s.handle === currentUser?.handle);
                            return (
                                <>
                                    <div className="admin-stat-card">
                                        <h3 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Created</h3>
                                        <div className="admin-stat-value" style={{ color: 'var(--color-primary)' }}>{myStats?.totalCreated || 0}</div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <h3 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Published</h3>
                                        <div className="admin-stat-value" style={{ color: 'var(--color-secondary)' }}>{myStats?.publishedCount || 0}</div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <h3 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Avg Score</h3>
                                        <div className="admin-stat-value" style={{ color: 'var(--color-accent)' }}>{myStats?.averageGlobalScore || '-'}</div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '10px' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>Edit Profile</h2>

                        <div className="form-group">
                            <label>Handle (Public Name)</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    defaultValue={currentUser?.handle}
                                    id="handle-input"
                                    style={{ flex: 1 }}
                                />
                                <button
                                    className="btn-confirm"
                                    onClick={async () => {
                                        const input = document.getElementById('handle-input') as HTMLInputElement;
                                        const newHandle = input.value;
                                        if (newHandle && newHandle !== currentUser?.handle && currentUser?.uid) {
                                            if (confirm(`Change handle to "${newHandle}"? This will update all your past puzzles.`)) {
                                                try {
                                                    await updateUserHandle(currentUser.uid, currentUser.handle, newHandle);
                                                    alert("Handle updated! Reloading...");
                                                    window.location.reload();
                                                } catch (e: any) {
                                                    alert("Error updating handle: " + e.message);
                                                }
                                            }
                                        }
                                    }}
                                >
                                    Update
                                </button>
                            </div>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '5px' }}>
                                Changing your handle will automatically update the "Created by" text on all your existing puzzles.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'dashboard' && (
                <>
                    {error && (
                        <div style={{
                            background: 'rgba(255, 0, 0, 0.1)', border: '1px solid var(--color-error)',
                            color: 'var(--color-error)', padding: '15px', borderRadius: '10px',
                            marginBottom: '20px', textAlign: 'center'
                        }}>
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Dashboard...</div>
                    ) : (
                        <>
                            <div className="admin-stats-container">
                                <div className="admin-stat-card">
                                    <h3 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Total Games</h3>
                                    <div className="admin-stat-value" style={{ color: 'var(--color-primary)' }}>{stats?.totalGames}</div>
                                </div>
                                <div className="admin-stat-card">
                                    <h3 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Win Rate</h3>
                                    <div className="admin-stat-value" style={{ color: 'var(--color-secondary)' }}>{Math.round(stats?.winRate || 0)}%</div>
                                </div>
                                <div className="admin-stat-card">
                                    <h3 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Avg Score</h3>
                                    <div className="admin-stat-value" style={{ color: 'var(--color-accent)' }}>{stats?.averageScore.toFixed(1)}</div>
                                </div>
                            </div>

                            <h2 style={{ marginBottom: '20px' }}>Recent Games</h2>
                            <div className="admin-table-container">
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <th style={{ padding: '10px' }}>Time</th>
                                            <th style={{ padding: '10px' }}>User ID</th>
                                            <th style={{ padding: '10px' }}>Status</th>
                                            <th style={{ padding: '10px' }}>Strikes</th>
                                            <th style={{ padding: '10px' }}>Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentGames.map((game, index) => {
                                            let timeString = 'N/A';
                                            try {
                                                if (game.timestamp?.toDate) {
                                                    timeString = game.timestamp.toDate().toLocaleTimeString();
                                                } else if (game.timestamp?.seconds) {
                                                    timeString = new Date(game.timestamp.seconds * 1000).toLocaleTimeString();
                                                } else if (game.timestamp) {
                                                    timeString = new Date(game.timestamp).toLocaleTimeString();
                                                }
                                            } catch (e) {
                                                console.error('Date parsing error', e);
                                            }

                                            return (
                                                <tr
                                                    key={index}
                                                    onClick={() => setSelectedGame(game)}
                                                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <td style={{ padding: '10px' }}>{timeString}</td>
                                                    <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '0.9em', opacity: 0.8 }}>
                                                        {game.userId ? game.userId.slice(0, 8) + '...' : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '10px', color: game.status === 'won' ? 'var(--color-primary)' : 'var(--color-error)' }}>
                                                        {game.status.toUpperCase()}
                                                    </td>
                                                    <td style={{ padding: '10px' }}>{game.strikes}</td>
                                                    <td style={{ padding: '10px' }}>{game.score}</td>
                                                </tr>
                                            );
                                        })}
                                        {recentGames.length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>No games recorded for this date.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>Puzzle Master Leaderboard</h2>
                            <div className="admin-table-container">
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <th onClick={() => handleSort('handle')} style={{ padding: '10px', cursor: 'pointer', userSelect: 'none' }}>
                                                Handle {sortConfig.key === 'handle' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                            </th>
                                            <th onClick={() => handleSort('totalCreated')} style={{ padding: '10px', cursor: 'pointer', userSelect: 'none' }}>
                                                Total Created {sortConfig.key === 'totalCreated' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                            </th>
                                            <th onClick={() => handleSort('publishedCount')} style={{ padding: '10px', cursor: 'pointer', userSelect: 'none' }}>
                                                Published {sortConfig.key === 'publishedCount' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                            </th>
                                            <th onClick={() => handleSort('averageGlobalScore')} style={{ padding: '10px', cursor: 'pointer', userSelect: 'none' }}>
                                                Avg Global Score {sortConfig.key === 'averageGlobalScore' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                            </th>
                                            <th onClick={() => handleSort('averageRating')} style={{ padding: '10px', cursor: 'pointer', userSelect: 'none' }}>
                                                Avg Rating {sortConfig.key === 'averageRating' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedPmStats.map((stat, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{stat.handle}</td>
                                                <td style={{ padding: '10px' }}>{stat.totalCreated}</td>
                                                <td style={{ padding: '10px' }}>{stat.publishedCount}</td>
                                                <td style={{ padding: '10px' }}>{stat.averageGlobalScore > 0 ? stat.averageGlobalScore : '-'}</td>
                                                <td style={{ padding: '10px' }}>{stat.averageRating ? stat.averageRating : '-'}</td>
                                            </tr>
                                        ))}
                                        {sortedPmStats.length === 0 && (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>No puzzle data available.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}

            <GameDetailsModal game={selectedGame} onClose={() => setSelectedGame(null)} />

            <div style={{ marginTop: '40px', textAlign: 'center', paddingBottom: '20px' }}>
                <a href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>
                    ← Back to Game
                </a>
            </div>
        </div>
    );
};
