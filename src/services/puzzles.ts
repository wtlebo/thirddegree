import { db, auth } from './analytics';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    where,
    writeBatch
} from 'firebase/firestore';
import type { PuzzleDocument } from '../types';

const COLLECTION_NAME = 'puzzles';

export const savePuzzle = async (data: PuzzleDocument): Promise<void> => {
    if (!auth.currentUser) throw new Error("Must be logged in to save puzzles");

    await setDoc(doc(db, COLLECTION_NAME, data.date), {
        ...data,
        createdAt: data.createdAt || new Date() // Ensure createdAt is preserved or set
    });
};

export const getPuzzleByDate = async (date: string): Promise<PuzzleDocument | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, date);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as PuzzleDocument;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching puzzle:", error);
        return null;
    }
};

export const getPuzzleStatusForMonth = async (year: number, month: number): Promise<Map<string, { author: string, status: 'draft' | 'beta' | 'ready' | 'published', approvedBy?: string }>> => {
    // Month is 1-12
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    // simplistic end of month, essentially start of next month
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    // Fetch all puzzles for robustness against indexing issues
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);

    const existingPuzzles = new Map<string, { author: string, status: 'draft' | 'beta' | 'ready' | 'published', approvedBy?: string }>();
    snapshot.forEach(doc => {
        const id = doc.id;
        // Client-side date filter
        if (id >= startStr && id < endStr) {
            const data = doc.data() as PuzzleDocument;
            existingPuzzles.set(id, {
                author: data.author || 'Anonymous',
                status: (data.status as 'draft' | 'beta' | 'ready' | 'published') || 'published',
                approvedBy: data.approvedBy || undefined
            });
        }
    });
    return existingPuzzles;
};
export const deletePuzzle = async (date: string): Promise<void> => {
    if (!auth.currentUser) throw new Error("Must be logged in to delete puzzles");
    await deleteDoc(doc(db, COLLECTION_NAME, date));
};

export const getNextBetaPuzzle = async (userHandle?: string, excludeDate?: string): Promise<string | null> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            // We can't easily query for status='beta' AND date > today AND "user not in votes" efficiently in one go without composite indexes
            // So we'll fetch all future puzzles and filter in memory.
        );
        const snapshot = await getDocs(q);

        const today = new Date().toLocaleDateString('en-CA');
        const candidates: PuzzleDocument[] = [];

        snapshot.forEach(doc => {
            const data = doc.data() as PuzzleDocument;
            // Must be in future, must be beta
            // Also exclude the puzzle we are currently looking at (to avoid "staying here")
            if (data.date > today && data.status === 'beta' && data.date !== excludeDate) {
                candidates.push(data);
            }
        });

        // Sort by date ascending
        candidates.sort((a, b) => a.date.localeCompare(b.date));

        // Find first one where user hasn't voted APPROVED (needs change is ok to see again?)
        // User said: "presented with the next puzzle that is not approved"
        // If I voted "approve", I don't need to see it again.
        // If I voted "needs_change", maybe I should see it again? Or wait for author update? 
        // For simplicity: Show any beta puzzle where I haven't voted "approve".

        for (const p of candidates) {
            const myVote = p.votes?.find(v => v.handle === userHandle);
            if (!myVote || myVote.vote !== 'approve') {
                return p.date;
            }
        }

        return null; // No work available
    } catch (e) {
        console.error("Error finding next beta puzzle:", e);
        return null;
    }
};

export const demoteFuturePuzzlesToBeta = async (): Promise<string> => {
    if (!auth.currentUser) throw new Error("Must be logged in");

    // 1. Get all future puzzles
    const today = new Date().toLocaleDateString('en-CA');
    const q = query(
        collection(db, COLLECTION_NAME),
        where('date', '>', today)
    );

    const snapshot = await getDocs(q);
    let count = 0;

    // 2. Batch update
    const batch = writeBatch(db);

    snapshot.forEach(doc => {
        const data = doc.data() as PuzzleDocument;
        // Demote 'ready' or 'draft' to 'beta'. 
        // We probably shouldn't touch 'published' without explicit instruction, 
        // but user said "all future puzzles". 
        // Let's affect 'ready', 'draft', and 'published' if they are in the future.
        // Actually, user said "demote ... to beta". 
        if (data.status !== 'beta') {
            batch.update(doc.ref, { status: 'beta' });
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
    }

    return `Demoted ${count} puzzles to Beta.`;
};


