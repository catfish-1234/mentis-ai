/**
 * @module Header
 *
 * Top navigation bar for MentisAI. Contains the sidebar toggle button,
 * branding (logo + app name), and the Socratic/Direct mode toggle switch.
 *
 * The mode toggle is only visible to authenticated (non-anonymous) users.
 * Anonymous users see a prompt to sign in for advanced features.
 *
 * Responsive: shows compact mobile branding on small screens and a
 * breadcrumb-style label on desktop.
 */

import React from 'react';

/**
 * Props for the {@link Header} component.
 *
 * @property isMobileMenuOpen    - Whether the mobile sidebar drawer is open.
 * @property setIsMobileMenuOpen - Toggle the mobile sidebar drawer.
 * @property isSidebarOpen       - Whether the desktop sidebar is visible.
 * @property setIsSidebarOpen    - Toggle the desktop sidebar.
 * @property socraticMode        - Whether Socratic tutoring mode is active.
 * @property setSocraticMode     - Toggle Socratic mode on/off.
 * @property user                - Firebase Auth user object.
 * @property handleNewChat       - Callback to navigate to the new-chat state.
 */
interface HeaderProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    socraticMode: boolean;
    setSocraticMode: (mode: boolean) => void;
    user: any;
    handleNewChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    socraticMode,
    setSocraticMode,
    user,
    handleNewChat
}) => {
    const isSignedIn = user && !user.isAnonymous;

    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
                {/* Sidebar toggle — opens mobile drawer on small screens, toggles sidebar on desktop */}
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
                {/* Socratic / Direct mode toggle — authenticated users only */}
                {isSignedIn ? (
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full border border-zinc-200 dark:border-zinc-700">
                        <button
                            onClick={() => setSocraticMode(false)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!socraticMode ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            Direct
                        </button>
                        <button
                            onClick={() => setSocraticMode(true)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${socraticMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            Socratic
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
