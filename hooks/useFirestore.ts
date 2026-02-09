import { useState, useEffect, useCallback } from 'react';
import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, auth, onAuthStateChanged, doc, setDoc, updateDoc, deleteDoc, where, getDocs, writeBatch } from '../firebase';
import { Message, Role, Subject, Attachment, ChatSession } from '../types';

export const useChatList = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u: any) => {
      setUserId(u ? u.uid : null);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const chatsRef = collection(db, `users/${userId}/chats`);
    const q = query(chatsRef, orderBy('createdAt', 'desc')); // Assuming createdAt or updatedAt

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        // Ensure subject is typed correctly or validated
      })) as ChatSession[];
      setSessions(chats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const deleteChat = useCallback(async (chatId: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/chats/${chatId}`));
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }, [userId]);

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

export const useChat = (chatId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Initialize User
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  // Listen to messages
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
  }, [userId, chatId]); // Depend on chatId instead of subject

  const addMessage = useCallback(async (text: string, role: Role, attachment?: Attachment, chatIdOverride?: string) => {
    const targetChatId = chatIdOverride || chatId;
    if (!userId || !targetChatId) return;

    const messagesRef = collection(db, `users/${userId}/chats/${targetChatId}/messages`);
    const chatDocRef = doc(db, `users/${userId}/chats/${targetChatId}`);

    try {
      // 1. Add Message
      await addDoc(messagesRef, {
        role,
        content: text,
        timestamp: serverTimestamp(),
        ...(attachment ? { attachment } : {})
      });

      // 2. Update Chat Metadata (Update last activity?)
      // We might want to update an 'updatedAt' field to sort by recent.
      // Current useChatList sorts by createdAt. We might want to fix that later.
    } catch (dbError) {
      console.error("Firestore Write Error:", dbError);
    }
  }, [userId, chatId]);

  const createChat = useCallback(async (subject: Subject, initialMessage: string, role: Role, attachment?: Attachment) => {
    if (!userId) return null;

    try {
      // 1. Create Chat Document
      const chatsRef = collection(db, `users/${userId}/chats`);
      const chatDoc = await addDoc(chatsRef, {
        subject,
        title: initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : ''), // Temporary title
        createdAt: serverTimestamp(),
        userId
      });

      // 2. Add Initial Message
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

  const updateMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!userId || !chatId) return;
    try {
      await updateDoc(doc(db, `users/${userId}/chats/${chatId}/messages/${messageId}`), { content: newContent });
    } catch (error) {
      console.error("Error updating message:", error);
    }
  }, [userId, chatId]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!userId || !chatId) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/chats/${chatId}/messages/${messageId}`));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }, [userId, chatId]); // Fixed dependency

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