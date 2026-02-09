import React from 'react';
import { Subject, Attachment, Message } from '../types';
import { SubjectSelector } from './SubjectSelector';

interface InputAreaProps {
    sessionPrompts: string[];
    setInput: (val: string) => void;
    activeSubject: Subject;
    setActiveSubject: (sub: Subject) => void;
    input: string;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    attachment: Attachment | undefined;
    setAttachment: (att: Attachment | undefined) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleAttachment: () => void;
    handleVoice: () => void;
    isListening: boolean;
    handleSubmit: (e?: React.FormEvent) => void;
    isThinking: boolean;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    user: any;
    messages: Message[];
    socraticMode: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({
    sessionPrompts,
    setInput,
    activeSubject,
    setActiveSubject,
    input,
    textareaRef,
    handleKeyDown,
    attachment,
    setAttachment,
    fileInputRef,
    handleAttachment,
    handleVoice,
    isListening,
    handleSubmit,
    isThinking,
    handleFileSelect,
    user,
    messages,
    socraticMode
}) => {
    return (
        <div className="max-w-3xl mx-auto w-full">
            <div className={`bg-white dark:bg-zinc-900 border rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all duration-200 flex flex-col sm:flex-row overflow-visible relative ${!user?.isAnonymous ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'border-zinc-300 dark:border-zinc-700'}`}>

                {/* REMOVED: Session Prompts Bubbles (User Request) */}

                <SubjectSelector activeSubject={activeSubject} onSelect={setActiveSubject} />

                <div className="flex-1 relative flex items-center">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent border-0 focus:ring-0 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 py-3.5 px-4 resize-none min-h-[52px] max-h-32 text-base leading-relaxed"
                        placeholder="Ask a question..."
                        rows={1}
                    ></textarea>

                    {attachment && (
                        <div className="absolute top-[-40px] left-0 bg-white dark:bg-zinc-800 p-2 rounded shadow flex items-center gap-2 text-xs border border-zinc-200 dark:border-zinc-700">
                            <span className="material-symbols-outlined text-[16px] text-zinc-900 dark:text-zinc-100">
                                {attachment.type === 'image' ? 'image' : 'description'}
                            </span>
                            <span className="truncate max-w-[150px]">{attachment.fileName}</span>
                            <button onClick={() => { setAttachment(undefined); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="hover:text-red-500">
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 px-3 py-2 sm:py-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-700/50 justify-between sm:justify-start bg-zinc-50 dark:bg-zinc-800/50 sm:bg-transparent relative">
                    <div className="relative group">
                        <button className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-full transition-colors" title="AI Tools">
                            <span className="material-symbols-outlined text-[20px]">handyman</span>
                        </button>
                        {/* Hover Dropdown */}
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform origin-bottom-left z-50 overflow-hidden flex flex-col">
                            <button
                                onClick={() => {
                                    if (messages.length === 0) {
                                        alert("Start a conversation first before generating a quiz.");
                                        return;
                                    }
                                    setInput("Create a 5-question multiple choice quiz based on our conversation so far.");
                                    if (textareaRef.current) textareaRef.current.focus();
                                }}
                                className="px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-200 text-sm font-medium flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px] text-zinc-500">quiz</span>
                                Generate Quiz
                            </button>

                            <button
                                onClick={() => {
                                    if (messages.length === 0) {
                                        alert("Start a conversation first.");
                                        return;
                                    }
                                    if (user?.isAnonymous) {
                                        alert("Sign in to unlock Deep Dive!");
                                        return;
                                    }
                                    setInput("Deep Dive: Create a 3-question quiz to test my understanding of the current topic. Do not reveal the answers yet.");
                                    if (textareaRef.current) textareaRef.current.focus();
                                }}
                                className="px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-200 text-sm font-medium flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700"
                            >
                                <span className="material-symbols-outlined text-[18px] text-zinc-500">psychology</span>
                                Deep Dive
                            </button>
                            <button
                                onClick={() => {
                                    if (messages.length === 0) {
                                        alert("Start a conversation first before creating flashcards.");
                                        return;
                                    }
                                    setInput("Summarize the key concepts of this chat into a Markdown table with 'Front' and 'Back' columns for flashcards.");
                                    if (textareaRef.current) textareaRef.current.focus();
                                }}
                                className="px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-200 text-sm font-medium flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700"
                            >
                                <span className="material-symbols-outlined text-[18px] text-zinc-500">style</span>
                                Make Flashcards
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleAttachment}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-full transition-colors tooltip-trigger"
                        title="Attach file"
                    >
                        <span className="material-symbols-outlined text-[20px]">attach_file</span>
                    </button>
                    <button
                        onClick={handleVoice}
                        className={`p-2 rounded-full transition-colors hidden sm:block ${isListening ? 'text-red-500 bg-red-100 animate-pulse' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'}`}
                        title={isListening ? "Stop Listening" : "Voice Input"}
                    >
                        <span className="material-symbols-outlined text-[20px]">{isListening ? 'mic_off' : 'mic'}</span>
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isThinking}
                        className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-black text-white p-2 rounded-lg transition-colors shadow-sm flex items-center justify-center ml-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform">send</span>
                    </button>
                </div>
            </div>
            {/* TASK 3: FIX INPUT - Class hidden is vital */}
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                MentisAI can make mistakes. Consider checking important information.
            </p>
        </div>
    );
};
