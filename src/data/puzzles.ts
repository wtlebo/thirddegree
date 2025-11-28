import type { DailySet, Puzzle } from '../types';



// Helper to create a puzzle with a deterministic reveal order
const createPuzzle = (clue: string, answer: string): Puzzle => {
    const uniqueLetters = Array.from(new Set(answer.replace(/[^A-Z]/g, '').split('')));
    // Simple deterministic shuffle based on char codes for consistency in this static file
    // In a real app, this would be pre-generated and stored in a DB
    const revealOrder = uniqueLetters.sort((a, b) => {
        return (a.charCodeAt(0) * 13 + 7) % 100 - (b.charCodeAt(0) * 13 + 7) % 100;
    });

    return { clue, answer, revealOrder };
};

const PUZZLE_DATABASE: Record<string, [Puzzle, Puzzle, Puzzle]> = {
    // Day 1 (Today)
    "2023-11-28": [
        createPuzzle("A famous post-impressionist painting", "THE STARRY NIGHT"),
        createPuzzle("A common first program", "HELLO WORLD"),
        createPuzzle("Best Picture winner of 2023", "EVERYTHING EVERYWHERE ALL AT ONCE")
    ],
    // Day 2
    "2023-11-29": [
        createPuzzle("Capital of France", "PARIS"),
        createPuzzle("The Red Planet", "MARS"),
        createPuzzle("A famous playwright", "WILLIAM SHAKESPEARE")
    ],
    // Day 3
    "2023-11-30": [
        createPuzzle("Opposite of Hot", "COLD"),
        createPuzzle("King of the Jungle", "LION"),
        createPuzzle("The Great Gatsby author", "F SCOTT FITZGERALD")
    ],
    // Day 4
    "2023-12-01": [
        createPuzzle("H2O", "WATER"),
        createPuzzle("Largest Ocean", "PACIFIC OCEAN"),
        createPuzzle("First Man on the Moon", "NEIL ARMSTRONG")
    ],
    // Day 5
    "2023-12-02": [
        createPuzzle("Man's Best Friend", "DOG"),
        createPuzzle("Fastest Land Animal", "CHEETAH"),
        createPuzzle("Theory of Relativity", "ALBERT EINSTEIN")
    ],
    // Day 6
    "2023-12-03": [
        createPuzzle("Color of the sky", "BLUE"),
        createPuzzle("A fruit that keeps the doctor away", "APPLE"),
        createPuzzle("Painter of the Mona Lisa", "LEONARDO DA VINCI")
    ],
    // Day 7
    "2023-12-04": [
        createPuzzle("A shape with 3 sides", "TRIANGLE"),
        createPuzzle("The Big Apple", "NEW YORK CITY"),
        createPuzzle("Author of Harry Potter", "JK ROWLING")
    ]
};

const FALLBACK_PUZZLES: [Puzzle, Puzzle, Puzzle] = [
    createPuzzle("A famous post-impressionist painting", "THE STARRY NIGHT"),
    createPuzzle("A common first program", "HELLO WORLD"),
    createPuzzle("Best Picture winner of 2023", "EVERYTHING EVERYWHERE ALL AT ONCE")
];

export const getDailyPuzzle = (): DailySet => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // For testing purposes, if the date isn't in our DB, cycle through the available ones
    // based on the day of the month to simulate daily changes
    let puzzles = PUZZLE_DATABASE[dateString];

    if (!puzzles) {
        // Fallback logic for testing beyond the hardcoded dates
        const keys = Object.keys(PUZZLE_DATABASE);
        const index = today.getDate() % keys.length;
        puzzles = PUZZLE_DATABASE[keys[index]];
    }

    return {
        date: dateString,
        puzzles: puzzles || FALLBACK_PUZZLES
    };
};
