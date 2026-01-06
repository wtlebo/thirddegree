import type { PuzzleDocument } from './schemas';

export const validatePuzzle = (data: PuzzleDocument, isDraft: boolean): string | null => {
    for (let i = 0; i < 5; i++) {
        const p = data.puzzles[i];
        if (!p) return `Puzzle #${i + 1} is missing (internal error).`;

        if (!isDraft) {
            if (!p.clue) return `Puzzle #${i + 1} is missing a clue.`;
            if (!p.answer) return `Puzzle #${i + 1} is missing an answer.`;
        }

        if (p.answer && p.answer.length > 200) return `Puzzle #${i + 1} answer is too long (max 200 chars).`;
        if (p.answer && p.answer.split(' ').some(w => w.length > 15)) return `Puzzle #${i + 1} contains a word longer than 15 characters.`;
        if (p.answer && !/^[A-Z '\-"“”,&.?!]*$/.test(p.answer)) return `Puzzle #${i + 1} answer contains invalid characters (A-Z, space, hyphen, quotes, comma, &, ., ?, ! only).`;

        if (p.clue) {
            if (p.clue.length > 200) return `Puzzle #${i + 1} clue is too long (max 200 chars).`;
            // Punctuation check removed per PM request (Jan 6 2026)
        }
    }
    return null;
};
