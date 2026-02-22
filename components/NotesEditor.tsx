/**
 * @module NotesEditor
 * Rich notes display with formatted AI-generated content and action buttons
 * to branch into chat, create quizzes, flashcards, or generate a podcast.
 */

import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface NotesEditorProps {
    title: string;
    content: string;
    sourceType: string;
    onCreateQuiz?: () => void;
    onCreateFlashcards?: () => void;
    onGeneratePodcast?: () => void;
    onBranchToChat?: () => void;
    onClose?: () => void;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
    title,
    content,
    sourceType,
    onCreateQuiz,
    onCreateFlashcards,
    onGeneratePodcast,
    onBranchToChat,
    onClose,
}) => {
    const sourceIcons: Record<string, string> = {
        audio: 'mic',
        pdf: 'picture_as_pdf',
        youtube: 'play_circle',
        slideshow: 'slideshow',
        text: 'text_fields',
        chat: 'chat',
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            alert('Notes copied to clipboard!');
        } catch (e) {
            console.error('Copy failed:', e);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[24px] text-indigo-500">
                        {sourceIcons[sourceType] || 'description'}
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
                        <p className="text-xs text-zinc-500 capitalize">From {sourceType}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCopy} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Copy notes">
                        <span className="material-symbols-outlined text-[20px]">content_copy</span>
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="prose prose-zinc dark:prose-invert max-w-none text-sm leading-7">
                    <MarkdownRenderer content={content} />
                </div>
            </div>

            {/* Action buttons */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Actions</p>
                <div className="flex flex-wrap gap-2">
                    {onCreateQuiz && (
                        <button onClick={onCreateQuiz} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-medium transition-colors border border-indigo-200 dark:border-indigo-800">
                            <span className="material-symbols-outlined text-[18px]">quiz</span>
                            Create Quiz
                        </button>
                    )}
                    {onCreateFlashcards && (
                        <button onClick={onCreateFlashcards} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium transition-colors border border-emerald-200 dark:border-emerald-800">
                            <span className="material-symbols-outlined text-[18px]">style</span>
                            Create Flashcards
                        </button>
                    )}
                    {onGeneratePodcast && (
                        <button onClick={onGeneratePodcast} className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl text-sm font-medium transition-colors border border-violet-200 dark:border-violet-800">
                            <span className="material-symbols-outlined text-[18px]">podcasts</span>
                            Generate Podcast
                        </button>
                    )}
                    {onBranchToChat && (
                        <button onClick={onBranchToChat} className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-medium transition-colors border border-amber-200 dark:border-amber-800">
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            Branch to Chat
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
