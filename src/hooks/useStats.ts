import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserStats } from '../types';
import { db, logGameResult, type GuessLog } from '../services/analytics';
import { useUsers } from '../contexts/UsersContext';

const STATS_KEY = 'hang10_stats';

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

export const useStats = (enabled: boolean = true) => {
    const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
    const { firebaseUser, currentUser } = useUsers();

    // Load from local storage initially
    useEffect(() => {
        if (!enabled) return;
        const storedStats = localStorage.getItem(STATS_KEY);
        if (storedStats) {
            try {
                const parsed = JSON.parse(storedStats);
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
    }, [enabled]);

    // Sync with Cloud when User is fully loaded (currentUser present)
    useEffect(() => {
        if (!enabled || !firebaseUser || !currentUser) return;

        const syncStats = async () => {
            const userStatsRef = doc(db, 'users', firebaseUser.uid, 'data', 'stats');

            try {
                console.log(`[StatsSync] Attempting sync for User: ${firebaseUser.uid} | Profile: ${currentUser?.handle} (${currentUser?.role})`);
                const docSnap = await getDoc(userStatsRef);

                if (docSnap.exists()) {
                    console.log("[StatsSync] Found cloud stats. Downloading.");
                    const cloudStats = docSnap.data() as UserStats;
                    setStats(cloudStats);
                    localStorage.setItem(STATS_KEY, JSON.stringify(cloudStats));
                } else {
                    console.log("[StatsSync] No cloud stats. Uploading local.");
                    // Cloud is empty -> Upload Local stats (Migration from Anonymous)
                    const localString = localStorage.getItem(STATS_KEY);
                    let statsToUpload = INITIAL_STATS;

                    if (localString) {
                        const parsed = JSON.parse(localString);
                        statsToUpload = {
                            ...INITIAL_STATS,
                            ...parsed,
                            winDistribution: {
                                ...INITIAL_STATS.winDistribution,
                                ...parsed.winDistribution
                            }
                        };
                    }

                    await setDoc(userStatsRef, statsToUpload);
                    console.log("[StatsSync] Upload complete.");
                }
            } catch (e: any) {
                console.error("Error syncing stats:", e);
                console.error("Debug Info:", {
                    uid: firebaseUser.uid,
                    anon: firebaseUser.isAnonymous,
                    profileId: currentUser?.uid,
                    role: currentUser?.role
                });
            }
        };

        syncStats();
    }, [firebaseUser, currentUser, enabled]);

    const saveStats = async (newStats: UserStats) => {
        setStats(newStats);
        localStorage.setItem(STATS_KEY, JSON.stringify(newStats));

        // If logged in AND has profile (permissions), push to Cloud
        if (firebaseUser && currentUser) {
            try {
                const userStatsRef = doc(db, 'users', firebaseUser.uid, 'data', 'stats');
                await setDoc(userStatsRef, newStats);
            } catch (e) {
                console.error("Failed to save stats to cloud:", e);
            }
        }
    };

    const recordGame = async (won: boolean, totalStrikes: number, guesses: GuessLog[], date: string) => {
        // Prevent recording the same day twice (though UI should prevent this too)
        if (stats.lastPlayedDate === date) return;

        const newStats = { ...stats };
        newStats.gamesPlayed += 1;
        newStats.lastPlayedDate = date;

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

        // Log to Firebase Global Logs
        // Scoring...
        const score = won ? 2 * (5 - totalStrikes) : 0;

        await logGameResult({
            date: date,
            status: won ? 'won' : 'lost',
            strikes: totalStrikes,
            score: score,
            guesses
        });
    };

    return { stats, recordGame };
};
