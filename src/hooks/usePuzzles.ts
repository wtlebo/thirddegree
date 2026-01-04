import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query } from 'firebase/firestore';
import { db } from '../services/analytics';
import { PuzzleDocumentSchema, type PuzzleDocument } from '../lib/schemas';


const COLLECTION = 'puzzles';

// --- Queries ---

export const usePuzzleByDate = (date: string | null) => {
    return useQuery({
        queryKey: ['puzzle', date],
        queryFn: async (): Promise<PuzzleDocument | null> => {
            if (!date) return null;
            const ref = doc(db, COLLECTION, date);
            const snap = await getDoc(ref);
            if (!snap.exists()) return null;

            // Validate data
            return PuzzleDocumentSchema.parse(snap.data());
        },
        enabled: !!date,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnMount: false, // Trust cache on navigation back/forth
    });
};

export const usePuzzlesByMonth = (year: number, month: number) => {
    return useQuery({
        queryKey: ['puzzles', 'month', year, month],
        queryFn: async () => {
            // Month is 1-12
            const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextYear = month === 12 ? year + 1 : year;
            const endStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

            // Fetch all (naive approach for now, matching existing service)
            // Ideally we'd use Firestore where() but string dates are efficient enough for small datasets
            const q = query(collection(db, COLLECTION));
            const snapshot = await getDocs(q);

            const puzzles: PuzzleDocument[] = [];

            snapshot.forEach(doc => {
                const id = doc.id;
                if (id >= startStr && id < endStr) {
                    // Safe parsing - if it fails schema, we might want to log it but skip it to avoid crashing the whole view
                    try {
                        const data = PuzzleDocumentSchema.parse(doc.data());
                        puzzles.push(data);
                    } catch (e) {
                        console.warn(`Skipping invalid puzzle ${id}:`, e);
                    }
                }
            });

            return puzzles;
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });
};

// --- Mutations ---

export const useSavePuzzle = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: PuzzleDocument) => {
            const ref = doc(db, COLLECTION, data.date);
            await setDoc(ref, data);
        },
        onSuccess: (_, variables) => {
            // 1. Update the cache directly
            queryClient.setQueryData(['puzzle', variables.date], variables);

            // 2. Invalidate MONTH only (so red/yellow dots update).
            // We do NOT invalidate the specific puzzle query here because Firestore 
            // is eventually consistent and might return old data immediately after write.
            // We trust our local setQueryData for the duration of staleTime.
            queryClient.invalidateQueries({ queryKey: ['puzzles', 'month'] });
        }
    });
};

export const useDeletePuzzle = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (date: string) => {
            const ref = doc(db, COLLECTION, date);
            await deleteDoc(ref);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['puzzles', 'month'] });
        }
    });
};
