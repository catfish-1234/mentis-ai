/**
 * @module App
 *
 * Root application component for MentisAI. Orchestrates the entire UI by
 * composing the sidebar, header, chat area, and input area. Manages
 * top-level application state including:
 *
 * - Firebase authentication (Google sign-in, anonymous fallback).
 * - Active chat session selection and creation.
 * - Subject selection, Socratic/Direct mode toggling.
 * - File attachment handling (images for STEM, code files for coding).
 * - Voice input integration.
 * - Theme initialization from localStorage.
 * - Modal dialogs for renaming and deleting chats.
 *
 * @see {@link useChat}     for message CRUD operations.
 * @see {@link useChatList} for chat session listing.
 * @see {@link useAI}       for AI provider communication.
 * @see {@link useVoice}    for speech-to-text input.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Subject, Role, Attachment } from './types';
import { useChat, useChatList } from './hooks/useFirestore';
import { useAI } from './hooks/useAI';
import { useVoice } from './hooks/useVoice';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { ConversationTimeline } from './components/ConversationTimeline';
import { RenameModal } from './components/RenameModal';
import { DeleteModal } from './components/DeleteModal';
import { signInWithPopup, signOut, auth, GoogleAuthProvider, onAuthStateChanged, signInAnonymously } from './firebase';

function App() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject>(Subject.MATH);
  const [input, setInput] = useState('');
  const [user, setUser] = useState<any>(auth.currentUser);
  const [authError, setAuthError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [enterToSend, setEnterToSend] = useState(localStorage.getItem('enterToSend') !== 'false');

  const [sessionPrompts, setSessionPrompts] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [renameChatTitle, setRenameChatTitle] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);
  const [deleteChatTitle, setDeleteChatTitle] = useState('');

  /** Sync the Enter-to-Send preference when changed in SettingsModal. */
  useEffect(() => {
    const handleStorage = () => {
      setEnterToSend(localStorage.getItem('enterToSend') !== 'false');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  /** Apply the persisted theme (light / dark / system) on initial load. */
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    const root = window.document.documentElement;
    if (savedTheme === 'dark') {
      root.classList.add('dark');
    } else if (savedTheme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  const [socraticMode, setSocraticMode] = useState(false);

  const { messages, addMessage, createChat, updateMessage, deleteMessage, deleteMessagesAfter, loadingHistory, userId } = useChat(activeChatId);
  const { sessions: chatSessions, loading: loadingSessions, deleteChat, renameChat } = useChatList();
  const { sendMessage, isLoading: isThinking, statusMessage } = useAI();
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoice();

  /** Append recognized speech text to the input field as it arrives. */
  useEffect(() => {
    if (transcript) {
      setInput(prev => prev + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  /** Firebase Auth state listener — falls back to anonymous auth if no user. */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u: any) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth).catch((err: any) => {
          console.error("Anonymous auth failed", err);
          if (err.code === 'auth/admin-restricted-operation') {
            // Anonymous Auth may be disabled in the Firebase Console
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  /** Trigger Google OAuth sign-in popup. */
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  /** Sign the current user out of Firebase Auth. */
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Programmatically open the native file picker. */
  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  /**
   * Process a file selected by the user. Validates the file type against
   * the active subject's restrictions:
   * - Coding: accepts `.py`, `.js`, `.html`, `.css`, `.ts`, `.json` as text.
   * - STEM subjects: accept image files.
   * - Other subjects / invalid types: shows an alert.
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;
      const fileName = file.name;

      if (activeSubject === Subject.CODING) {
        const allowedExtensions = ['.py', '.js', '.html', '.css', '.ts', '.json'];
        const isAllowed = allowedExtensions.some(ext => fileName.toLowerCase().endsWith(ext));

        if (isAllowed) {
          const textInfo = await file.text();
          setAttachment({
            content: textInfo,
            type: 'text',
            fileName: fileName,
            mimeType: fileType
          });
          return;
        }
      }

      if ([Subject.MATH, Subject.PHYSICS, Subject.CHEMISTRY, Subject.BIOLOGY].includes(activeSubject)) {
        if (fileType.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setAttachment({
                content: event.target.result as string,
                type: 'image',
                fileName: fileName,
                mimeType: fileType
              });
            }
          };
          reader.readAsDataURL(file);
          return;
        }
      }

      alert(`File type not supported for ${activeSubject}. \nCoding: .py, .js, .html\nScience/Math: Images`);
      e.target.value = '';
    }
  };

  /** Toggle speech recognition on/off. */
  const handleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  /** Reset to the new-chat state. */
  const handleNewChat = () => {
    setActiveChatId(null);
    setActiveSubject(Subject.MATH);
    setIsMobileMenuOpen(false);
  };

  /** Open the rename modal pre-filled with the chat's current title. */
  const handleRenameChat = (id: string) => {
    const session = chatSessions.find(s => s.id === id);
    setRenameChatId(id);
    setRenameChatTitle(session?.title || session?.subject || '');
    setRenameModalOpen(true);
    setOpenMenuId(null);
  };

  /** Persist the new chat name and close the rename modal. */
  const confirmRename = async (newName: string) => {
    if (renameChatId && newName.trim()) {
      await renameChat(renameChatId, newName.trim());
    }
    setRenameModalOpen(false);
    setRenameChatId(null);
  };

  /** Open the delete confirmation modal for a specific chat. */
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const session = chatSessions.find(s => s.id === id);
    setDeleteChatId(id);
    setDeleteChatTitle(session?.title || session?.subject || '');
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  /** Execute the chat deletion and reset active chat if needed. */
  const confirmDelete = async () => {
    if (deleteChatId) {
      await deleteChat(deleteChatId);
      if (activeChatId === deleteChatId) setActiveChatId(null);
    }
    setDeleteModalOpen(false);
    setDeleteChatId(null);
  };

  /**
   * Populate the input with a previous user message's content and remove
   * that message (and all subsequent messages) so the user can re-submit.
   */
  const handleEdit = async (msg: any) => {
    setInput(msg.content);
    await deleteMessagesAfter(msg.timestamp);
    await deleteMessage(msg.id);

    if (textareaRef.current) textareaRef.current.focus();
  };

  /**
   * Remove the last AI response and re-send the preceding user message
   * to get a fresh AI-generated answer.
   */
  const handleRegenerate = async () => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === Role.MODEL) {
      await deleteMessage(lastMsg.id);
      const lastUserMsg = messages[messages.length - 2];
      if (lastUserMsg && lastUserMsg.role === Role.USER) {
        const response = await sendMessage(lastUserMsg.content, activeSubject, messages.slice(0, -2), lastUserMsg.attachment);
        await addMessage(response, Role.MODEL);
      }
    }
  };

  /** Ref for the auto-resizing textarea in the input area. */
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Auto-resize the textarea to fit its content. */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      if (input === '') textareaRef.current.style.height = '52px';
    }
  }, [input]);

  /**
   * Core submit handler. Creates a new chat if none is active, persists
   * the user message, calls the AI, and persists the AI response.
   * Also triggers background auto-naming for new chats.
   */
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isThinking || !userId) return;

    const userText = input.trim();
    setInput('');

    let currentChatId = activeChatId;
    if (!currentChatId) {
      const newId = await createChat(activeSubject, userText, Role.USER, attachment);
      if (!newId) return;
      currentChatId = newId;
      setActiveChatId(newId);

      // Background: ask AI for a short title and rename the chat
      sendMessage(`Summarize this query in 3-5 words for a chat title: "${userText}"`, activeSubject, [])
        .then(title => {
          const cleanTitle = title.replace(/^["']|["']$/g, '');
          renameChat(newId, cleanTitle);
        })
        .catch(err => console.error("Auto-naming failed", err));
    } else {
      await addMessage(userText, Role.USER, attachment);
    }

    try {
      if (!sessionPrompts.includes(userText)) {
        setSessionPrompts(prev => [...prev, userText]);
      }

      // Anonymous users don't send history (privacy / quota reasons)
      const historyToSend = user?.isAnonymous ? [] : messages;

      const response = await sendMessage(userText, activeSubject, historyToSend, attachment, socraticMode);

      setAttachment(undefined);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (currentChatId) {
        await addMessage(response, Role.MODEL, undefined, currentChatId);
      }

    } catch (error) {
      console.error("Failed to get response", error);
    }
  };

  /**
   * Keyboard handler for the chat input textarea.
   * Behavior depends on the user's Enter-to-Send preference.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (enterToSend) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    } else {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  return (
    <>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} />
      <RenameModal
        isOpen={renameModalOpen}
        currentName={renameChatTitle}
        onClose={() => setRenameModalOpen(false)}
        onRename={confirmRename}
      />
      <DeleteModal
        isOpen={deleteModalOpen}
        title={deleteChatTitle}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />

      <div className="flex h-screen w-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">

        {/* Desktop Sidebar */}
        {isSidebarOpen && (
          <aside className="w-[260px] flex-shrink-0 h-full bg-zinc-50 border-r border-zinc-200 flex-col z-20 hidden md:flex">
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleNewChat={handleNewChat}
              loadingSessions={loadingSessions}
              chatSessions={chatSessions}
              activeChatId={activeChatId}
              setActiveChatId={setActiveChatId}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              handleRenameChat={handleRenameChat}
              handleDeleteChat={handleDeleteChat}
              user={user}
              handleSignIn={handleSignIn}
              setIsSettingsOpen={setIsSettingsOpen}
              authError={authError}
            />
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full relative z-10">
          {/* Header Bar */}
          <header className="h-16 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-4 flex-shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-20">
            <Header
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              socraticMode={socraticMode}
              setSocraticMode={setSocraticMode}
              user={user}
              handleNewChat={handleNewChat}
            />
          </header>

          {/* Scrollable Chat Messages */}
          <div className="flex-1 overflow-y-auto p-0 scroll-smooth relative">
            <ChatArea
              loadingHistory={loadingHistory}
              messages={messages}
              user={user}
              activeSubject={activeSubject}
              handleEdit={handleEdit}
              handleRegenerate={handleRegenerate}
              isThinking={isThinking}
              statusMessage={statusMessage}
            />
            {/* Mini-map timeline for quick navigation (visible when > 2 messages) */}
            {messages.length > 2 && (
              <ConversationTimeline
                messages={messages}
                onNodeClick={(msgId) => {
                  const el = document.getElementById(`msg-${msgId}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              />
            )}
          </div>

          {/* Fixed Input Area */}
          <div className="flex-shrink-0 p-4 w-full max-w-4xl mx-auto">
            <InputArea
              sessionPrompts={sessionPrompts}
              setInput={setInput}
              activeSubject={activeSubject}
              setActiveSubject={setActiveSubject}
              input={input}
              textareaRef={textareaRef}
              handleKeyDown={handleKeyDown}
              attachment={attachment}
              setAttachment={setAttachment}
              fileInputRef={fileInputRef}
              handleAttachment={handleAttachment}
              handleVoice={handleVoice}
              isListening={isListening}
              handleSubmit={handleSubmit}
              isThinking={isThinking}
              handleFileSelect={handleFileSelect}
              user={user}
              messages={messages}
              socraticMode={socraticMode}
            />
          </div>
        </main>

        {/* Mobile Sidebar (Off-canvas Drawer) */}
        <div className="md:hidden">
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleNewChat={handleNewChat}
            loadingSessions={loadingSessions}
            chatSessions={chatSessions}
            activeChatId={activeChatId}
            setActiveChatId={setActiveChatId}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            handleRenameChat={handleRenameChat}
            handleDeleteChat={handleDeleteChat}
            user={user}
            handleSignIn={handleSignIn}
            setIsSettingsOpen={setIsSettingsOpen}
            authError={authError}
          />
        </div>
      </div>
    </>
  );
}

export default App;