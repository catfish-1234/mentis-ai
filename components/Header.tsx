import React from 'react';

interface HeaderProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    socraticMode: boolean;
    setSocraticMode: (mode: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    socraticMode,
    setSocraticMode
}) => {
    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
                <button onClick={() => {
                    if (window.innerWidth < 768) setIsMobileMenuOpen(!isMobileMenuOpen);
                    else setIsSidebarOpen(!isSidebarOpen);
                }} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                    <span className="material-symbols-outlined">menu</span>
                </button>

                {/* Mobile Branding */}
                <div className="md:hidden flex items-center gap-2">
                    <img alt="MentisAI Logo" className="h-8 w-auto object-contain" src="/logo.png" />
                    <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">MentisAI</span>
                </div>

                {/* Desktop Title (Optional, maybe breadcrumbs later) */}
                <div className="hidden md:block font-medium text-zinc-700 dark:text-zinc-200">
                    MentisAI <span className="text-zinc-400 mx-2">/</span> <span className="text-zinc-500 text-sm">Learning Assistant</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Socratic Mode Toggle */}
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full border border-zinc-200 dark:border-zinc-700">
                    <button
                        onClick={() => setSocraticMode(false)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!socraticMode ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                    >
                        Direct
                    </button>
                    <button
                        onClick={() => setSocraticMode(true)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${socraticMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500'}`}
                    >
                        Socratic
                    </button>
                </div>
            </div>
        </div>
    );
};
