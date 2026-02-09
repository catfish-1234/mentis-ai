import React from 'react';

interface HeaderProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarOpen,
    setIsSidebarOpen
}) => {
    return (
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50 z-20 text-zinc-900 shrink-0 h-16 w-full">
            <div className="flex items-center gap-3">
                <button onClick={() => {
                    if (window.innerWidth < 768) setIsMobileMenuOpen(!isMobileMenuOpen);
                    else setIsSidebarOpen(!isSidebarOpen);
                }} className="p-2 rounded-lg hover:bg-zinc-200 text-zinc-600">
                    <span className="material-symbols-outlined">menu</span>
                </button>

                <div className="md:hidden flex items-center gap-2">
                    {/* TASK TYPE: FORCE LOGO SIZING */}
                    <img alt="MentisAI Logo" className="logo-safe h-8 w-auto object-contain" src="/logo.png" />
                    <span className="font-bold text-lg text-zinc-900">MentisAI</span>
                </div>
            </div>
        </header>
    );
};
