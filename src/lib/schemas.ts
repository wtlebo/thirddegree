import { z } from 'zod';

export const PuzzleSchema = z.object({
    clue: z.string(),
    answer: z.string(),
    revealOrder: z.array(z.string()),
    comment: z.string().optional(),
});

export const DailySetSchema = z.object({
    date: z.string(), // YYYY-MM-DD
    puzzles: z.tuple([PuzzleSchema, PuzzleSchema, PuzzleSchema, PuzzleSchema, PuzzleSchema]),
    author: z.string().optional(),
});

export const PuzzleDocumentSchema = DailySetSchema.extend({
    // Firestore specific fields
    author: z.string().default('Anonymous'),
    approvedBy: z.string().nullable().optional(),
    createdAt: z.any().optional(), // Timestamp or date
    status: z.enum(['draft', 'review', 'published']),
});

export const UserProfileSchema = z.object({
    uid: z.string(),
    email: z.string().email(),
    handle: z.string(),
    role: z.enum(['admin', 'pm', 'player']),
    createdAt: z.any(),
});

// Types inferred from schemas for TypeScript usage
export type Puzzle = z.infer<typeof PuzzleSchema>;
export type DailySet = z.infer<typeof DailySetSchema>;
export type PuzzleDocument = z.infer<typeof PuzzleDocumentSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
