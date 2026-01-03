import { db, auth } from './analytics';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query } from 'firebase/firestore';
import type { PuzzleDocument, Puzzle } from '../types';

const COLLECTION_NAME = 'puzzles';

export const savePuzzle = async (date: string, puzzles: [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle], author?: string, status: 'draft' | 'review' | 'published' = 'published', approvedBy?: string): Promise<void> => {
    if (!auth.currentUser) throw new Error("Must be logged in to save puzzles");

    const puzzleDoc: PuzzleDocument = {
        date,
        puzzles,
        author: author || 'Anonymous',
        approvedBy: approvedBy || null,
        status,
        createdAt: new Date()
    };

    await setDoc(doc(db, COLLECTION_NAME, date), puzzleDoc);
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

export const getPuzzleStatusForMonth = async (year: number, month: number): Promise<Map<string, { author: string, status: 'draft' | 'review' | 'published', approvedBy?: string }>> => {
    // Month is 1-12
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    // simplistic end of month, essentially start of next month
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    // Fetch all puzzles for robustness against indexing issues
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);

    const existingPuzzles = new Map<string, { author: string, status: 'draft' | 'review' | 'published', approvedBy?: string }>();
    snapshot.forEach(doc => {
        const id = doc.id;
        // Client-side date filter
        if (id >= startStr && id < endStr) {
            const data = doc.data() as PuzzleDocument;
            existingPuzzles.set(id, {
                author: data.author || 'Anonymous',
                status: data.status || 'published',
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


