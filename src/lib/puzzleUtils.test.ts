import { describe, it, expect } from 'vitest';
import { validatePuzzle } from './puzzleUtils';
import type { PuzzleDocument } from './schemas';

// Helper to create mock data
const createMockPuzzle = (overrides: Partial<PuzzleDocument> = {}): PuzzleDocument => ({
    date: '2026-01-01',
    status: 'draft',
    author: 'Test',
    puzzles: [
        { clue: 'A.', answer: 'B', revealOrder: ['B'] },
        { clue: 'C.', answer: 'D', revealOrder: ['D'] },
        { clue: 'E.', answer: 'F', revealOrder: ['F'] },
        { clue: 'G.', answer: 'H', revealOrder: ['H'] },
        { clue: 'I.', answer: 'J', revealOrder: ['J'] }
    ],
    approvedBy: null,
    ...overrides
});

describe('validatePuzzle', () => {
    it('returns null for valid puzzle', () => {
        const doc = createMockPuzzle();
        expect(validatePuzzle(doc, false)).toBe(null);
    });

    it('allows missing clues in drafts', () => {
        const doc = createMockPuzzle();
        doc.puzzles[0].clue = '';
        expect(validatePuzzle(doc, true)).toBe(null);
    });

    it('rejects missing clues in review mode', () => {
        const doc = createMockPuzzle();
        doc.puzzles[0].clue = '';
        expect(validatePuzzle(doc, false)).toMatch(/Puzzle #1 is missing a clue/);
    });

    it('allows special characters (hyphen, quotes, comma, ampersand, punctuation)', () => {
        const doc = createMockPuzzle();
        doc.puzzles[0].answer = "R&B, IT'S-A-ME! WHO?";
        expect(validatePuzzle(doc, true)).toBe(null);
    });

    it('rejects invalid characters', () => {
        const doc = createMockPuzzle();
        doc.puzzles[0].answer = 'HELLO @WORLD'; // @ is invalid
        const result = validatePuzzle(doc, true);
        expect(result).toContain('invalid characters');
    });

    it('rejects too long answers', () => {
        const doc = createMockPuzzle();
        doc.puzzles[0].answer = 'A'.repeat(201);
        expect(validatePuzzle(doc, true)).toMatch(/too long/);
    });

    it('validates all sockets', () => {
        const doc = createMockPuzzle();
        doc.puzzles[4].answer = 'BAD@';
        expect(validatePuzzle(doc, true)).toMatch(/Puzzle #5/);
    });
});
