/**
 * @module useNotes
 * Firestore CRUD for user study notes. Data stored under `users/{uid}/notes`.
 */

import { useState, useEffect, useCallback } from 'react';
import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, auth, onAuthStateChanged, doc, deleteDoc, updateDoc } from '../firebase';

export type NoteSourceType = 'audio' | 'pdf' | 'youtube' | 'slideshow' | 'text' | 'chat';

export interface StudyNote {
    id: string;
    title: string;
    content: string;
    sourceType: NoteSourceType;
    sourceUrl?: string;
    createdAt: any;
    updatedAt?: any;
    linkedQuizIds?: string[];
    linkedFlashcardIds?: string[];
}

export const useNotes = () => {
    const [notes, setNotes] = useState<StudyNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u: any) => {
            setUserId(u ? u.uid : null);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!userId) {
            setNotes([]);
            setLoading(false);
            return;
        }

        const notesRef = collection(db, `users/${userId}/notes`);
        const q = query(notesRef, orderBy('createdAt', 'desc'));

        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate() || new Date(),
            })) as StudyNote[];
            setNotes(items);
            setLoading(false);
        });

        return () => unsub();
    }, [userId]);

    const saveNote = useCallback(async (title: string, content: string, sourceType: NoteSourceType, sourceUrl?: string) => {
        if (!userId) return null;
        try {
            const ref = collection(db, `users/${userId}/notes`);
            const docRef = await addDoc(ref, {
                title,
                content,
                sourceType,
                sourceUrl: sourceUrl || '',
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (e) {
            console.error('Error saving note:', e);
            return null;
        }
    }, [userId]);

    const updateNote = useCallback(async (noteId: string, updates: Partial<Pick<StudyNote, 'title' | 'content' | 'linkedQuizIds' | 'linkedFlashcardIds'>>) => {
        if (!userId) return;
        try {
            await updateDoc(doc(db, `users/${userId}/notes/${noteId}`), {
                ...updates,
                updatedAt: serverTimestamp(),
            });
        } catch (e) {
            console.error('Error updating note:', e);
        }
    }, [userId]);

    const deleteNote = useCallback(async (noteId: string) => {
        if (!userId) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/notes/${noteId}`));
        } catch (e) {
            console.error('Error deleting note:', e);
        }
    }, [userId]);

    return { notes, loading, saveNote, updateNote, deleteNote };
};
