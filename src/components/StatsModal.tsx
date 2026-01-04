import React, { useEffect, useState } from 'react';
import type { UserStats } from '../types';
import { getDailyAverageScore, submitPuzzleRating } from '../services/analytics';

interface StatsModalProps {
    stats: UserStats;
    onClose: () => void;
    isOpen: boolean;
    latestGameSummary?: {
        status: 'won' | 'lost';
        strikes: number;
    } | null;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose, isOpen, latestGameSummary }) => {
    const [globalAverage, setGlobalAverage] = useState<string>("-");

    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            getDailyAverageScore(today).then(avg => {
                if (avg !== null) {
                    setGlobalAverage(avg.toFixed(2));
                }
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const winPercentage = stats.gamesPlayed > 0
        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
        : 0;

    const totalScore =
        (stats.winDistribution.perfect * 10) +
        (stats.winDistribution.oneStrike * 8) +
        (stats.winDistribution.twoStrikes * 6) +
        (stats.winDistribution.threeStrikes * 4) +
        (stats.winDistribution.fourStrikes * 2);

    const averageScore = stats.gamesPlayed > 0
        ? (totalScore / stats.gamesPlayed).toFixed(2)
        : "0.00";

    const getWidth = (count: number) => {
        const max = Math.max(
            ...Object.values(stats.winDistribution),
            1 // Avoid division by zero
        );
        return `${Math.max((count / max) * 100, 5)}%`; // Min 5% width for visibility
    };

    const getDailyMessage = (status: 'won' | 'lost', strikes: number) => {
        if (status === 'lost') return "WIPE OUT";
        if (strikes === 0) return "HANG 10";
        if (strikes === 1) return "TUBULAR";
        if (strikes === 2) return "RADICAL";
        if (strikes === 3) return "GNARLY";
        return "CLOSE CALL";
    };

    const getBarColor = (isCurrent: boolean) => {
        if (isCurrent) return 'var(--color-secondary)'; // Yellow for today's result
        return 'var(--color-primary)'; // Aqua for others
    };

    const isToday = (strikes: number | 'failed') => {
        if (!latestGameSummary) return false;
        if (strikes === 'failed') return latestGameSummary.status === 'lost';
        return latestGameSummary.status === 'won' && latestGameSummary.strikes === strikes;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content stats-modal" onClick={e => e.stopPropagation()} style={{ position: 'relative', paddingTop: '40px' }}>
                <button
                    className="modal-close-icon"
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        right: '15px',
                        top: '15px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                        padding: '5px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="stats-content">
                    {/* SECTION A: Today's Result & Header */}
                    <div className="daily-summary" style={{ marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '20px', textAlign: 'center' }}>

                        {/* Date & Global Avg Row */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center', marginBottom: '10px', fontSize: '0.9rem', color: '#888' }}>
                            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <span>•</span>
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <span>Global Avg:</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{globalAverage}</span>
                            </div>
                        </div>

                        {latestGameSummary ? (
                            <>
                                <h1 style={{
                                    fontSize: '3rem',
                                    color: 'var(--color-secondary)',
                                    margin: '0 0 10px 0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '3px',
                                    textShadow: '2px 2px 0px rgba(0,0,0,0.3)'
                                }}>
                                    {getDailyMessage(latestGameSummary.status, latestGameSummary.strikes)}
                                </h1>
                                <p style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>
                                    {latestGameSummary.status === 'won'
                                        ? (
                                            <>
                                                {latestGameSummary.strikes === 0 && "Great Job! Zero strikes = 10 points!"}
                                                {latestGameSummary.strikes === 1 && "Nice! One strike = 8 points!"}
                                                {latestGameSummary.strikes === 2 && "Solid! Two strikes = 6 points."}
                                                {latestGameSummary.strikes === 3 && "Phew! Three strikes = 4 points."}
                                                {latestGameSummary.strikes === 4 && "Close one! Four strikes = 2 points."}
                                            </>
                                        )
                                        : "Better luck next time!"}
                                </p>
                            </>
                        ) : (
                            <h2 style={{ color: 'var(--color-text)', opacity: 0.7, margin: '10px 0' }}>Stats & History</h2>
                        )}
                    </div>

                    {/* SECTION B: Lifetime Stats */}
                    <h3 style={{ textAlign: 'center', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', color: '#666' }}>Lifetime Stats</h3>
                    <div className="stats-grid" style={{ marginBottom: '30px' }}>
                        <div className="stat-item">
                            <div className="stat-value">{stats.gamesPlayed}</div>
                            <div className="stat-label">Played</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{winPercentage}</div>
                            <div className="stat-label">Win %</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{stats.currentStreak}</div>
                            <div className="stat-label">Current Streak</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{stats.maxStreak}</div>
                            <div className="stat-label">Max Streak</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{averageScore}</div>
                            <div className="stat-label">Avg Score</div>
                        </div>
                    </div>

                    {/* SECTION C: Guess Distribution */}
                    <h3 style={{ textAlign: 'center', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', color: '#666' }}>Point Distribution</h3>
                    <div className="distribution-chart">
                        <div className="dist-row">
                            <span className="dist-label">Hang 10</span>
                            <div className="dist-bar-container">
                                <div className="dist-bar" style={{
                                    width: getWidth(stats.winDistribution.perfect),
                                    background: getBarColor(isToday(0))
                                }}>
                                    {stats.winDistribution.perfect}
                                </div>
                            </div>
                        </div>
                        <div className="dist-row">
                            <span className="dist-label">Tubular (8)</span>
                            <div className="dist-bar-container">
                                <div className="dist-bar" style={{
                                    width: getWidth(stats.winDistribution.oneStrike),
                                    background: getBarColor(isToday(1))
                                }}>
                                    {stats.winDistribution.oneStrike}
                                </div>
                            </div>
                        </div>
                        <div className="dist-row">
                            <span className="dist-label">Radical (6)</span>
                            <div className="dist-bar-container">
                                <div className="dist-bar" style={{
                                    width: getWidth(stats.winDistribution.twoStrikes),
                                    background: getBarColor(isToday(2))
                                }}>
                                    {stats.winDistribution.twoStrikes}
                                </div>
                            </div>
                        </div>
                        <div className="dist-row">
                            <span className="dist-label">Gnarly (4)</span>
                            <div className="dist-bar-container">
                                <div className="dist-bar" style={{
                                    width: getWidth(stats.winDistribution.threeStrikes),
                                    background: getBarColor(isToday(3))
                                }}>
                                    {stats.winDistribution.threeStrikes}
                                </div>
                            </div>
                        </div>
                        <div className="dist-row">
                            <span className="dist-label">Close Call (2)</span>
                            <div className="dist-bar-container">
                                <div className="dist-bar" style={{
                                    width: getWidth(stats.winDistribution.fourStrikes),
                                    background: getBarColor(isToday(4))
                                }}>
                                    {stats.winDistribution.fourStrikes}
                                </div>
                            </div>
                        </div>
                        <div className="dist-row">
                            <span className="dist-label">Wipe Out (0)</span>
                            <div className="dist-bar-container">
                                <div className="dist-bar" style={{
                                    width: getWidth(stats.winDistribution.failed),
                                    background: getBarColor(isToday('failed'))
                                }}>
                                    {stats.winDistribution.failed}
                                </div>
                            </div>
                        </div>
                    </div>

                    {latestGameSummary && (
                        <div className="rating-area" style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                            <RatingComponent />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const RatingComponent = () => {
    const [submitted, setSubmitted] = useState(false);

    const handleRate = async (value: number) => {
        setSubmitted(true);
        // Fire and forget
        const today = new Date().toISOString().split('T')[0];
        try {
            await submitPuzzleRating(today, value);
        } catch (e) {
            console.error(e);
        }
    };

    if (submitted) {
        return (
            <div style={{ color: 'var(--color-primary)', animation: 'fadeIn 0.5s', fontWeight: 'bold' }}>
                Thanks for your feedback!
            </div>
        );
    }

    return (
        <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px', opacity: 0.9 }}>Rate Today's Puzzle</h3>
            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <button
                        key={num}
                        onClick={() => handleRate(num)}
                        style={{
                            width: '35px',
                            height: '35px',
                            borderRadius: '50%',
                            border: '1px solid var(--color-border)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--color-primary)';
                            e.currentTarget.style.color = 'black';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
};
