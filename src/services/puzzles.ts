import { db, auth } from './analytics';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { PuzzleDocument, Puzzle } from '../types';

const COLLECTION_NAME = 'puzzles';

export const savePuzzle = async (date: string, puzzles: [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle], author?: string): Promise<void> => {
    if (!auth.currentUser) throw new Error("Must be logged in to save puzzles");

    const puzzleDoc: PuzzleDocument = {
        date,
        puzzles,
        author: author || 'Anonymous',
        status: 'published', // For now, we just save as published/ready. later we can add draft support if needed
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

export const getPuzzleStatusForMonth = async (year: number, month: number): Promise<Map<string, string>> => {
    // Month is 1-12
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    // simplistic end of month, essentially start of next month
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const q = query(
        collection(db, COLLECTION_NAME),
        where('date', '>=', startStr),
        where('date', '<', endStr)
    );

    const snapshot = await getDocs(q);
    const existingPuzzles = new Map<string, string>();
    snapshot.forEach(doc => {
        const data = doc.data();
        existingPuzzles.set(doc.id, data.author || 'Anonymous');
    });
    return existingPuzzles;
};
