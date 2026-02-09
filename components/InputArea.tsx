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
    const isSignedIn = user && !user.isAnonymous;

    return (
        <div className="max-w-3xl mx-auto w-full">
            <div className={`bg-white dark:bg-zinc-900 border rounded-2xl shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition-all duration-200 flex flex-col sm:flex-row overflow-visible relative ${isSignedIn ? 'border-indigo-500/40 shadow-indigo-500/10' : 'border-zinc-200 dark:border-zinc-700'}`}>

                <SubjectSelector activeSubject={activeSubject} onSelect={setActiveSubject} />

                <div className="flex-1 relative flex items-center">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent border-0 focus:ring-0 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 py-3.5 px-4 resize-none min-h-[52px] max-h-32 text-base leading-relaxed"
                        placeholder="Ask me anything..."
                        rows={1}
                    ></textarea>

                    {attachment && (
                        <div className="absolute top-[-40px] left-4 bg-white dark:bg-zinc-800 p-2 rounded-lg shadow-md flex items-center gap-2 text-xs border border-zinc-200 dark:border-zinc-700">
                            <span className="material-symbols-outlined text-[16px] text-indigo-500">
                                {attachment.type === 'image' ? 'image' : 'description'}
                            </span>
                            <span className="truncate max-w-[150px] text-zinc-700 dark:text-zinc-300">{attachment.fileName}</span>
                            <button onClick={() => { setAttachment(undefined); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-zinc-400 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 px-3 py-2 sm:py-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-700/50 justify-end sm:justify-start bg-zinc-50/50 dark:bg-zinc-800/30 sm:bg-transparent">
                    {/* AI Tools - Only show for signed-in users */}
                    {isSignedIn && (
                        <div className="relative group">
                            <button className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="AI Tools">
                                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                            </button>
                            {/* Hover Dropdown */}
                            <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform origin-bottom-left z-50 overflow-hidden">
                                <div className="p-2 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
                                    <p className="text-xs font-medium text-zinc-500 px-2">AI Learning Tools</p>
                                    <div className="relative group/help">
                                        <span className="material-symbols-outlined text-[16px] text-zinc-400 hover:text-indigo-500 cursor-help">help</span>
                                        <div className="absolute right-0 bottom-full mb-2 w-64 bg-zinc-900 text-white text-xs p-3 rounded-lg shadow-lg invisible group-hover/help:visible opacity-0 group-hover/help:opacity-100 transition-all z-50">
                                            <p className="font-semibold mb-2">What are AI Tools?</p>
                                            <ul className="space-y-1 text-zinc-300">
                                                <li><b>Quiz:</b> Generate multiple-choice questions from your chat</li>
                                                <li><b>Deep Dive:</b> Test deeper understanding with harder questions</li>
                                                <li><b>Flashcards:</b> Create study cards you can export to Quizlet</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            if (messages.length === 0) {
                                                alert("Start a conversation first.");
                                                return;
                                            }
                                            setInput(`Generate a 5-question multiple choice quiz based on our conversation. Format each question as:

Question 1: [Question text]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
Answer: [Correct letter]

After all questions, provide an answer key.`);
                                            if (textareaRef.current) textareaRef.current.focus();
                                        }}
                                        className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-200 text-sm font-medium flex items-center gap-3 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-indigo-500">quiz</span>
                                        <div>
                                            <div>Generate Quiz</div>
                                            <div className="text-xs text-zinc-400 font-normal">5 multiple choice questions</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (messages.length === 0) {
                                                alert("Start a conversation first.");
                                                return;
                                            }
                                            setInput(`Deep Dive: Create 3 challenging questions that test deeper understanding of the concepts we discussed. These should require critical thinking, not just recall. Don't reveal answers until I respond.`);
                                            if (textareaRef.current) textareaRef.current.focus();
                                        }}
                                        className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-200 text-sm font-medium flex items-center gap-3 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-violet-500">psychology</span>
                                        <div>
                                            <div>Deep Dive</div>
                                            <div className="text-xs text-zinc-400 font-normal">Advanced critical thinking</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (messages.length === 0) {
                                                alert("Start a conversation first.");
                                                return;
                                            }
                                            setInput(`Create flashcards from our conversation. Format them in a table with two columns:
| Front (Term/Question) | Back (Definition/Answer) |
|----------------------|-------------------------|

Make at least 10 flashcards covering the key concepts. This format can be copied to Quizlet.`);
                                            if (textareaRef.current) textareaRef.current.focus();
                                        }}
                                        className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-200 text-sm font-medium flex items-center gap-3 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-emerald-500">style</span>
                                        <div>
                                            <div>Make Flashcards</div>
                                            <div className="text-xs text-zinc-400 font-normal">Export to Quizlet format</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleAttachment}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-lg transition-colors"
                        title="Attach file"
                    >
                        <span className="material-symbols-outlined text-[20px]">attach_file</span>
                    </button>
                    <button
                        onClick={handleVoice}
                        className={`p-2 rounded-lg transition-colors hidden sm:flex ${isListening ? 'text-red-500 bg-red-100 dark:bg-red-900/30 animate-pulse' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'}`}
                        title={isListening ? "Stop Listening" : "Voice Input"}
                    >
                        <span className="material-symbols-outlined text-[20px]">{isListening ? 'mic_off' : 'mic'}</span>
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isThinking}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center ml-1 group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform">send</span>
                    </button>
                </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-3">
                MentisAI can make mistakes. Please verify important information.
            </p>
        </div>
    );
};
