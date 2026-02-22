/**
 * @module SettingsModal
 *
 * Full-featured settings panel with tabs: General, Profile, Appearance,
 * Language, and Account.
 */

import React, { useState, useEffect } from 'react';
import { auth, signOut, updateProfile } from '../firebase';
import { SUPPORTED_LANGUAGES, getStoredLanguage, setStoredLanguage, LanguageCode } from '../i18n';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

type Tab = 'general' | 'profile' | 'appearance' | 'language' | 'account';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user }) => {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
    const [enterToSend, setEnterToSend] = useState(localStorage.getItem('enterToSend') !== 'false');
    const [directAnswers, setDirectAnswers] = useState(localStorage.getItem('directAnswers') === 'true');
    const [language, setLanguage] = useState<LanguageCode>(getStoredLanguage());

    useEffect(() => {
        localStorage.setItem('enterToSend', String(enterToSend));
        window.dispatchEvent(new Event('storage'));
    }, [enterToSend]);

    useEffect(() => {
        localStorage.setItem('directAnswers', String(directAnswers));
        window.dispatchEvent(new Event('storage'));
    }, [directAnswers]);

    useEffect(() => {
        if (user) setDisplayName(user.displayName || '');
    }, [user]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
        } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleLanguageChange = (code: LanguageCode) => {
        setLanguage(code);
        setStoredLanguage(code);
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsUpdating(true);
        try {
            await updateProfile(user, { displayName });
        } catch (e) {
            console.error(e);
            alert("Failed to update profile");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && user) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (event.target?.result) {
                    try {
                        await updateProfile(user, { photoURL: event.target.result as string });
                    } catch (error) {
                        console.error("Failed to update avatar", error);
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    const tabs: { id: Tab; icon: string; label: string }[] = [
        { id: 'general', icon: 'tune', label: 'General' },
        { id: 'profile', icon: 'person', label: 'Profile' },
        { id: 'appearance', icon: 'palette', label: 'Appearance' },
        { id: 'language', icon: 'translate', label: 'Language' },
        { id: 'account', icon: 'manage_accounts', label: 'Account' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Settings</h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-48 bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-zinc-950">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">Chat Preferences</h3>
                                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-4">
                                        <div>
                                            <div className="font-medium text-zinc-900 dark:text-white">Press Enter to Send</div>
                                            <div className="text-sm text-zinc-500">
                                                {enterToSend ? 'Enter sends, Shift+Enter new line' : 'Enter new line, Ctrl+Enter sends'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setEnterToSend(!enterToSend)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enterToSend ? 'bg-zinc-900' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enterToSend ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <div>
                                            <div className="font-medium text-zinc-900 dark:text-white">Direct Answers</div>
                                            <div className="text-sm text-zinc-500">
                                                {directAnswers ? 'Get straight answers instantly' : 'Socratic mode: Guides you step-by-step'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setDirectAnswers(!directAnswers)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${directAnswers ? 'bg-zinc-900' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${directAnswers ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative group cursor-pointer">
                                        <div className="size-20 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 text-2xl font-bold border-2 border-zinc-200 overflow-hidden">
                                            {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : 'ME'}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="material-symbols-outlined text-white">edit</span>
                                        </div>
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAvatarChange} accept="image/*" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{user?.displayName || 'Guest User'}</h3>
                                        <p className="text-zinc-500 text-sm">{user?.email || 'No email linked'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 outline-none transition-all"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={handleSaveProfile} disabled={isUpdating} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                                        {isUpdating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">Theme Preference</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button onClick={() => setTheme('light')} className={`border-2 rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-zinc-900 bg-zinc-100 text-zinc-900' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'}`}>
                                            <span className="material-symbols-outlined text-3xl">light_mode</span>
                                            <span className="text-sm font-medium">Light</span>
                                        </button>
                                        <button onClick={() => setTheme('dark')} className={`border-2 rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-zinc-900 bg-zinc-100 text-zinc-900' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'}`}>
                                            <span className="material-symbols-outlined text-3xl">dark_mode</span>
                                            <span className="text-sm font-medium">Dark</span>
                                        </button>
                                        <button onClick={() => setTheme('system')} className={`border-2 rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'border-zinc-900 bg-zinc-100 text-zinc-900' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'}`}>
                                            <span className="material-symbols-outlined text-3xl">contrast</span>
                                            <span className="text-sm font-medium">System</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'language' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">AI Response Language</h3>
                                    <p className="text-sm text-zinc-500 mb-4">Choose the language the AI will use to respond to your questions.</p>
                                    <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <button
                                                key={lang.code}
                                                onClick={() => handleLanguageChange(lang.code)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${language === lang.code
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-500 shadow-sm'
                                                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                    }`}
                                            >
                                                {language === lang.code && (
                                                    <span className="material-symbols-outlined text-[18px] text-indigo-500">check_circle</span>
                                                )}
                                                <span>{lang.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <h4 className="text-red-700 dark:text-red-400 font-medium mb-2">Danger Zone</h4>
                                    <p className="text-red-600/80 dark:text-red-400/80 text-sm mb-4">Sign out of your account on this device.</p>
                                    <button onClick={() => { signOut(auth); onClose(); }} className="px-4 py-2 bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-800 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
