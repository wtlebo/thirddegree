import type { DailySet, Puzzle } from '../types';
import { getPuzzleByDate } from '../services/puzzles';

// Helper to create a puzzle with a deterministic reveal order (fallback)
const createPuzzle = (clue: string, answer: string): Puzzle => {
    const uniqueLetters = Array.from(new Set(answer.replace(/[^A-Z]/g, '').split('')));
    const revealOrder = uniqueLetters.sort((a, b) => {
        return (a.charCodeAt(0) * 13 + 7) % 100 - (b.charCodeAt(0) * 13 + 7) % 100;
    }).slice(0, 2);

    return { clue, answer, revealOrder };
};

const PUZZLE_DATABASE: Record<string, [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle]> = {
    // ... data kept for fallback ...
    // Day 1 (Today)
    "2025-11-28": [
        createPuzzle("A famous post-impressionist painting", "THE STARRY NIGHT"),
        createPuzzle("A common first program", "HELLO WORLD"),
        createPuzzle("Best Picture winner of 2023", "EVERYTHING EVERYWHERE ALL AT ONCE"),
        createPuzzle("First man on the moon", "NEIL ARMSTRONG"),
        createPuzzle("The king of rock and roll", "ELVIS PRESLEY")
    ],
    // ... can truncate for brevity if desired, but good to keep for demo ...
};

const FALLBACK_PUZZLES: [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle] = [
    createPuzzle("A famous post-impressionist painting", "THE STARRY NIGHT"),
    createPuzzle("A common first program", "HELLO WORLD"),
    createPuzzle("Best Picture winner of 2023", "EVERYTHING EVERYWHERE ALL AT ONCE"),
    createPuzzle("First man on the moon", "NEIL ARMSTRONG"),
    createPuzzle("The king of rock and roll", "ELVIS PRESLEY")
];

export const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Deprecated synchronous getter - returns fallback/local data only
export const getDailyPuzzle = (): DailySet => {
    const dateString = getTodayDateString();

    // Check local database for fallback
    const puzzles = PUZZLE_DATABASE[dateString] || FALLBACK_PUZZLES;

    return {
        date: dateString,
        puzzles
    };
};

// New Cache Key
const CACHE_KEY = 'hang10_daily_puzzle_cache';

// New Async getter with Caching & Timeout
export const fetchDailyPuzzle = async (dateOverride?: string): Promise<DailySet> => {
    const dateString = dateOverride || getTodayDateString();

    // 1. Check Local Cache first (Only if no override, to ensure latest for today)
    if (!dateOverride) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached) as DailySet;
                if (parsed.date === dateString) {
                    console.log("Loaded puzzle from local cache");
                    return parsed;
                }
            }
        } catch (e) {
            console.warn("Retreiving cache failed:", e);
        }
    }

    // 2. Try to fetch from Firestore with Timeout
    try {
        // Create a timeout promise
        const timeout = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Firestore fetch timed out")), 5000) // 5s timeout
        );

        // Race Firestore against timeout
        const remotePuzzle = await Promise.race([
            getPuzzleByDate(dateString),
            timeout
        ]) as DailySet | null;

        if (remotePuzzle) {
            console.log("Fetched puzzle from Firestore for", dateString);

            // Save to Cache (Only if no override)
            if (!dateOverride) {
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(remotePuzzle));
                } catch (e) {
                    console.warn("Failed to update cache:", e);
                }
            }

            return remotePuzzle;
        }
    } catch (e) {
        console.warn("Failed to fetch from Firestore (or timed out), falling back to local.", e);
    }

    // 3. Fallback to local hardcoded data (Only if today)
    // If asking for a specific date and it fails, we probably shouldn't return today's fallback?
    // But for now, keeping behavior safe.
    return getDailyPuzzle();
};
