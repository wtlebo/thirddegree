import type { Puzzle } from '../types';

export const getRevealedLetters = (puzzle: Puzzle, count: number): Set<string> => {
    if (count <= 0) return new Set();

    // Use the pre-determined reveal order for consistency
    const lettersToReveal = puzzle.revealOrder.slice(0, count);
    return new Set(lettersToReveal);
};

export const isPuzzleSolved = (puzzle: Puzzle, guessed: Set<string>, revealed: Set<string>): boolean => {
    const answer = puzzle.answer.toUpperCase();
    for (const char of answer) {
        if (char === ' ') continue;
        if (!guessed.has(char) && !revealed.has(char)) {
            return false;
        }
    }
    return true;
};
