/**
 * @module Sidebar
 *
 * Navigation sidebar displaying the user's chat history, grouped by date
 * (Today, Yesterday, Last 7 Days, Older). Also contains:
 *
 * - MentisAI logo/branding (clickable → new chat).
 * - Search input for filtering chats by title or subject.
 * - "New Chat" button.
 * - Per-chat context menu with Rename and Delete options.
 * - User profile footer (sign-in button for anonymous, profile card for signed-in).
 *
 * Rendered in two locations in the DOM:
 * 1. Inside a fixed `<aside>` on desktop (toggle via sidebar button).
 * 2. As a full-screen off-canvas drawer on mobile (toggle via hamburger).
 *
 * Uses a `groupSessionsByDate` helper to bucket sessions by recency.
 */

import React from 'react';
import { Subject, ChatSession } from '../types';

/**
 * Props for the {@link Sidebar} component.
 *
 * @property isSidebarOpen      - Whether the desktop sidebar is visible.
 * @property isMobileMenuOpen   - Whether the mobile drawer is open.
 * @property setIsMobileMenuOpen - Toggle the mobile drawer.
 * @property searchQuery        - Current chat search filter text.
 * @property setSearchQuery     - Update the search filter.
 * @property handleNewChat      - Navigate to the new-chat state.
 * @property loadingSessions    - Whether chat sessions are being fetched.
 * @property chatSessions       - Array of all user chat sessions.
 * @property activeChatId       - Currently selected chat ID.
 * @property setActiveChatId    - Select a chat by ID.
 * @property openMenuId         - ID of the chat whose context menu is open.
 * @property setOpenMenuId      - Open/close a chat's context menu.
 * @property handleRenameChat   - Open the rename modal for a chat.
 * @property handleDeleteChat   - Open the delete modal for a chat.
 * @property user               - Firebase Auth user object.
 * @property handleSignIn       - Trigger Google sign-in.
 * @property setIsSettingsOpen  - Open the settings modal.
 * @property authError          - Error message from auth, if any.
 */
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

/**
 * Groups an array of chat sessions into date-based buckets.
 *
 * @param sessions - The full array of chat sessions to categorize.
 * @returns An object with keys "Today", "Yesterday", "Last 7 Days", "Older",
 *          each containing an array of matching sessions.
 */
const groupSessionsByDate = (sessions: ChatSession[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { [key: string]: ChatSession[] } = {
        'Today': [],
        'Yesterday': [],
        'Last 7 Days': [],
        'Older': []
    };

    sessions.forEach(session => {
        let sessionDate: Date;
        if (session.createdAt && typeof (session.createdAt as any).toDate === 'function') {
            sessionDate = (session.createdAt as any).toDate();
        } else if (session.createdAt instanceof Date) {
            sessionDate = session.createdAt;
        } else {
            sessionDate = new Date(0);
        }

        if (sessionDate.toDateString() === today.toDateString()) {
            groups['Today'].push(session);
        } else if (sessionDate.toDateString() === yesterday.toDateString()) {
            groups['Yesterday'].push(session);
        } else if (sessionDate > lastWeek) {
            groups['Last 7 Days'].push(session);
        } else {
            groups['Older'].push(session);
        }
    });

    return groups;
};

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
    const groupedSessions = groupSessionsByDate(chatSessions);
    const filteredGroups = Object.entries(groupedSessions).filter(([_, sessions]) =>
        sessions.filter(s => (s.title || s.subject).toLowerCase().includes(searchQuery.toLowerCase())).length > 0
    );

    return (
        <div className={`fixed inset-y-0 left-0 z-40 w-full md:w-full flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 transition-transform duration-300 md:translate-x-0 md:static ${isSidebarOpen ? 'md:flex' : 'md:hidden'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex h-full text-zinc-900 dark:text-zinc-100`}>

            {/* Branding header */}
            <div className="p-5 flex items-center justify-between shrink-0 border-b border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    title="Go to Home"
                >
                    <img alt="MentisAI Logo" className="logo-safe h-8 w-auto object-contain" src="/logo.png" />
                    <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">MentisAI</h1>
                </button>
                <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Chat search */}
            <div className="px-4 py-3 shrink-0">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400 text-[18px]">search</span>
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                    />
                </div>
            </div>

            {/* New Chat button */}
            <div className="px-4 pb-3 shrink-0">
                <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl font-medium transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>New Chat</span>
                </button>
            </div>

            {/* Chat history grouped by date */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
                {loadingSessions ? (
                    <div className="text-zinc-500 text-xs px-3 py-4 text-center">
                        <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                        <p className="mt-2">Loading chats...</p>
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="text-zinc-500 text-sm px-3 py-8 text-center">
                        <span className="material-symbols-outlined text-[32px] text-zinc-300 dark:text-zinc-700 mb-2">chat_bubble_outline</span>
                        <p>No chats yet.</p>
                        <p className="text-xs mt-1">Start a conversation!</p>
                    </div>
                ) : (
                    filteredGroups.map(([groupName, sessions]) => {
                        const filteredSessions = sessions.filter(s =>
                            (s.title || s.subject).toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        if (filteredSessions.length === 0) return null;

                        return (
                            <div key={groupName}>
                                <h3 className="px-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    {groupName}
                                </h3>
                                <div className="flex flex-col gap-0.5">
                                    {filteredSessions.map(session => (
                                        <div key={session.id} className="group relative">
                                            <button
                                                onClick={() => { setActiveChatId(session.id); setIsMobileMenuOpen(false); }}
                                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-all text-left ${activeChatId === session.id
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-500'
                                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                                    }`}
                                            >
                                                {/* Subject-specific icon */}
                                                <span className={`material-symbols-outlined text-[18px] ${activeChatId === session.id ? 'text-indigo-500' : 'text-zinc-400'}`}>
                                                    {session.subject === Subject.MATH ? 'calculate' :
                                                        session.subject === Subject.PHYSICS ? 'rocket_launch' :
                                                            session.subject === Subject.CHEMISTRY ? 'science' :
                                                                session.subject === Subject.CODING ? 'code' : 'school'}
                                                </span>
                                                <span className="truncate flex-1">{session.title || session.subject}</span>
                                            </button>

                                            {/* Context menu trigger */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === session.id ? null : session.id); }}
                                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity ${openMenuId === session.id ? 'opacity-100' : ''}`}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                            </button>

                                            {/* Context menu dropdown */}
                                            {openMenuId === session.id && (
                                                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden text-sm">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRenameChat(session.id); }}
                                                        className="w-full text-left px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 flex items-center gap-2 text-zinc-700 dark:text-zinc-200"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                        Rename
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteChat(session.id, e); }}
                                                        className="w-full text-left px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* User profile footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                {!user || user.isAnonymous ? (
                    <button onClick={handleSignIn} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 transition-colors font-medium">
                        <span className="material-symbols-outlined text-[20px]">login</span>
                        <span>Sign In with Google</span>
                    </button>
                ) : (
                    <div
                        className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left group cursor-pointer"
                        onClick={() => setIsSettingsOpen(true)}
                    >
                        <div className="size-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden ring-2 ring-white dark:ring-zinc-800 shadow-sm">
                            {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : user?.displayName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user?.displayName || 'User'}</p>
                            <p className="text-xs text-zinc-500 truncate">{user?.email || 'Signed in'}</p>
                        </div>
                        <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700" title="Settings">
                            <span className="material-symbols-outlined text-[20px]">settings</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Auth error banner */}
            {authError && (
                <div className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 shrink-0">
                    {authError}
                </div>
            )}
        </div>
    );
};
