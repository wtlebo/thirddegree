import type { DailySet, Puzzle } from '../types';
import { getPuzzleByDate } from '../services/puzzles';

// Helper to create a puzzle with a deterministic reveal order (fallback)
const createPuzzle = (clue: string, answer: string): Puzzle => {
    const uniqueLetters = Array.from(new Set(answer.replace(/[^A-Z]/g, '').split('')));
    const revealOrder = uniqueLetters.sort((a, b) => {
        return (a.charCodeAt(0) * 13 + 7) % 100 - (b.charCodeAt(0) * 13 + 7) % 100;
    });

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

// New Async getter
export const fetchDailyPuzzle = async (): Promise<DailySet> => {
    const dateString = getTodayDateString();

    // 1. Try to fetch from Firestore
    try {
        const remotePuzzle = await getPuzzleByDate(dateString);
        if (remotePuzzle) {
            console.log("Fetched puzzle from Firestore for", dateString);
            return remotePuzzle;
        }
    } catch (e) {
        console.warn("Failed to fetch from Firestore, falling back to local.", e);
    }

    // 2. Fallback to local
    return getDailyPuzzle();
};
