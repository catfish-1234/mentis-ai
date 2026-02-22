/**
 * @module Header
 *
 * Top navigation bar with sidebar toggle, branding, and three-mode toggle
 * (Direct / Socratic / Reasoning). Only shows mode toggle for signed-in users.
 */

import React from 'react';

interface HeaderProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    socraticMode: boolean;
    setSocraticMode: (mode: boolean) => void;
    reasoningMode: boolean;
    setReasoningMode: (mode: boolean) => void;
    user: any;
    handleNewChat: () => void;
    isSignedIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    socraticMode,
    setSocraticMode,
    reasoningMode,
    setReasoningMode,
    user,
    handleNewChat,
    isSignedIn
}) => {
    const setMode = (mode: 'direct' | 'socratic' | 'reasoning') => {
        setSocraticMode(mode === 'socratic');
        setReasoningMode(mode === 'reasoning');
    };

    const activeMode = reasoningMode ? 'reasoning' : socraticMode ? 'socratic' : 'direct';

    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
                <button onClick={() => {
                    if (window.innerWidth < 768) setIsMobileMenuOpen(!isMobileMenuOpen);
                    else setIsSidebarOpen(!isSidebarOpen);
                }} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                    <span className="material-symbols-outlined">{isSidebarOpen ? 'menu_open' : 'menu'}</span>
                </button>

                {/* Mobile branding */}
                <button
                    onClick={handleNewChat}
                    className="md:hidden flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <img alt="MentisAI Logo" className="h-7 w-auto object-contain" src="/logo.png" />
                    <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">MentisAI</span>
                </button>

                {/* Desktop breadcrumb */}
                <button
                    onClick={handleNewChat}
                    className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">MentisAI</span>
                    <span className="text-zinc-300 dark:text-zinc-600">/</span>
                    <span className="text-zinc-500 text-sm">Learning Assistant</span>
                </button>
            </div>

            <div className="flex items-center gap-3">
                {/* Three-mode toggle — authenticated users only */}
                {isSignedIn ? (
                    <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full border border-zinc-200 dark:border-zinc-700">
                        <button
                            onClick={() => setMode('direct')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeMode === 'direct'
                                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            Direct
                        </button>
                        <button
                            onClick={() => setMode('socratic')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeMode === 'socratic'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            Socratic
                        </button>
                        <button
                            onClick={() => setMode('reasoning')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeMode === 'reasoning'
                                    ? 'bg-violet-600 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                            title="Chain-of-thought reasoning mode"
                        >
                            <span className="hidden sm:inline">Reasoning</span>
                            <span className="sm:hidden">🧠</span>
                        </button>
                    </div>
                ) : (
                    <div className="text-xs text-zinc-400 hidden sm:block">
                        Sign in for advanced features
                    </div>
                )}
            </div>
        </div>
    );
};
