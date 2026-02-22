/**
 * @module useFirestore
 *
 * Custom React hooks for Firestore data operations in MentisAI.
 * Provides two hooks:
 *
 * - {@link useChatList} — Real-time subscription to the user's chat sessions.
 * - {@link useChat}     — Real-time subscription to messages within a specific
 *                          chat, plus CRUD operations for messages and chats.
 *
 * Data is stored under `users/{uid}/chats` with a nested
 * `messages` sub-collection per chat.
 *
 * All hooks automatically subscribe/unsubscribe to Firebase Auth state
 * to obtain the current user's UID.
 */

import { useState, useEffect, useCallback } from 'react';
import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, auth, onAuthStateChanged, doc, setDoc, updateDoc, deleteDoc, where, getDocs, writeBatch } from '../firebase';
import { Message, Role, Subject, Attachment, ChatSession } from '../types';

/**
 * Subscribes to the authenticated user's list of chat sessions,
 * ordered by creation date (newest first).
 *
 * @returns An object containing:
 *  - `sessions`    — Live array of {@link ChatSession} documents.
 *  - `loading`     — `true` while the initial snapshot has not yet arrived.
 *  - `deleteChat`  — Deletes a chat session by ID.
 *  - `renameChat`  — Updates the title of a chat session.
 */
export const useChatList = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  /** Track the currently authenticated user. */
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u: any) => {
      setUserId(u ? u.uid : null);
    });
    return () => unsubscribeAuth();
  }, []);

  /** Subscribe to real-time chat list updates from Firestore. */
  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const chatsRef = collection(db, `users/${userId}/chats`);
    const q = query(chatsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
      })) as ChatSession[];
      setSessions(chats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  /**
   * Permanently deletes a chat session and its metadata from Firestore.
   * Note: Firestore sub-collections (messages) are not automatically deleted.
   *
   * @param chatId - The Firestore document ID of the chat to delete.
   */
  const deleteChat = useCallback(async (chatId: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/chats/${chatId}`));
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }, [userId]);

  /**
   * Updates the display title of a chat session.
   *
   * @param chatId   - The Firestore document ID of the chat.
   * @param newTitle - The new title string.
   */
  const renameChat = useCallback(async (chatId: string, newTitle: string) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, `users/${userId}/chats/${chatId}`), { title: newTitle });
    } catch (error) {
      console.error("Error renaming chat:", error);
    }
  }, [userId]);

  return { sessions, loading, deleteChat, renameChat };
}

/**
 * Manages messages within a single chat session. Provides a real-time
 * listener on the `messages` sub-collection plus operations for
 * creating chats, adding/editing/deleting messages, and bulk-deleting
 * messages after a given timestamp (used for the "edit & resend" flow).
 *
 * @param chatId - The active chat's Firestore document ID, or `null` if
 *                 no chat is selected (renders an empty message list).
 *
 * @returns An object containing:
 *  - `messages`            — Live array of {@link Message} objects (ascending by timestamp).
 *  - `addMessage`          — Appends a new message to the active chat.
 *  - `createChat`          — Creates a new chat session with an initial message.
 *  - `updateMessage`       — Edits the content of an existing message.
 *  - `deleteMessage`       — Deletes a single message by ID.
 *  - `deleteMessagesAfter` — Batch-deletes all messages after a given timestamp.
 *  - `loadingHistory`      — `true` while loading the initial message snapshot.
 *  - `userId`              — The authenticated user's UID.
 */
export const useChat = (chatId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /** Track the currently authenticated user. */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  /** Subscribe to real-time message updates for the active chat. */
  useEffect(() => {
    if (!userId || !chatId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    setLoadingHistory(true);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate() || new Date(),
      })) as Message[];

      setMessages(msgs);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [userId, chatId]);

  /**
   * Persists a new message to the active chat's sub-collection.
   *
   * @param text           - Message text content.
   * @param role           - Whether this is a `USER` or `MODEL` message.
   * @param attachment     - Optional file attachment metadata.
   * @param chatIdOverride - Override the active chat ID (used when a new
   *                         chat was just created and `chatId` state hasn't
   *                         updated yet).
   */
  const addMessage = useCallback(async (text: string, role: Role, attachment?: Attachment, chatIdOverride?: string) => {
    const targetChatId = chatIdOverride || chatId;
    if (!userId || !targetChatId) return;

    const messagesRef = collection(db, `users/${userId}/chats/${targetChatId}/messages`);
    const chatDocRef = doc(db, `users/${userId}/chats/${targetChatId}`);

    try {
      await addDoc(messagesRef, {
        role,
        content: text,
        timestamp: serverTimestamp(),
        ...(attachment ? { attachment } : {})
      });
    } catch (dbError) {
      console.error("Firestore Write Error:", dbError);
    }
  }, [userId, chatId]);

  /**
   * Creates a new chat session document and adds the first message.
   * The initial title is auto-generated from the first 30 characters of
   * the user's message; it is later replaced by an AI-generated summary.
   *
   * @param subject        - Academic subject for the new chat.
   * @param initialMessage - The user's first message text.
   * @param role           - Role of the initial message sender.
   * @param attachment     - Optional file attachment for the first message.
   * @returns The new chat's Firestore document ID, or `null` on error.
   */
  const createChat = useCallback(async (subject: Subject, initialMessage: string, role: Role, attachment?: Attachment) => {
    if (!userId) return null;

    try {
      const chatsRef = collection(db, `users/${userId}/chats`);
      const chatDoc = await addDoc(chatsRef, {
        subject,
        title: initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : ''),
        createdAt: serverTimestamp(),
        userId
      });

      const messagesRef = collection(db, `users/${userId}/chats/${chatDoc.id}/messages`);
      await addDoc(messagesRef, {
        role,
        content: initialMessage,
        timestamp: serverTimestamp(),
        ...(attachment ? { attachment } : {})
      });

      return chatDoc.id;
    } catch (error) {
      console.error("Error creating chat:", error);
      return null;
    }
  }, [userId]);

  /**
   * Updates the text content of an existing message.
   *
   * @param messageId  - Firestore document ID of the message to edit.
   * @param newContent - Replacement text content.
   */
  const updateMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!userId || !chatId) return;
    try {
      await updateDoc(doc(db, `users/${userId}/chats/${chatId}/messages/${messageId}`), { content: newContent });
    } catch (error) {
      console.error("Error updating message:", error);
    }
  }, [userId, chatId]);

  /**
   * Deletes a single message from the active chat.
   *
   * @param messageId - Firestore document ID of the message to delete.
   */
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!userId || !chatId) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/chats/${chatId}/messages/${messageId}`));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }, [userId, chatId]);

  /**
   * Batch-deletes all messages with a timestamp strictly after the given value.
   * Used during the "edit and resend" flow to remove the edited message's
   * successors before re-submitting.
   *
   * @param timestamp - Firestore timestamp; all messages after this are removed.
   */
  const deleteMessagesAfter = useCallback(async (timestamp: any) => {
    if (!userId || !chatId) return;
    const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
    const q = query(messagesRef, where('timestamp', '>', timestamp));

    try {
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error deleting messages after timestamp:", error);
    }
  }, [userId, chatId]);

  return { messages, addMessage, createChat, updateMessage, deleteMessage, deleteMessagesAfter, loadingHistory, userId };
};