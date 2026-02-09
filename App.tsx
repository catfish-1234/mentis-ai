import { useState, useRef, useEffect } from 'react';
import { Subject, Role, Attachment } from './types';
import { useChat, useChatList } from './hooks/useFirestore';
import { useAI } from './hooks/useAI';
import { useVoice } from './hooks/useVoice';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { signInWithPopup, signOut, auth, GoogleAuthProvider, onAuthStateChanged, signInAnonymously } from './firebase';

function App() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject>(Subject.MATH); // Defines the "New Chat" subject
  const [input, setInput] = useState('');
  const [user, setUser] = useState<any>(auth.currentUser);
  const [authError, setAuthError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [enterToSend, setEnterToSend] = useState(localStorage.getItem('enterToSend') !== 'false');

  const [sessionPrompts, setSessionPrompts] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Desktop sidebar toggle
  const [searchQuery, setSearchQuery] = useState(''); // Chat search
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // For sidebar menus

  // Listen for storage changes (SettingsModal updates)
  useEffect(() => {
    const handleStorage = () => {
      setEnterToSend(localStorage.getItem('enterToSend') !== 'false');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Custom Hooks
  const { messages, addMessage, createChat, updateMessage, deleteMessage, deleteMessagesAfter, loadingHistory, userId } = useChat(activeChatId);
  const { sessions: chatSessions, loading: loadingSessions, deleteChat, renameChat } = useChatList();
  const { sendMessage, isLoading: isThinking, statusMessage } = useAI();
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoice();

  // Sync Voice Transcript to Input
  useEffect(() => {
    if (transcript) {
      setInput(prev => prev + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u: any) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth).catch((err: any) => {
          console.error("Anonymous auth failed", err);
          if (err.code === 'auth/admin-restricted-operation') {
            // This error usually means Anonymous Auth is disabled in Firebase Console
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

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

      // Subject Restrictions
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
        // Allow images
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

      // Default/Fallback Logic or Error
      alert(`File type not supported for ${activeSubject}. \nCoding: .py, .js, .html\nScience/Math: Images`);
      e.target.value = ''; // Reset input
    }
  };

  const handleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setActiveSubject(Subject.MATH); // Default back to Math or keep current? Keeping current is fine but explicit is safer.
    setIsMobileMenuOpen(false);
  };

  const handleRenameChat = async (id: string) => {
    const newName = prompt("Enter new chat name:");
    if (newName && newName.trim()) {
      await renameChat(id, newName.trim());
    }
    setOpenMenuId(null);
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat?")) {
      await deleteChat(id);
      if (activeChatId === id) setActiveChatId(null);
    }
  };

  const handleEdit = async (msg: any) => {
    // 1. Set Input
    setInput(msg.content);
    // 2. Delete this message and all after it
    await deleteMessagesAfter(msg.timestamp); // This deletes everything strictly AFTER
    await deleteMessage(msg.id);

    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleRegenerate = async () => {
    // Find last user message?
    // Logic: "Remove the last AI message, re-send the request".
    // We assume the last message IS the AI message.
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === Role.MODEL) {
      await deleteMessage(lastMsg.id);
      // Now find the LAST user message
      const lastUserMsg = messages[messages.length - 2]; // Assuming strict alternation
      if (lastUserMsg && lastUserMsg.role === Role.USER) {
        // Re-trigger send logic without adding user message
        const response = await sendMessage(lastUserMsg.content, activeSubject, messages.slice(0, -2), lastUserMsg.attachment);
        await addMessage(response, Role.MODEL);
      }
    }
  };

  // Textarea auto-resize logic
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
    setInput(''); // Clear immediately

    // 1. Handle New Chat Creation if needed
    let currentChatId = activeChatId;
    if (!currentChatId) {
      // Create new chat first
      const newId = await createChat(activeSubject, userText, Role.USER, attachment);
      if (!newId) return; // Error
      currentChatId = newId;
      setActiveChatId(newId);

      // Trigger Background Auto-Naming
      sendMessage(`Summarize this query in 3-5 words for a chat title: "${userText}"`, activeSubject, [])
        .then(title => {
          // Remove quotes if any
          const cleanTitle = title.replace(/^["']|["']$/g, '');
          renameChat(newId, cleanTitle);
        })
        .catch(err => console.error("Auto-naming failed", err));
    } else {
      // Add to existing
      await addMessage(userText, Role.USER, attachment);
    }

    // 2. Call Gemini
    try {
      if (!sessionPrompts.includes(userText)) {
        setSessionPrompts(prev => [...prev, userText]);
      }

      // 3. Call AI with correct history
      const historyToSend = user?.isAnonymous ? [] : messages;

      const response = await sendMessage(userText, activeSubject, historyToSend, attachment);

      // Clear attachment after send
      setAttachment(undefined);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // 3. Persist Response
      if (currentChatId) {
        await addMessage(response, Role.MODEL, undefined, currentChatId);
      }

    } catch (error) {
      console.error("Failed to get response", error);
    }
  };

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

      {/* TASK: RIGID SKELETON LAYOUT */}
      <div className="flex h-screen w-screen bg-white text-zinc-900 font-sans overflow-hidden">

        {/* SIDEBAR: Fixed Width, Light Gray Background */}
        <aside className="w-[260px] flex-shrink-0 h-full bg-zinc-50 border-r border-zinc-200 flex flex-col z-20 hidden md:flex">
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

        {/* MAIN: Flex Grow, White Background */}
        <main className="flex-1 flex flex-col h-full relative z-10">
          {/* Header */}
          <header className="h-14 border-b border-zinc-100 flex items-center px-4 flex-shrink-0">
            <Header
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
            />
          </header>

          {/* Scrollable Chat Area */}
          <div className="flex-1 overflow-y-auto p-0 scroll-smooth">
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
            />
          </div>
        </main>

        {/* Mobile Sidebar (Drawer) */}
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