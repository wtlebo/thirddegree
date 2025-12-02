import React, { useEffect, useState } from 'react';
import type { UserStats } from '../types';
import { getDailyAverageScore } from '../services/analytics';

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
        (stats.winDistribution.perfect * 5) +
        (stats.winDistribution.oneStrike * 4) +
        (stats.winDistribution.twoStrikes * 3) +
        (stats.winDistribution.threeStrikes * 2) +
        (stats.winDistribution.fourStrikes * 1);

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
        if (strikes === 0) return "HANG 5";
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
                <button className="close-btn" onClick={onClose} style={{ position: 'absolute', right: '15px', top: '10px' }}>&times;</button>

                {latestGameSummary && (
                    <div className="daily-summary" style={{ marginBottom: '30px', borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
                        <h1 style={{
                            fontSize: '3rem',
                            color: 'var(--color-secondary)', // Pop with Yellow
                            margin: '0 0 10px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '3px',
                            textShadow: '2px 2px 0px rgba(0,0,0,0.3)'
                        }}>
                            {getDailyMessage(latestGameSummary.status, latestGameSummary.strikes)}
                        </h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>
                            {latestGameSummary.status === 'won'
                                ? `You completed today's puzzles with ${latestGameSummary.strikes} strike${latestGameSummary.strikes === 1 ? '' : 's'}.`
                                : "Better luck next time!"}
                        </p>
                    </div>
                )}

                <div className="stats-header" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                    <h2>Statistics</h2>
                </div>

                <div className="stats-grid">
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
                    <div className="stat-item">
                        <div className="stat-value">{globalAverage}</div>
                        <div className="stat-label">Global Avg</div>
                    </div>
                </div>

                <h3>Guess Distribution</h3>
                <div className="distribution-chart">
                    <div className="dist-row">
                        <span className="dist-label">Hang 5</span>
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
                        <span className="dist-label">Tubular</span>
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
                        <span className="dist-label">Radical</span>
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
                        <span className="dist-label">Gnarly</span>
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
                        <span className="dist-label">Close Call</span>
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
                        <span className="dist-label">Wipe Out</span>
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
            </div>
        </div>
    );
};
