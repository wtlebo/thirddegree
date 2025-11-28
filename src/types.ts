export interface Puzzle {
    clue: string;
    answer: string;
    revealOrder: string[]; // Pre-shuffled list of unique letters for consistent reveals
}

export interface DailySet {
    date: string; // YYYY-MM-DD
    puzzles: [Puzzle, Puzzle, Puzzle];
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
    dailySet: DailySet;
    currentLevel: 0 | 1 | 2;
    strikes: number;
    strikesPerLevel: [number, number, number];
    guessedLetters: Set<string>; // Letters guessed in the current level
    revealedLetters: Set<string>; // Letters revealed at start of level
    status: GameStatus;
}

export interface UserStats {
    gamesPlayed: number;
    gamesWon: number;
    winDistribution: {
        perfect: number; // 0 strikes total
        oneStrike: number; // 1 strike total
        twoStrikes: number; // 2 strikes total
        failed: number; // 3 strikes total (lost)
    };
    currentStreak: number;
    maxStreak: number;
    lastPlayedDate: string | null;
}
