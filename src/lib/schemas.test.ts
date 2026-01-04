import { describe, it, expect } from 'vitest';
import { PuzzleDocumentSchema } from './schemas';

describe('PuzzleDocumentSchema', () => {
    it('validates a correct puzzle document', () => {
        const validData = {
            date: '2026-01-01',
            author: 'TestUser',
            status: 'draft',
            puzzles: [
                { clue: 'A', answer: 'B', revealOrder: ['B'] },
                { clue: 'C', answer: 'D', revealOrder: ['D'] },
                { clue: 'E', answer: 'F', revealOrder: ['F'] },
                { clue: 'G', answer: 'H', revealOrder: ['H'] },
                { clue: 'I', answer: 'J', revealOrder: ['J'] },
            ],
            approvedBy: null
        };

        const result = PuzzleDocumentSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('rejects missing fields', () => {
        const invalidData = {
            date: '2026-01-01',
            // missing puzzles
        };

        const result = PuzzleDocumentSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it('allows "review" status', () => {
        const validData = {
            date: '2026-01-01',
            author: 'TestUser',
            status: 'review',
            puzzles: Array(5).fill({ clue: 'A', answer: 'B', revealOrder: [] }),
            approvedBy: null
        };
        const result = PuzzleDocumentSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });
});
