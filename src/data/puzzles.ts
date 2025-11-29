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
    "2025-11-28": [
        createPuzzle("A famous post-impressionist painting", "THE STARRY NIGHT"),
        createPuzzle("A common first program", "HELLO WORLD"),
        createPuzzle("Best Picture winner of 2023", "EVERYTHING EVERYWHERE ALL AT ONCE")
    ],
    // Day 2
    "2025-11-29": [
        createPuzzle("The Wizard of Menlo Park", "THOMAS EDISON"),
        createPuzzle("A record breaking invention", "PHONOGRAPH"),
        createPuzzle("Edison's first track", "MARY HAD A LITTLE LAMB")
    ],
    // Day 3
    "2025-11-30": [
        createPuzzle("The band behind the wall", "PINK FLOYD"),
        createPuzzle("We don't need no...", "EDUCATION"),
        createPuzzle("Hello is there anybody in there", "COMFORTABLY NUMB")
    ],
    // Day 4
    "2025-12-01": [
        createPuzzle("The Divine Miss M", "BETTE MIDLER"),
        createPuzzle("Running amok in Salem", "HOCUS POCUS"),
        createPuzzle("Did you ever know that you're my hero", "WIND BENEATH MY WINGS")
    ],
    // Day 5
    "2025-12-02": [
        createPuzzle("The Princess of Pop", "BRITNEY SPEARS"),
        createPuzzle("Hit song with a school uniform", "BABY ONE MORE TIME"),
        createPuzzle("She's not that innocent", "OOPS I DID IT AGAIN")
    ],
    // Day 6
    "2025-12-03": [
        createPuzzle("The Prince of Darkness", "OZZY OSBOURNE"),
        createPuzzle("Heavy metal pioneers", "BLACK SABBATH"),
        createPuzzle("All aboard!", "CRAZY TRAIN")
    ],
    // Day 7
    "2025-12-04": [
        createPuzzle("The Dude", "JEFF BRIDGES"),
        createPuzzle("He fights for the users", "TRON"),
        createPuzzle("The rug tied the room together", "THE BIG LEBOWSKI")
    ],
    // Day 8
    "2025-12-05": [
        createPuzzle("Illegal drinking spot", "SPEAKEASY"),
        createPuzzle("Bootleggers' product", "MOONSHINE"),
        createPuzzle("The law that ended the dry era", "TWENTY FIRST AMENDMENT")
    ],
    // Day 9
    "2025-12-06": [
        createPuzzle("Kitchen quick heater", "MICROWAVE OVEN"),
        createPuzzle("First food intentionally cooked", "POPCORN"),
        createPuzzle("Lava hot or stone cold snack", "HOT POCKETS")
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
