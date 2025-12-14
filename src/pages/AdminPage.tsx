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

export const AdminPage = () => {
    const dailyPuzzle = getDailyPuzzle();
    const { currentUser } = useUsers();

    // Default to 'dashboard', 'puzzles', or 'users'
    const [mode, setMode] = useState<'dashboard' | 'puzzles' | 'users'>('dashboard');
    const [selectedDate, setSelectedDate] = useState(dailyPuzzle.date);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentGames, setRecentGames] = useState<GameLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedGame, setSelectedGame] = useState<GameLog | null>(null);
    const [pmStats, setPmStats] = useState<import('../services/statsService').PMStat[]>([]);

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h1 style={{ margin: 0 }}>Admin Portal</h1>
                    <div style={{ textAlign: 'right' }}>
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
                                            <th style={{ padding: '10px' }}>Handle</th>
                                            <th style={{ padding: '10px' }}>Total Created</th>
                                            <th style={{ padding: '10px' }}>Published</th>
                                            <th style={{ padding: '10px' }}>Avg Global Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pmStats.map((stat, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{stat.handle}</td>
                                                <td style={{ padding: '10px' }}>{stat.totalCreated}</td>
                                                <td style={{ padding: '10px' }}>{stat.publishedCount}</td>
                                                <td style={{ padding: '10px' }}>{stat.averageGlobalScore > 0 ? stat.averageGlobalScore : '-'}</td>
                                            </tr>
                                        ))}
                                        {pmStats.length === 0 && (
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
        </div>
    );
};
