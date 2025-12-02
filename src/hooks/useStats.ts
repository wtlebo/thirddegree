import { useState, useEffect } from 'react';
import type { UserStats } from '../types';

const STATS_KEY = 'thirddegree_stats';

const INITIAL_STATS: UserStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    winDistribution: {
        perfect: 0,
        oneStrike: 0,
        twoStrikes: 0,
        threeStrikes: 0,
        fourStrikes: 0,
        failed: 0,
    },
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: null,
};

export const useStats = () => {
    const [stats, setStats] = useState<UserStats>(INITIAL_STATS);

    useEffect(() => {
        const storedStats = localStorage.getItem(STATS_KEY);
        if (storedStats) {
            try {
                const parsed = JSON.parse(storedStats);
                // Migration: Ensure all distribution keys exist
                const merged = {
                    ...INITIAL_STATS,
                    ...parsed,
                    winDistribution: {
                        ...INITIAL_STATS.winDistribution,
                        ...parsed.winDistribution
                    }
                };
                setStats(merged);
            } catch (e) {
                console.error('Failed to parse stats:', e);
            }
        }
    }, []);

    const saveStats = (newStats: UserStats) => {
        setStats(newStats);
        localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    };

    const recordGame = (won: boolean, totalStrikes: number) => {
        const today = new Date().toISOString().split('T')[0];

        // Prevent recording the same day twice (though UI should prevent this too)
        if (stats.lastPlayedDate === today) return;

        const newStats = { ...stats };
        newStats.gamesPlayed += 1;
        newStats.lastPlayedDate = today;

        if (won) {
            newStats.gamesWon += 1;
            newStats.currentStreak += 1;
            if (newStats.currentStreak > newStats.maxStreak) {
                newStats.maxStreak = newStats.currentStreak;
            }

            if (totalStrikes === 0) newStats.winDistribution.perfect += 1;
            else if (totalStrikes === 1) newStats.winDistribution.oneStrike += 1;
            else if (totalStrikes === 2) newStats.winDistribution.twoStrikes += 1;
            else if (totalStrikes === 3) newStats.winDistribution.threeStrikes += 1;
            else if (totalStrikes === 4) newStats.winDistribution.fourStrikes += 1;
        } else {
            newStats.currentStreak = 0;
            newStats.winDistribution.failed += 1;
        }

        saveStats(newStats);
    };

    return { stats, recordGame };
};
