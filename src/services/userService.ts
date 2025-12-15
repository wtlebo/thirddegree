import { db } from './analytics';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, query, where } from 'firebase/firestore';
import type { UserProfile, AllowedUser } from '../types';

const ALLOWED_USERS_COLLECTION = 'allowed_users';
const USERS_COLLECTION = 'users';

// Check if an email is in the allowed list
export const checkUserAllowed = async (email: string): Promise<{ allowed: boolean, role?: 'admin' | 'pm' }> => {
    // Basic normalization
    const normalizedEmail = email.toLowerCase().trim();

    // Check if the allowed_users collection is empty (Bootstrap Mode)
    try {
        const allowedSnap = await getDocs(collection(db, ALLOWED_USERS_COLLECTION));
        if (allowedSnap.empty) {
            return { allowed: true, role: 'admin' }; // First user is Admin
        }
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new Error("Setup Required: Please update Firestore Security Rules in Firebase Console.");
        }
        throw error;
    }

    // Check specific email doc
    if (!normalizedEmail) return { allowed: false };

    // We strive to use email as ID for allowed_users for easy lookup
    const docRef = doc(db, ALLOWED_USERS_COLLECTION, normalizedEmail);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data() as AllowedUser;
        return { allowed: true, role: data.role };
    }

    // Default to allowed 'player' if not explicitly invited as admin/pm
    return { allowed: true, role: 'player' };
};

// Get the user's profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    if (!uid) return null;
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }
    return null;
};

// Create a new user profile
export const createUserProfile = async (uid: string, email: string, handle: string, role: 'admin' | 'pm'): Promise<void> => {
    if (!uid) throw new Error("User ID is required to create a profile");

    const profile: UserProfile = {
        uid,
        email: email.toLowerCase(),
        handle,
        role,
        createdAt: new Date()
    };

    await setDoc(doc(db, USERS_COLLECTION, uid), profile);

    // Also ensure they are in allowed_users if this was a bootstrap creation
    if (email) {
        const allowedRef = doc(db, ALLOWED_USERS_COLLECTION, email.toLowerCase());
        const allowedSnap = await getDoc(allowedRef);
        if (!allowedSnap.exists()) {
            await setDoc(allowedRef, {
                email: email.toLowerCase(),
                role,
                addedBy: 'system_bootstrap',
                addedAt: new Date()
            });
        }
    }
};

// Invite a user (Admin only)
export const inviteUser = async (email: string, role: 'admin' | 'pm', addedByUid: string): Promise<void> => {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) throw new Error("Invalid email address");

    const docRef = doc(db, ALLOWED_USERS_COLLECTION, normalizedEmail);

    const invite: AllowedUser = {
        email: normalizedEmail,
        role,
        addedBy: addedByUid,
        addedAt: new Date()
    };

    await setDoc(docRef, invite);
};

export const getAllInvites = async (): Promise<AllowedUser[]> => {
    const snapshot = await getDocs(collection(db, ALLOWED_USERS_COLLECTION));
    return snapshot.docs.map(doc => doc.data() as AllowedUser);
};

// Update user handle and retroactively update all their puzzles
export const updateUserHandle = async (uid: string, oldHandle: string, newHandle: string): Promise<void> => {
    if (!uid || !newHandle.trim()) throw new Error("Invalid User ID or Handle");
    const normalizedHandle = newHandle.trim();

    // 1. Update the User Profile
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, { handle: normalizedHandle }, { merge: true });

    // 2. Find all puzzles by the old handle
    const puzzlesRef = collection(db, 'puzzles');
    const q = query(puzzlesRef, where('author', '==', oldHandle));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    // 3. Batch update the puzzles
    // Firestore batches are limited to 500 ops. If a user has > 500 puzzles, we'd need chunks.
    // For now, assuming < 500 for this scale.
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { author: normalizedHandle });
    });

    await batch.commit();
};
