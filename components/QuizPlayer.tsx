/**
 * @module QuizPlayer
 * Interactive quiz component with button-style answers, auto-grading,
 * progress tracking, and score display.
 */

import React, { useState, useCallback } from 'react';

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

interface QuizPlayerProps {
    questions: QuizQuestion[];
    title: string;
    onComplete?: (score: number, answers: number[]) => void;
    onClose?: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ questions, title, onComplete, onClose }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
    const [showResult, setShowResult] = useState(false);
    const [isAnswered, setIsAnswered] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    const handleAnswer = useCallback((optionIndex: number) => {
        if (isAnswered) return;
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestion] = optionIndex;
        setSelectedAnswers(newAnswers);
        setIsAnswered(true);

        if (optionIndex === question.correctIndex) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 1500);
        }
    }, [isAnswered, selectedAnswers, currentQuestion, question.correctIndex]);

    const goNext = useCallback(() => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setIsAnswered(false);
        } else {
            const score = selectedAnswers.filter((a, i) => a === questions[i].correctIndex).length;
            setShowResult(true);
            onComplete?.(score, selectedAnswers as number[]);
        }
    }, [currentQuestion, questions, selectedAnswers, onComplete]);

    const restart = useCallback(() => {
        setCurrentQuestion(0);
        setSelectedAnswers(new Array(questions.length).fill(null));
        setShowResult(false);
        setIsAnswered(false);
    }, [questions.length]);

    const score = selectedAnswers.filter((a, i) => a === questions[i].correctIndex).length;
    const percentage = Math.round((score / questions.length) * 100);

    const getOptionStyle = (optionIndex: number): string => {
        if (!isAnswered) {
            return 'bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-zinc-800 dark:text-zinc-200 cursor-pointer hover:shadow-md';
        }
        if (optionIndex === question.correctIndex) {
            return 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-lg shadow-emerald-500/10';
        }
        if (optionIndex === selectedAnswers[currentQuestion] && optionIndex !== question.correctIndex) {
            return 'bg-red-50 dark:bg-red-900/30 border-2 border-red-400 text-red-800 dark:text-red-200 shadow-lg shadow-red-500/10';
        }
        return 'bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 opacity-60';
    };

    const getOptionLabel = (index: number): string => {
        return String.fromCharCode(65 + index);
    };

    // Score Result Screen
    if (showResult) {
        return (
            <div className="w-full max-w-2xl mx-auto">
                <div className="text-center py-8">
                    <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full mb-6 ${percentage >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                            percentage >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                'bg-red-100 dark:bg-red-900/30'
                        }`}>
                        <span className={`text-4xl font-bold ${percentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                                percentage >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-red-600 dark:text-red-400'
                            }`}>{percentage}%</span>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        {percentage >= 80 ? '🎉 Excellent!' : percentage >= 60 ? '👍 Good Job!' : '📚 Keep Studying!'}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                        You got {score} out of {questions.length} questions correct
                    </p>

                    {/* Answer breakdown */}
                    <div className="space-y-3 mb-8 text-left">
                        {questions.map((q, i) => (
                            <div key={i} className={`p-4 rounded-xl border-2 ${selectedAnswers[i] === q.correctIndex
                                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                                    : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <span className={`material-symbols-outlined text-[20px] mt-0.5 ${selectedAnswers[i] === q.correctIndex ? 'text-emerald-500' : 'text-red-500'
                                        }`}>
                                        {selectedAnswers[i] === q.correctIndex ? 'check_circle' : 'cancel'}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{q.question}</p>
                                        {selectedAnswers[i] !== q.correctIndex && (
                                            <p className="text-xs text-zinc-500 mt-1">
                                                Correct: <strong>{getOptionLabel(q.correctIndex)}) {q.options[q.correctIndex]}</strong>
                                            </p>
                                        )}
                                        {q.explanation && (
                                            <p className="text-xs text-zinc-400 mt-1 italic">{q.explanation}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={restart}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            <span className="material-symbols-outlined text-[20px]">replay</span>
                            Try Again
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium transition-colors"
                            >
                                Done
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Confetti overlay */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <div className="text-6xl animate-bounce">🎉</div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h2>
                    <p className="text-sm text-zinc-500">Question {currentQuestion + 1} of {questions.length}</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Question */}
            <div className="mb-8">
                <p className="text-lg font-semibold text-zinc-900 dark:text-white leading-relaxed">{question.question}</p>
            </div>

            {/* Answer options */}
            <div className="space-y-3 mb-6">
                {question.options.map((option, i) => (
                    <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        disabled={isAnswered}
                        className={`w-full p-4 rounded-xl text-left transition-all duration-300 flex items-center gap-4 ${getOptionStyle(i)}`}
                    >
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${isAnswered && i === question.correctIndex ? 'bg-emerald-500 text-white' :
                                isAnswered && i === selectedAnswers[currentQuestion] && i !== question.correctIndex ? 'bg-red-500 text-white' :
                                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}>
                            {getOptionLabel(i)}
                        </span>
                        <span className="text-sm font-medium flex-1">{option}</span>
                        {isAnswered && i === question.correctIndex && (
                            <span className="material-symbols-outlined text-emerald-500 text-[22px]">check_circle</span>
                        )}
                        {isAnswered && i === selectedAnswers[currentQuestion] && i !== question.correctIndex && (
                            <span className="material-symbols-outlined text-red-500 text-[22px]">cancel</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Explanation and Next button */}
            {isAnswered && (
                <div className="space-y-4 animate-fade-in-up">
                    {question.explanation && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                            <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                <strong>Explanation:</strong> {question.explanation}
                            </p>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <button
                            onClick={goNext}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
