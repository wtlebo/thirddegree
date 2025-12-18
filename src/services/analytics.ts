import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAD_T87CRozBlBSXdOCUu65-a980oDRe3o",
    authDomain: "hang-5.firebaseapp.com",
    projectId: "hang-5",
    storageBucket: "hang-5.firebasestorage.app",
    messagingSenderId: "608586897416",
    appId: "1:608586897416:web:027ba00d9aad18b90c19bd",
    measurementId: "G-03QPPBJYEV"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Ensure user is signed in anonymously
export const ensureAuth = async () => {
    if (!auth.currentUser) {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Error signing in anonymously:", error);
        }
    }
    return auth.currentUser;
};

export interface GuessLog {
    puzzleIndex: number;
    letter: string;
    isCorrect: boolean;
    timestamp: number;
}

export interface GameLog {
    date: string;
    status: 'won' | 'lost';
    strikes: number;
    score: number;
    guesses: GuessLog[];
    timestamp?: any; // Firestore timestamp
    userId?: string;
}

export const logGameResult = async (gameLog: GameLog) => {
    try {
        const user = await ensureAuth();
        if (!user) return;

        await addDoc(collection(db, "game_logs_hang10"), {
            ...gameLog,
            userId: user.uid,
            timestamp: serverTimestamp(), // Server-side timestamp for ordering
            clientTimestamp: Date.now()
        });
    } catch (error) {
        console.error("Error logging game result:", error);
    }
};

import { query, where } from "firebase/firestore";

export const getDailyAverageScore = async (date: string): Promise<number | null> => {
    try {
        // REBRAND DATE: 2025-12-15
        const isLegacy = date < '2025-12-15';
        const collectionName = isLegacy ? "game_logs" : "game_logs_hang10";

        const coll = collection(db, collectionName);
        const q = query(coll, where("date", "==", date));
        // Use getDocs instead of aggregate to avoid index requirement
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        let totalScore = 0;
        let count = 0;

        snapshot.forEach(doc => {
            const d = doc.data();
            totalScore += d.score;
            count++;
        });

        const rawAvg = count > 0 ? totalScore / count : null;

        if (rawAvg === null) return null;

        // Normalize old scores (out of 5) by multiplying by 2
        return isLegacy ? rawAvg * 2 : rawAvg;

    } catch (error) {
        console.error("Error fetching daily average:", error);
        return null;
    }
};

import { getDocs, limit, orderBy } from "firebase/firestore";

export const getAdminStats = async (date: string) => {
    try {
        const coll = collection(db, "game_logs_hang10");
        const q = query(coll, where("date", "==", date));

        // Use getDocs to avoid index errors for now
        const snapshot = await getDocs(q);

        let totalGames = 0;
        let totalWins = 0;
        let totalScore = 0;

        snapshot.forEach(doc => {
            const d = doc.data();
            totalGames++;
            if (d.status === 'won') {
                totalWins++;
            }
            totalScore += d.score;
        });

        const averageScore = totalGames > 0 ? totalScore / totalGames : 0;

        return {
            totalGames,
            winRate: totalGames ? (totalWins / totalGames) * 100 : 0,
            averageScore
        };
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw error;
    }
};

export const getRecentGames = async (limitCount: number = 20, date?: string) => {
    try {
        const coll = collection(db, "game_logs_hang10");
        let q;

        if (date) {
            // If date is provided, filter by date and order by timestamp
            q = query(coll, where("date", "==", date), orderBy("timestamp", "desc"), limit(limitCount));
        } else {
            // Otherwise just get the most recent ones
            q = query(coll, orderBy("timestamp", "desc"), limit(limitCount));
        }

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => doc.data() as GameLog);
    } catch (error) {
        console.error("Error fetching recent games:", error);
        throw error;
    }
};

export const submitPuzzleRating = async (date: string, rating: number) => {
    try {
        const user = await ensureAuth();
        // Allow anonymous ratings? Yes, for now.

        await addDoc(collection(db, "puzzle_ratings"), {
            date,
            rating,
            userId: user?.uid || 'anonymous',
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error submitting rating:", error);
    }
};

export const getDailyAverageRating = async (date: string): Promise<number | null> => {
    try {
        const coll = collection(db, "puzzle_ratings");
        const q = query(coll, where("date", "==", date));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        let totalRating = 0;
        let count = 0;

        snapshot.forEach(doc => {
            const d = doc.data();
            totalRating += d.rating;
            count++;
        });

        return count > 0 ? totalRating / count : null;
    } catch (error) {
        console.error("Error fetching daily average rating:", error);
        return null;
    }
};

export const getMonthlyStats = async (year: number, month: number): Promise<Map<string, { rating: number | null, score: number | null, plays: number }>> => {
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const statsMap = new Map<string, { rating: number | null, score: number | null, plays: number }>();

    try {
        // Internal helper for aggregation
        const sums = new Map<string, { rSum: number, rCount: number, sSum: number, sCount: number, plays: number }>();
        const getSumEntry = (date: string) => {
            if (!sums.has(date)) sums.set(date, { rSum: 0, rCount: 0, sSum: 0, sCount: 0, plays: 0 });
            return sums.get(date)!;
        };

        // 1. Fetch Ratings
        const ratingQ = query(
            collection(db, "puzzle_ratings"),
            where('date', '>=', startStr),
            where('date', '<', endStr)
        );
        const ratingSnap = await getDocs(ratingQ);
        ratingSnap.forEach(doc => {
            const d = doc.data();
            const curr = getSumEntry(d.date);
            curr.rSum += d.rating;
            curr.rCount++;
        });

        // 2. Fetch NEW Scores (Hang 10)
        const newScoreQ = query(
            collection(db, "game_logs_hang10"),
            where('date', '>=', startStr),
            where('date', '<', endStr)
        );
        const newScoreSnap = await getDocs(newScoreQ);
        newScoreSnap.forEach(doc => {
            const d = doc.data();
            const curr = getSumEntry(d.date);
            curr.sSum += d.score;
            curr.sCount++;
            curr.plays++;
        });

        // 3. Fetch LEGACY Scores (Hang 5, score out of 5)
        // Only fetch if the month includes dates before 2025-12-15
        if (startStr < '2025-12-15') {
            const legacyQ = query(
                collection(db, "game_logs"),
                where('date', '>=', startStr),
                where('date', '<', endStr)
            );
            const legacySnap = await getDocs(legacyQ);
            legacySnap.forEach(doc => {
                const d = doc.data();
                // legacy cutoff check just in case of overlap
                if (d.date < '2025-12-15') {
                    const curr = getSumEntry(d.date);
                    curr.sSum += (d.score * 2); // Normalize to 10
                    curr.sCount++;
                    curr.plays++;
                }
            });
        }

        // 4. Compute Final Stats
        for (const [date, data] of sums.entries()) {
            statsMap.set(date, {
                rating: data.rCount > 0 ? parseFloat((data.rSum / data.rCount).toFixed(1)) : null,
                score: data.sCount > 0 ? parseFloat((data.sSum / data.sCount).toFixed(1)) : null,
                plays: data.plays
            });
        }

    } catch (error) {
        console.error("Error fetching monthly stats:", error);
    }
    return statsMap;
};

// Helper to getting trend data for graphs
export interface TrendDataPoint {
    date: string;
    plays: number;
    wins: number;
    avgScore: number;
    avgRating: number | null;
}

export const getTrendData = async (days: number = 30): Promise<TrendDataPoint[]> => {
    try {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - days);
        const startStr = start.toISOString().split('T')[0];

        // Container for aggregation
        // Map<date, { plays, wins, scoreSum, ratingSum, ratingCount }>
        const agg = new Map<string, { plays: number, wins: number, scoreSum: number, ratingSum: number, ratingCount: number }>();

        const getAgg = (date: string) => {
            if (!agg.has(date)) agg.set(date, { plays: 0, wins: 0, scoreSum: 0, ratingSum: 0, ratingCount: 0 });
            return agg.get(date)!;
        };

        // 1. Fetch Game Logs (New)
        const newQ = query(collection(db, "game_logs_hang10"), where('date', '>=', startStr));
        const newSnap = await getDocs(newQ);
        newSnap.forEach(doc => {
            const d = doc.data();
            const entry = getAgg(d.date);
            entry.plays++;
            entry.scoreSum += d.score;
            if (d.status === 'won') entry.wins++;
        });

        // 2. Fetch Game Logs (Legacy) if needed
        if (startStr < '2025-12-15') {
            const legQ = query(collection(db, "game_logs"), where('date', '>=', startStr));
            const legSnap = await getDocs(legQ);
            legSnap.forEach(doc => {
                const d = doc.data();
                if (d.date < '2025-12-15') {
                    const entry = getAgg(d.date);
                    entry.plays++;
                    entry.scoreSum += (d.score * 2); // Normalize
                    // Legacy didn't consistently have status='won' in same format, assume score > 0 is something? 
                    // actually legacy has status 'won' or 'lost' too.
                    if (d.status === 'won') entry.wins++;
                }
            });
        }

        // 3. Fetch Ratings
        const rateQ = query(collection(db, "puzzle_ratings"), where('date', '>=', startStr));
        const rateSnap = await getDocs(rateQ);
        rateSnap.forEach(doc => {
            const d = doc.data();
            const entry = getAgg(d.date);
            entry.ratingSum += d.rating;
            entry.ratingCount++;
        });

        // 4. Format for Recharts
        // We want a sorted array of all dates in range, even if empty? 
        // Or just the ones we have? Let's do a continuous range filling.
        const result: TrendDataPoint[] = [];
        for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const data = agg.get(dateStr);
            if (data) {
                result.push({
                    date: dateStr,
                    plays: data.plays,
                    wins: data.plays > 0 ? data.wins : 0, // Raw count of wins
                    // We can also calculate winRate in UI or here. Let's return counts.
                    avgScore: data.plays > 0 ? parseFloat((data.scoreSum / data.plays).toFixed(2)) : 0,
                    avgRating: data.ratingCount > 0 ? parseFloat((data.ratingSum / data.ratingCount).toFixed(2)) : null
                });
            } else {
                // Push zero entry for continuity or skip? Recharts handles gaps okay, but zeros are better for "0 plays".
                result.push({ date: dateStr, plays: 0, wins: 0, avgScore: 0, avgRating: null });
            }
        }

        return result;

    } catch (e) {
        console.error("Error fetching trend data", e);
        return [];
    }
};
