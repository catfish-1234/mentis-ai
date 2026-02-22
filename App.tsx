/**
 * @module App
 *
 * Root application component for MentisAI. Orchestrates the entire UI with
 * React Router for multi-page navigation (Chat, AI Tools, Notes Hub).
 * Auth-gated sidebar: anonymous users see only a floating sign-in button;
 * signed-in users get the full sidebar with navigation and chat history.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import { ToolsPage } from './pages/ToolsPage';
import { NotesHubPage } from './pages/NotesHubPage';
import { signInWithPopup, signOut, auth, GoogleAuthProvider, onAuthStateChanged, signInAnonymously } from './firebase';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const [socraticMode, setSocraticMode] = useState(false);
  const [reasoningMode, setReasoningMode] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      setEnterToSend(localStorage.getItem('enterToSend') !== 'false');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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

  const { messages, addMessage, createChat, updateMessage, deleteMessage, deleteMessagesAfter, loadingHistory, userId } = useChat(activeChatId);
  const { sessions: chatSessions, loading: loadingSessions, deleteChat, renameChat } = useChatList();
  const { sendMessage, isLoading: isThinking, statusMessage } = useAI();
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoice();

  useEffect(() => {
    if (transcript) {
      setInput(prev => prev + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u: any) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth).catch((err: any) => {
          console.error("Anonymous auth failed", err);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const isSignedIn = user && !user.isAnonymous;

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

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
          setAttachment({ content: textInfo, type: 'text', fileName, mimeType: fileType });
          return;
        }
      }

      if ([Subject.MATH, Subject.PHYSICS, Subject.CHEMISTRY, Subject.BIOLOGY].includes(activeSubject)) {
        if (fileType.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setAttachment({ content: event.target.result as string, type: 'image', fileName, mimeType: fileType });
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

  const handleVoice = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setActiveSubject(Subject.MATH);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const handleRenameChat = (id: string) => {
    const session = chatSessions.find(s => s.id === id);
    setRenameChatId(id);
    setRenameChatTitle(session?.title || session?.subject || '');
    setRenameModalOpen(true);
    setOpenMenuId(null);
  };

  const confirmRename = async (newName: string) => {
    if (renameChatId && newName.trim()) {
      await renameChat(renameChatId, newName.trim());
    }
    setRenameModalOpen(false);
    setRenameChatId(null);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const session = chatSessions.find(s => s.id === id);
    setDeleteChatId(id);
    setDeleteChatTitle(session?.title || session?.subject || '');
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const confirmDelete = async () => {
    if (deleteChatId) {
      await deleteChat(deleteChatId);
      if (activeChatId === deleteChatId) setActiveChatId(null);
    }
    setDeleteModalOpen(false);
    setDeleteChatId(null);
  };

  const handleEdit = async (msg: any) => {
    setInput(msg.content);
    await deleteMessagesAfter(msg.timestamp);
    await deleteMessage(msg.id);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleRegenerate = async () => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === Role.MODEL) {
      await deleteMessage(lastMsg.id);
      const lastUserMsg = messages[messages.length - 2];
      if (lastUserMsg && lastUserMsg.role === Role.USER) {
        const response = await sendMessage(lastUserMsg.content, activeSubject, messages.slice(0, -2), lastUserMsg.attachment, socraticMode, reasoningMode);
        await addMessage(response, Role.MODEL);
      }
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      if (input === '') textareaRef.current.style.height = '52px';
    }
  }, [input]);

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

      const historyToSend = user?.isAnonymous ? [] : messages;
      const response = await sendMessage(userText, activeSubject, historyToSend, attachment, socraticMode, reasoningMode);

      setAttachment(undefined);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (currentChatId) {
        await addMessage(response, Role.MODEL, undefined, currentChatId);
      }
    } catch (error) {
      console.error("Failed to get response", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (enterToSend) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    } else {
      if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSubmit(); }
    }
  };

  const isChatRoute = location.pathname === '/';

  return (
    <>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} />
      <RenameModal isOpen={renameModalOpen} currentName={renameChatTitle} onClose={() => setRenameModalOpen(false)} onRename={confirmRename} />
      <DeleteModal isOpen={deleteModalOpen} title={deleteChatTitle} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} />

      <div className="flex h-screen w-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">

        {/* Floating sign-in button for anonymous users */}
        {!isSignedIn && (
          <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30">
            <button
              onClick={handleSignIn}
              className="flex flex-col items-center gap-2 px-3 py-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl shadow-xl transition-all hover:shadow-2xl hover:scale-105 group"
              title="Sign in with Google"
            >
              <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">login</span>
              <span className="text-[10px] font-bold tracking-wide uppercase">Sign In</span>
            </button>
          </div>
        )}

        {/* Desktop Sidebar — signed-in users only */}
        {isSignedIn && isSidebarOpen && (
          <aside className="w-[260px] flex-shrink-0 h-full bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col z-20 hidden md:flex">
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
              reasoningMode={reasoningMode}
              setReasoningMode={setReasoningMode}
              user={user}
              handleNewChat={handleNewChat}
              isSignedIn={isSignedIn}
            />
          </header>

          {/* Routes */}
          <Routes>
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/notes" element={<NotesHubPage />} />
            <Route path="*" element={
              <>
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
              </>
            } />
          </Routes>
        </main>

        {/* Mobile Sidebar — signed-in users only */}
        {isSignedIn && (
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
        )}
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;