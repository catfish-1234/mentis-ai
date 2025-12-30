import React, { useState } from 'react';
import { auth, signOut } from '../firebase';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

type Tab = 'profile' | 'appearance' | 'account';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user }) => {
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-48 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 p-4 space-y-2">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">person</span>
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">palette</span>
                            Appearance
                        </button>
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                            Account
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="size-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold border-2 border-indigo-200 overflow-hidden">
                                        {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : 'ME'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{user?.displayName || 'Guest User'}</h3>
                                        <p className="text-slate-500 text-sm">{user?.email || 'No email linked'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                                    <input type="text" defaultValue={user?.displayName} disabled className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Theme Preference</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button className="border-2 border-primary rounded-xl p-4 flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-800 transition-all">
                                            <span className="material-symbols-outlined text-primary text-3xl">light_mode</span>
                                            <span className="text-sm font-medium">Light</span>
                                        </button>
                                        <button className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500">
                                            <span className="material-symbols-outlined text-3xl">dark_mode</span>
                                            <span className="text-sm font-medium">Dark</span>
                                        </button>
                                        <button className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500">
                                            <span className="material-symbols-outlined text-3xl">contrast</span>
                                            <span className="text-sm font-medium">System</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <h4 className="text-red-700 dark:text-red-400 font-medium mb-2">Danger Zone</h4>
                                    <p className="text-red-600/80 dark:text-red-400/80 text-sm mb-4">Sign out of your account on this device.</p>
                                    <button onClick={() => { signOut(auth); onClose(); }} className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
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
