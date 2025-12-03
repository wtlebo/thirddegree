import { useEffect, useState } from 'react';
import { getAdminStats, getRecentGames } from '../services/analytics';
import type { GameLog } from '../services/analytics';
import { getDailyPuzzle } from '../data/puzzles';

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

export const AdminPage = () => {
    const dailyPuzzle = getDailyPuzzle();
    const [selectedDate, setSelectedDate] = useState(dailyPuzzle.date);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentGames, setRecentGames] = useState<GameLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedGame, setSelectedGame] = useState<GameLog | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [statsData, gamesData] = await Promise.all([
                    getAdminStats(selectedDate),
                    getRecentGames(50, selectedDate)
                ]);
                setStats(statsData);
                setRecentGames(gamesData);
            } catch (e: any) {
                console.error("Dashboard error:", e);
                setError(e.message || "Failed to load dashboard data");
            }
            setLoading(false);
        };
        fetchData();
    }, [selectedDate]);

    const handleDateChange = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    return (
        <div style={{ padding: '20px', color: 'var(--color-text)', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 style={{ margin: '0 0 15px 0' }}>Admin Portal</h1>

                {/* Date Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.2rem' }}>
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
            </div>

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
                    {/* Overview Cards */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px', flexWrap: 'nowrap' }}>
                        <div className="stat-card" style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '10px', textAlign: 'center', flex: '1', minWidth: '150px' }}>
                            <h3 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Total Games</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{stats?.totalGames}</div>
                        </div>
                        <div className="stat-card" style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '10px', textAlign: 'center', flex: '1', minWidth: '150px' }}>
                            <h3 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Win Rate</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>{Math.round(stats?.winRate || 0)}%</div>
                        </div>
                        <div className="stat-card" style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '10px', textAlign: 'center', flex: '1', minWidth: '150px' }}>
                            <h3 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Avg Score</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>{stats?.averageScore.toFixed(1)}</div>
                        </div>
                    </div>

                    {/* Recent Games Table */}
                    <h2 style={{ marginBottom: '20px' }}>Recent Games</h2>
                    <div style={{ overflowX: 'auto', background: 'var(--color-bg-secondary)', borderRadius: '10px', padding: '20px' }}>
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
                                    // Handle Firestore Timestamp or standard Date
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
                </>
            )}

            <GameDetailsModal game={selectedGame} onClose={() => setSelectedGame(null)} />
        </div>
    );
};
