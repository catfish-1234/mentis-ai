/**
 * @module ToolsPage
 * Dedicated page for AI study tools — shows saved quizzes and flashcard decks
 * with the ability to create new ones and interact with existing ones.
 */

import React, { useState, useCallback } from 'react';
import { useStudyTools, FlashcardItem, QuizQuestion } from '../hooks/useStudyTools';
import { useAI } from '../hooks/useAI';
import { FlashcardDeck } from '../components/FlashcardDeck';
import { QuizPlayer } from '../components/QuizPlayer';
import { Subject } from '../types';
import { SEO } from '../components/SEO';

type ToolView = 'list' | 'flashcards' | 'quiz' | 'create-flashcards' | 'create-quiz';

export const ToolsPage: React.FC = () => {
    const { flashcardDecks, quizResults, loading, saveFlashcardDeck, saveQuiz, updateQuizResult, deleteFlashcardDeck, deleteQuiz } = useStudyTools();
    const { sendMessage, isLoading: aiLoading } = useAI();

    const [view, setView] = useState<ToolView>('list');
    const [activeFlashcards, setActiveFlashcards] = useState<{ title: string; cards: FlashcardItem[] } | null>(null);
    const [activeQuiz, setActiveQuiz] = useState<{ id: string; title: string; questions: QuizQuestion[] } | null>(null);
    const [createTopic, setCreateTopic] = useState('');
    const [createType, setCreateType] = useState<'flashcards' | 'quiz'>('flashcards');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleCreateFlashcards = useCallback(async () => {
        if (!createTopic.trim()) return;
        setIsGenerating(true);

        try {
            const prompt = `Create exactly 10 flashcards about: "${createTopic}".
You MUST respond with ONLY valid JSON, no other text. Use this exact format:
{"title":"${createTopic}","cards":[{"front":"term or question","back":"definition or answer"}]}
Make 10 cards. No markdown, no code fences, just raw JSON.`;

            const response = await sendMessage(prompt, Subject.GENERAL, []);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.cards && Array.isArray(parsed.cards)) {
                    await saveFlashcardDeck(parsed.title || createTopic, parsed.cards);
                    setActiveFlashcards({ title: parsed.title || createTopic, cards: parsed.cards });
                    setView('flashcards');
                    setCreateTopic('');
                }
            }
        } catch (e) {
            console.error('Error generating flashcards:', e);
            alert('Failed to generate flashcards. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    }, [createTopic, sendMessage, saveFlashcardDeck]);

    const handleCreateQuiz = useCallback(async () => {
        if (!createTopic.trim()) return;
        setIsGenerating(true);

        try {
            const prompt = `Create a 5-question multiple choice quiz about: "${createTopic}".
You MUST respond with ONLY valid JSON, no other text. Use this exact format:
{"title":"Quiz: ${createTopic}","questions":[{"question":"question text","options":["A","B","C","D"],"correctIndex":0,"explanation":"why this is correct"}]}
correctIndex is 0-based. Make exactly 5 questions with 4 options each. No markdown, no code fences, just raw JSON.`;

            const response = await sendMessage(prompt, Subject.GENERAL, []);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.questions && Array.isArray(parsed.questions)) {
                    const quizId = await saveQuiz(parsed.title || `Quiz: ${createTopic}`, parsed.questions);
                    if (quizId) {
                        setActiveQuiz({ id: quizId, title: parsed.title || `Quiz: ${createTopic}`, questions: parsed.questions });
                        setView('quiz');
                        setCreateTopic('');
                    }
                }
            }
        } catch (e) {
            console.error('Error generating quiz:', e);
            alert('Failed to generate quiz. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    }, [createTopic, sendMessage, saveQuiz]);

    if (view === 'flashcards' && activeFlashcards) {
        return (
            <div className="flex-1 overflow-y-auto p-6">
                <SEO title={`Flashcards: ${activeFlashcards.title}`} description={`Review flashcards for ${activeFlashcards.title} on MentisAI.`} />
                <FlashcardDeck
                    title={activeFlashcards.title}
                    cards={activeFlashcards.cards}
                    onClose={() => { setView('list'); setActiveFlashcards(null); }}
                />
            </div>
        );
    }

    if (view === 'quiz' && activeQuiz) {
        return (
            <div className="flex-1 overflow-y-auto p-6">
                <SEO title={`Quiz: ${activeQuiz.title}`} description={`Take the quiz for ${activeQuiz.title} on MentisAI.`} />
                <QuizPlayer
                    title={activeQuiz.title}
                    questions={activeQuiz.questions}
                    onComplete={(score, answers) => {
                        updateQuizResult(activeQuiz.id, score, answers);
                    }}
                    onClose={() => { setView('list'); setActiveQuiz(null); }}
                />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <SEO title="AI Study Tools" description="Create and review flashcards, quizzes, and other AI study tools with MentisAI." />
            <div className="max-w-4xl mx-auto">
                {/* Page header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">AI Study Tools</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Create and review flashcards, quizzes, and more</p>
                </div>

                {/* Create new section */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">add_circle</span>
                        Create New
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={createTopic}
                            onChange={e => setCreateTopic(e.target.value)}
                            placeholder="Enter a topic (e.g., Photosynthesis, World War II, Python basics)"
                            className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            onKeyDown={e => { if (e.key === 'Enter') { createType === 'flashcards' ? handleCreateFlashcards() : handleCreateQuiz(); } }}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setCreateType('flashcards'); handleCreateFlashcards(); }}
                                disabled={!createTopic.trim() || isGenerating}
                                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/10"
                            >
                                {isGenerating && createType === 'flashcards' ? (
                                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">style</span>
                                )}
                                Flashcards
                            </button>
                            <button
                                onClick={() => { setCreateType('quiz'); handleCreateQuiz(); }}
                                disabled={!createTopic.trim() || isGenerating}
                                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/10"
                            >
                                {isGenerating && createType === 'quiz' ? (
                                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">quiz</span>
                                )}
                                Quiz
                            </button>
                        </div>
                    </div>
                </div>

                {/* Flashcard decks */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500">style</span>
                        Flashcard Decks ({flashcardDecks.length})
                    </h2>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <span className="material-symbols-outlined text-[24px] animate-spin text-zinc-400">progress_activity</span>
                        </div>
                    ) : flashcardDecks.length === 0 ? (
                        <div className="text-center py-8 text-zinc-400">
                            <span className="material-symbols-outlined text-[48px] text-zinc-300 dark:text-zinc-700 mb-2 block">style</span>
                            <p className="text-sm">No flashcard decks yet. Create one above!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {flashcardDecks.map(deck => (
                                <div
                                    key={deck.id}
                                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
                                    onClick={() => {
                                        setActiveFlashcards({ title: deck.title, cards: deck.cards });
                                        setView('flashcards');
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{deck.title}</h3>
                                            <p className="text-xs text-zinc-500 mt-1">{deck.cards.length} cards</p>
                                            <p className="text-xs text-zinc-400 mt-0.5">{new Date(deck.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteFlashcardDeck(deck.id); }}
                                            className="p-1 text-zinc-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quizzes */}
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">quiz</span>
                        Quizzes ({quizResults.length})
                    </h2>
                    {quizResults.length === 0 ? (
                        <div className="text-center py-8 text-zinc-400">
                            <span className="material-symbols-outlined text-[48px] text-zinc-300 dark:text-zinc-700 mb-2 block">quiz</span>
                            <p className="text-sm">No quizzes yet. Create one above!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {quizResults.map(quiz => (
                                <div
                                    key={quiz.id}
                                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
                                    onClick={() => {
                                        setActiveQuiz({ id: quiz.id, title: quiz.title, questions: quiz.questions });
                                        setView('quiz');
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{quiz.title}</h3>
                                            <p className="text-xs text-zinc-500 mt-1">{quiz.totalQuestions} questions</p>
                                            {quiz.score !== undefined && (
                                                <p className={`text-xs font-medium mt-1 ${(quiz.score / quiz.totalQuestions) >= 0.8 ? 'text-emerald-500' :
                                                    (quiz.score / quiz.totalQuestions) >= 0.6 ? 'text-yellow-500' : 'text-red-500'
                                                    }`}>
                                                    Score: {quiz.score}/{quiz.totalQuestions} ({Math.round((quiz.score / quiz.totalQuestions) * 100)}%)
                                                </p>
                                            )}
                                            <p className="text-xs text-zinc-400 mt-0.5">{new Date(quiz.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteQuiz(quiz.id); }}
                                            className="p-1 text-zinc-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
