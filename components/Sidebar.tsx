import React from 'react';
import { Subject, ChatSession } from '../types';

interface SidebarProps {
    isSidebarOpen: boolean;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleNewChat: () => void;
    loadingSessions: boolean;
    chatSessions: ChatSession[];
    activeChatId: string | null;
    setActiveChatId: (id: string | null) => void;
    openMenuId: string | null;
    setOpenMenuId: (id: string | null) => void;
    handleRenameChat: (id: string) => void;
    handleDeleteChat: (id: string, e: React.MouseEvent) => void;
    user: any;
    handleSignIn: () => void;
    setIsSettingsOpen: (open: boolean) => void;
    authError: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isSidebarOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    searchQuery,
    setSearchQuery,
    handleNewChat,
    loadingSessions,
    chatSessions,
    activeChatId,
    setActiveChatId,
    openMenuId,
    setOpenMenuId,
    handleRenameChat,
    handleDeleteChat,
    user,
    handleSignIn,
    setIsSettingsOpen,
    authError
}) => {
    return (
        <div className={`fixed inset-y-0 left-0 z-40 w-full md:w-full flex-col border-r border-zinc-200 bg-zinc-50 transition-transform duration-300 md:translate-x-0 md:static ${isSidebarOpen ? 'md:flex' : 'md:hidden'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex h-full text-zinc-900`}>
            <div className="p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    {/* TASK 2: FORCE LOGO SIZING */}
                    <img alt="MentisAI Logo" className="logo-safe h-8 w-auto object-contain" src="/logo.png" />
                    <h1 className="text-xl font-bold tracking-tight text-zinc-900">MentisAI</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-zinc-500">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            <div className="px-4 pb-2 shrink-0">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400 text-[18px]">search</span>
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 placeholder-zinc-400"
                    />
                </div>
            </div>

            <div className="px-4 pb-4 shrink-0">
                <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 px-4 rounded-lg font-medium transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>New Chat</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
                <div>
                    <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">My Chats</h3>
                    <div className="flex flex-col gap-1">
                        {loadingSessions ? (
                            <div className="text-zinc-500 text-xs px-3">Loading...</div>
                        ) : chatSessions.length === 0 ? (
                            <div className="text-zinc-500 text-xs px-3">No chats yet.</div>
                        ) : (
                            chatSessions
                                .filter(s => (s.title || s.subject).toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(session => (
                                    <div key={session.id} className="group relative">
                                        <button
                                            onClick={() => { setActiveChatId(session.id); setIsMobileMenuOpen(false); }}
                                            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg font-medium text-sm transition-colors text-left border ${activeChatId === session.id ? 'bg-zinc-200 text-zinc-900 border-zinc-300' : 'text-zinc-700 hover:bg-zinc-200 border-transparent'}`}
                                        >
                                            <span className={`material-symbols-outlined text-[20px] ${activeChatId === session.id ? 'text-zinc-900' : 'text-zinc-500'}`}>
                                                {session.subject === Subject.MATH ? 'calculate' :
                                                    session.subject === Subject.PHYSICS ? 'science' :
                                                        session.subject === Subject.CHEMISTRY ? 'biotech' :
                                                            session.subject === Subject.CODING ? 'code' : 'school'}
                                            </span>
                                            <span className="truncate flex-1">{session.title || session.subject}</span>
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === session.id ? null : session.id); }}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 opacity-0 group-hover:opacity-100 ${openMenuId === session.id ? 'opacity-100' : ''}`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                        </button>

                                        {openMenuId === session.id && (
                                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-zinc-200 z-50 overflow-hidden text-sm">
                                                <button onClick={(e) => { e.stopPropagation(); handleRenameChat(session.id); }} className="w-full text-left px-3 py-2 hover:bg-zinc-100 block text-zinc-800">Rename</button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(session.id, e); }} className="w-full text-left px-3 py-2 hover:bg-zinc-100 text-red-500 block">Delete</button>
                                            </div>
                                        )}
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-zinc-200 shrink-0">
                {!user || user.isAnonymous ? (
                    <button onClick={handleSignIn} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-colors font-medium">
                        <span>Sign In</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-zinc-200 transition-colors text-left group relative cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
                        <div className="size-8 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-xs border border-zinc-600 overflow-hidden">
                            {user?.photoURL ? <img src={user.photoURL} alt="User" /> : 'ME'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">{user?.displayName || 'User'}</p>
                        </div>
                        <button className="text-zinc-500 hover:text-zinc-900 transition-colors p-1" title="Settings">
                            <span className="material-symbols-outlined text-[20px]">settings</span>
                        </button>
                    </div>
                )}
            </div>

            {authError && (
                <div className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 shrink-0">
                    {authError}
                </div>
            )}
        </div>
    );
};
