/**
 * @module FlashcardDeck
 * Interactive flashcard component with 3D flip animation, navigation,
 * progress tracking, and export functionality.
 */

import React, { useState, useCallback } from 'react';

export interface FlashcardItem {
    front: string;
    back: string;
}

interface FlashcardDeckProps {
    cards: FlashcardItem[];
    title: string;
    onClose?: () => void;
    onExport?: () => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, title, onClose, onExport }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [known, setKnown] = useState<Set<number>>(new Set());
    const [needReview, setNeedReview] = useState<Set<number>>(new Set());
    const [isShuffled, setIsShuffled] = useState(false);
    const [cardOrder, setCardOrder] = useState<number[]>(cards.map((_, i) => i));

    const activeCards = cardOrder;
    const currentCardIndex = activeCards[currentIndex];
    const card = cards[currentCardIndex];
    const progress = ((currentIndex + 1) / activeCards.length) * 100;

    const goNext = useCallback(() => {
        if (currentIndex < activeCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        }
    }, [currentIndex, activeCards.length]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(false);
        }
    }, [currentIndex]);

    const markKnown = useCallback(() => {
        setKnown(prev => new Set(prev).add(currentCardIndex));
        setNeedReview(prev => {
            const n = new Set(prev);
            n.delete(currentCardIndex);
            return n;
        });
        goNext();
    }, [currentCardIndex, goNext]);

    const markNeedReview = useCallback(() => {
        setNeedReview(prev => new Set(prev).add(currentCardIndex));
        setKnown(prev => {
            const n = new Set(prev);
            n.delete(currentCardIndex);
            return n;
        });
        goNext();
    }, [currentCardIndex, goNext]);

    const shuffle = useCallback(() => {
        const shuffled = [...cardOrder].sort(() => Math.random() - 0.5);
        setCardOrder(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsShuffled(true);
    }, [cardOrder]);

    const reset = useCallback(() => {
        setCardOrder(cards.map((_, i) => i));
        setCurrentIndex(0);
        setIsFlipped(false);
        setKnown(new Set());
        setNeedReview(new Set());
        setIsShuffled(false);
    }, [cards]);

    const exportToQuizlet = useCallback(() => {
        const tsv = cards.map(c => `${c.front}\t${c.back}`).join('\n');
        navigator.clipboard.writeText(tsv).then(() => {
            alert('Copied to clipboard! Paste into Quizlet import.');
        }).catch(() => {
            const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.tsv`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }, [cards, title]);

    if (!card) return null;

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h2>
                    <p className="text-sm text-zinc-500">{cards.length} cards · {known.size} known · {needReview.size} to review</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={shuffle} className="p-2 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="Shuffle">
                        <span className="material-symbols-outlined text-[20px]">shuffle</span>
                    </button>
                    <button onClick={reset} className="p-2 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors" title="Reset">
                        <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                    </button>
                    <button onClick={exportToQuizlet} className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Export to Quizlet">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Close">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-6 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Flashcard */}
            <div
                className="relative w-full cursor-pointer select-none"
                style={{ perspective: '1200px' }}
                onClick={() => setIsFlipped(f => !f)}
            >
                <div
                    className="relative w-full transition-transform duration-600 ease-in-out"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transitionDuration: '0.6s',
                    }}
                >
                    {/* Front */}
                    <div
                        className="w-full min-h-[320px] rounded-2xl shadow-xl border-2 border-zinc-200 dark:border-zinc-700 p-8 flex flex-col items-center justify-center"
                        style={{
                            backfaceVisibility: 'hidden',
                            background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)',
                        }}
                    >
                        <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-4">Front</span>
                        <p className="text-xl font-semibold text-zinc-900 dark:text-white text-center leading-relaxed">{card.front}</p>
                        <p className="text-xs text-zinc-400 mt-6 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">touch_app</span>
                            Click to flip
                        </p>
                    </div>

                    {/* Back */}
                    <div
                        className="w-full min-h-[320px] rounded-2xl shadow-xl border-2 border-emerald-200 dark:border-emerald-800 p-8 flex flex-col items-center justify-center absolute top-0 left-0"
                        style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            background: 'linear-gradient(135deg, #11998e10 0%, #38ef7d10 100%)',
                        }}
                    >
                        <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-4">Back</span>
                        <p className="text-lg text-zinc-800 dark:text-zinc-200 text-center leading-relaxed">{card.back}</p>
                        <p className="text-xs text-zinc-400 mt-6 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">touch_app</span>
                            Click to flip back
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation & Mark buttons */}
            <div className="flex items-center justify-between mt-6">
                <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    Previous
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); markNeedReview(); }}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${needReview.has(currentCardIndex)
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/30'
                                : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">flag</span>
                        Review
                    </button>
                    <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {currentIndex + 1} / {activeCards.length}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); markKnown(); }}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${known.has(currentCardIndex)
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30'
                                : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Known
                    </button>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    disabled={currentIndex === activeCards.length - 1}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Next
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
            </div>
        </div>
    );
};
