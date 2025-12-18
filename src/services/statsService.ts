import { db } from './analytics';
import { collection, getDocs } from 'firebase/firestore';
import { getDailyAverageScore, getDailyAverageRating } from './analytics';
import type { PuzzleDocument } from '../types';

export interface PMStat {
    handle: string;
    totalCreated: number;
    publishedCount: number;
    averageGlobalScore: number;
    averageRating: number | null;
}

export const getPMStats = async (): Promise<PMStat[]> => {
    try {
        // 1. Fetch ALL puzzles (optimization: could limit fields if we had an index, but for now full docs is okay for small scale)
        const puzzleSnapshot = await getDocs(collection(db, 'puzzles'));
        const puzzles = puzzleSnapshot.docs.map(d => d.data() as PuzzleDocument);

        // 2. Group by Author
        const authorMap = new Map<string, PuzzleDocument[]>();

        // Helper to normalize author names
        const normalize = (s?: string) => s ? s.trim() : 'Anonymous';

        puzzles.forEach(p => {
            const author = normalize(p.author);
            if (!authorMap.has(author)) {
                authorMap.set(author, []);
            }
            authorMap.get(author)?.push(p);
        });

        // 3. Calculate Stats for each Author
        const today = new Date().toISOString().split('T')[0];
        const stats: PMStat[] = [];

        for (const [handle, authorsPuzzles] of authorMap.entries()) {
            const totalCreated = authorsPuzzles.length;

            // "Published" means date <= today (has been playable)
            const publishedPuzzles = authorsPuzzles.filter(p => p.date <= today && p.status !== 'draft');
            const publishedCount = publishedPuzzles.length;

            let totalScoreSum = 0;
            let scoredPuzzlesCount = 0;

            let totalRatingSum = 0;
            let ratedPuzzlesCount = 0;

            // 4. Fetch Average Score AND Rating for Published Puzzles
            // Executing in parallel for speed
            if (publishedCount > 0) {
                const results = await Promise.all(publishedPuzzles.map(async p => {
                    const [score, rating] = await Promise.all([
                        getDailyAverageScore(p.date),
                        getDailyAverageRating(p.date)
                    ]);
                    return { score, rating };
                }));

                results.forEach(({ score, rating }) => {
                    if (score !== null) {
                        totalScoreSum += score;
                        scoredPuzzlesCount++;
                    }
                    if (rating !== null) {
                        totalRatingSum += rating;
                        ratedPuzzlesCount++;
                    }
                });
            }

            const averageGlobalScore = scoredPuzzlesCount > 0
                ? parseFloat((totalScoreSum / scoredPuzzlesCount).toFixed(1))
                : 0;

            const averageRating = ratedPuzzlesCount > 0
                ? parseFloat((totalRatingSum / ratedPuzzlesCount).toFixed(1))
                : null;

            stats.push({
                handle,
                totalCreated,
                publishedCount,
                averageGlobalScore,
                averageRating
            });
        }

        // Sort by published count desc
        return stats.sort((a, b) => b.publishedCount - a.publishedCount);

    } catch (error) {
        console.error("Error fetching PM stats:", error);
        return [];
    }
};
