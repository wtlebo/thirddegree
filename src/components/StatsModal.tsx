import React from 'react';
import type { UserStats } from '../types';

interface StatsModalProps {
    stats: UserStats;
    onClose: () => void;
    isOpen: boolean;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose, isOpen }) => {
    if (!isOpen) return null;

    const winPercentage = stats.gamesPlayed > 0
        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
        : 0;

    const maxVal = Math.max(
        stats.winDistribution.perfect,
        stats.winDistribution.oneStrike,
        stats.winDistribution.twoStrikes,
        stats.winDistribution.failed
    );

    // Helper to calculate bar width percentage
    const getWidth = (val: number) => {
        if (maxVal === 0) return '5%';
        return `${Math.max(5, (val / maxVal) * 100)}%`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content stats-modal" onClick={e => e.stopPropagation()}>
                <div className="stats-header">
                    <h2>Statistics</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
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
                </div>

                <h3>Guess Distribution</h3>
                <div className="distribution-chart">
                    <div className="dist-row">
                        <span className="dist-label">Perfect</span>
                        <div className="dist-bar-container">
                            <div className="dist-bar" style={{ width: getWidth(stats.winDistribution.perfect) }}>
                                {stats.winDistribution.perfect}
                            </div>
                        </div>
                    </div>
                    <div className="dist-row">
                        <span className="dist-label">1 Strike</span>
                        <div className="dist-bar-container">
                            <div className="dist-bar" style={{ width: getWidth(stats.winDistribution.oneStrike) }}>
                                {stats.winDistribution.oneStrike}
                            </div>
                        </div>
                    </div>
                    <div className="dist-row">
                        <span className="dist-label">2 Strikes</span>
                        <div className="dist-bar-container">
                            <div className="dist-bar" style={{ width: getWidth(stats.winDistribution.twoStrikes) }}>
                                {stats.winDistribution.twoStrikes}
                            </div>
                        </div>
                    </div>
                    <div className="dist-row">
                        <span className="dist-label">Failed</span>
                        <div className="dist-bar-container">
                            <div className="dist-bar failed" style={{ width: getWidth(stats.winDistribution.failed) }}>
                                {stats.winDistribution.failed}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
