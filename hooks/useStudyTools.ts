/**
 * @module useStudyTools
 * Firestore CRUD for flashcard decks and quiz results.
 * Data stored under `users/{uid}/flashcards` and `users/{uid}/quizzes`.
 */

import { useState, useEffect, useCallback } from 'react';
import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, auth, onAuthStateChanged, doc, deleteDoc, updateDoc } from '../firebase';

export interface FlashcardItem {
    front: string;
    back: string;
}

export interface FlashcardDeck {
    id: string;
    title: string;
    cards: FlashcardItem[];
    createdAt: any;
    sourceType?: string;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

export interface QuizResult {
    id: string;
    title: string;
    questions: QuizQuestion[];
    score?: number;
    totalQuestions: number;
    createdAt: any;
    completedAt?: any;
    answers?: number[];
}

export const useStudyTools = () => {
    const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([]);
    const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
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
            setFlashcardDecks([]);
            setQuizResults([]);
            setLoading(false);
            return;
        }

        const flashcardsRef = collection(db, `users/${userId}/flashcards`);
        const fq = query(flashcardsRef, orderBy('createdAt', 'desc'));

        const unsub1 = onSnapshot(fq, (snap) => {
            const decks = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate() || new Date(),
            })) as FlashcardDeck[];
            setFlashcardDecks(decks);
        });

        const quizzesRef = collection(db, `users/${userId}/quizzes`);
        const qq = query(quizzesRef, orderBy('createdAt', 'desc'));

        const unsub2 = onSnapshot(qq, (snap) => {
            const quizzes = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate() || new Date(),
            })) as QuizResult[];
            setQuizResults(quizzes);
            setLoading(false);
        });

        return () => { unsub1(); unsub2(); };
    }, [userId]);

    const saveFlashcardDeck = useCallback(async (title: string, cards: FlashcardItem[], sourceType?: string) => {
        if (!userId) return null;
        try {
            const ref = collection(db, `users/${userId}/flashcards`);
            const docRef = await addDoc(ref, {
                title,
                cards,
                sourceType: sourceType || 'chat',
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (e) {
            console.error('Error saving flashcard deck:', e);
            return null;
        }
    }, [userId]);

    const deleteFlashcardDeck = useCallback(async (deckId: string) => {
        if (!userId) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/flashcards/${deckId}`));
        } catch (e) {
            console.error('Error deleting flashcard deck:', e);
        }
    }, [userId]);

    const saveQuiz = useCallback(async (title: string, questions: QuizQuestion[]) => {
        if (!userId) return null;
        try {
            const ref = collection(db, `users/${userId}/quizzes`);
            const docRef = await addDoc(ref, {
                title,
                questions,
                totalQuestions: questions.length,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (e) {
            console.error('Error saving quiz:', e);
            return null;
        }
    }, [userId]);

    const updateQuizResult = useCallback(async (quizId: string, score: number, answers: number[]) => {
        if (!userId) return;
        try {
            await updateDoc(doc(db, `users/${userId}/quizzes/${quizId}`), {
                score,
                answers,
                completedAt: serverTimestamp(),
            });
        } catch (e) {
            console.error('Error updating quiz result:', e);
        }
    }, [userId]);

    const deleteQuiz = useCallback(async (quizId: string) => {
        if (!userId) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/quizzes/${quizId}`));
        } catch (e) {
            console.error('Error deleting quiz:', e);
        }
    }, [userId]);

    return {
        flashcardDecks,
        quizResults,
        loading,
        saveFlashcardDeck,
        deleteFlashcardDeck,
        saveQuiz,
        updateQuizResult,
        deleteQuiz,
    };
};
