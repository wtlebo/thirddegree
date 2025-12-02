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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
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

        await addDoc(collection(db, "game_logs"), {
            ...gameLog,
            userId: user.uid,
            timestamp: serverTimestamp(), // Server-side timestamp for ordering
            clientTimestamp: Date.now()
        });
    } catch (error) {
        console.error("Error logging game result:", error);
    }
};

import { getAggregateFromServer, average, count, query, where } from "firebase/firestore";

export const getDailyAverageScore = async (date: string): Promise<number | null> => {
    try {
        const coll = collection(db, "game_logs");
        const q = query(coll, where("date", "==", date));
        const snapshot = await getAggregateFromServer(q, {
            averageScore: average("score")
        });

        return snapshot.data().averageScore;
    } catch (error) {
        console.error("Error fetching daily average:", error);
        return null;
    }
};

import { getDocs, limit, orderBy } from "firebase/firestore";

export const getAdminStats = async (date: string) => {
    try {
        const coll = collection(db, "game_logs");
        const q = query(coll, where("date", "==", date));
        const snapshot = await getAggregateFromServer(q, {
            totalGames: count(),
            averageScore: average("score")
        });

        // Calculate win rate manually for now (or add another aggregation)
        // For simplicity, let's fetch a small batch to estimate or just use total games for now
        // To get win rate properly with aggregation, we'd need to filter by status='won' and count, then divide.
        // Let's do a second aggregation for wins.

        const qWins = query(coll, where("date", "==", date), where("status", "==", "won"));
        const snapshotWins = await getAggregateFromServer(qWins, {
            totalWins: count()
        });

        const totalGames = snapshot.data().totalGames;
        const totalWins = snapshotWins.data().totalWins;
        const averageScore = snapshot.data().averageScore;

        return {
            totalGames: totalGames || 0,
            winRate: totalGames ? (totalWins / totalGames) * 100 : 0,
            averageScore: averageScore || 0
        };
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return { totalGames: 0, winRate: 0, averageScore: 0 };
    }
};

export const getRecentGames = async (limitCount: number = 20, date?: string) => {
    try {
        const coll = collection(db, "game_logs");
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
        return [];
    }
};
