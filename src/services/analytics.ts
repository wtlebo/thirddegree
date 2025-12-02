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
const auth = getAuth(app);

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
