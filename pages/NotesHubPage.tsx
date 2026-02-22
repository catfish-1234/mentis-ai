/**
 * @module NotesHubPage
 * Study notes hub with audio recording, PDF/YouTube/slideshow import,
 * AI note generation, podcast creation, and quiz/flashcard branching.
 */

import React, { useState, useCallback } from 'react';
import { useNotes, NoteSourceType } from '../hooks/useNotes';
import { useStudyTools, FlashcardItem, QuizQuestion } from '../hooks/useStudyTools';
import { useAI } from '../hooks/useAI';
import { Subject } from '../types';
import { SEO } from '../components/SEO';
import { AudioRecorder } from '../components/AudioRecorder';
import { ContentImporter } from '../components/ContentImporter';
import { NotesEditor } from '../components/NotesEditor';
import { PodcastPlayer } from '../components/PodcastPlayer';
import { FlashcardDeck } from '../components/FlashcardDeck';
import { QuizPlayer } from '../components/QuizPlayer';

type HubView = 'list' | 'create' | 'view-note' | 'podcast' | 'flashcards' | 'quiz';

export const NotesHubPage: React.FC = () => {
    const { notes, loading, saveNote, deleteNote } = useNotes();
    const { saveFlashcardDeck, saveQuiz, updateQuizResult } = useStudyTools();
    const { sendMessage, isLoading: aiLoading } = useAI();

    const [view, setView] = useState<HubView>('list');
    const [activeNote, setActiveNote] = useState<{ id: string; title: string; content: string; sourceType: string } | null>(null);
    const [podcastScript, setPodcastScript] = useState<string | null>(null);
    const [activeFlashcards, setActiveFlashcards] = useState<{ title: string; cards: FlashcardItem[] } | null>(null);
    const [activeQuiz, setActiveQuiz] = useState<{ id: string; title: string; questions: QuizQuestion[] } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingStatus, setGeneratingStatus] = useState('');

    const handleContentReady = useCallback(async (content: string, sourceType: NoteSourceType, sourceUrl?: string) => {
        setIsGenerating(true);
        setGeneratingStatus('Generating notes...');

        try {
            const prompt = `Create comprehensive, well-formatted study notes from the following content. Use markdown with headers, bullet points, bold key terms, and clear organization. Include a summary at the end.

Content:
${content}`;

            const response = await sendMessage(prompt, Subject.GENERAL, []);
            const titlePrompt = `Summarize in 3-5 words for a title: "${content.slice(0, 200)}"`;
            const title = await sendMessage(titlePrompt, Subject.GENERAL, []);
            const cleanTitle = title.replace(/^["']|["']$/g, '').slice(0, 60);

            await saveNote(cleanTitle, response, sourceType, sourceUrl);
            setActiveNote({ id: '', title: cleanTitle, content: response, sourceType });
            setView('view-note');
        } catch (e) {
            console.error('Error generating notes:', e);
            alert('Failed to generate notes. Please try again.');
        } finally {
            setIsGenerating(false);
            setGeneratingStatus('');
        }
    }, [sendMessage, saveNote]);

    const handleCreatePodcast = useCallback(async () => {
        if (!activeNote) return;
        setIsGenerating(true);
        setGeneratingStatus('Creating podcast script...');

        try {
            const prompt = `Create an engaging educational podcast script from these notes. Two hosts (Host A and Host B) should discuss the content. Each host should speak 2-3 sentences per turn. Make it conversational, informative, and engaging. Format each line as "Host A: ..." or "Host B: ...".

Notes:
${activeNote.content}`;

            const script = await sendMessage(prompt, Subject.GENERAL, []);
            setPodcastScript(script);
            setView('podcast');
        } catch (e) {
            console.error('Error creating podcast:', e);
        } finally {
            setIsGenerating(false);
            setGeneratingStatus('');
        }
    }, [activeNote, sendMessage]);

    const handleCreateFlashcards = useCallback(async () => {
        if (!activeNote) return;
        setIsGenerating(true);
        setGeneratingStatus('Creating flashcards...');

        try {
            const prompt = `Create exactly 10 flashcards from these notes.
You MUST respond with ONLY valid JSON, no other text. Use this exact format:
{"title":"${activeNote.title}","cards":[{"front":"term or question","back":"definition or answer"}]}
No markdown, no code fences, just raw JSON.

Notes:
${activeNote.content}`;

            const response = await sendMessage(prompt, Subject.GENERAL, []);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.cards) {
                    await saveFlashcardDeck(parsed.title || activeNote.title, parsed.cards, 'notes');
                    setActiveFlashcards({ title: parsed.title || activeNote.title, cards: parsed.cards });
                    setView('flashcards');
                }
            }
        } catch (e) {
            console.error('Error creating flashcards:', e);
        } finally {
            setIsGenerating(false);
            setGeneratingStatus('');
        }
    }, [activeNote, sendMessage, saveFlashcardDeck]);

    const handleCreateQuiz = useCallback(async () => {
        if (!activeNote) return;
        setIsGenerating(true);
        setGeneratingStatus('Creating quiz...');

        try {
            const prompt = `Create a 5-question multiple choice quiz from these notes.
You MUST respond with ONLY valid JSON, no other text. Use this exact format:
{"title":"Quiz: ${activeNote.title}","questions":[{"question":"question text","options":["A","B","C","D"],"correctIndex":0,"explanation":"why this is correct"}]}
correctIndex is 0-based. Make exactly 5 questions. No markdown, no code fences, just raw JSON.

Notes:
${activeNote.content}`;

            const response = await sendMessage(prompt, Subject.GENERAL, []);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.questions) {
                    const quizId = await saveQuiz(parsed.title || `Quiz: ${activeNote.title}`, parsed.questions);
                    if (quizId) {
                        setActiveQuiz({ id: quizId, title: parsed.title, questions: parsed.questions });
                        setView('quiz');
                    }
                }
            }
        } catch (e) {
            console.error('Error creating quiz:', e);
        } finally {
            setIsGenerating(false);
            setGeneratingStatus('');
        }
    }, [activeNote, sendMessage, saveQuiz]);

    // Sub-views
    if (view === 'flashcards' && activeFlashcards) {
        return (
            <div className="flex-1 overflow-y-auto p-6">
                <SEO title={`Flashcards: ${activeFlashcards.title}`} description={`Review flashcards for ${activeFlashcards.title} on MentisAI.`} />
                <FlashcardDeck
                    title={activeFlashcards.title}
                    cards={activeFlashcards.cards}
                    onClose={() => setView(activeNote ? 'view-note' : 'list')}
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
                    onComplete={(score, answers) => updateQuizResult(activeQuiz.id, score, answers)}
                    onClose={() => setView(activeNote ? 'view-note' : 'list')}
                />
            </div>
        );
    }

    if (view === 'podcast' && podcastScript) {
        return (
            <div className="flex-1 overflow-y-auto p-6">
                <SEO title="Podcast Player" description="Listen to AI-generated educational podcasts on MentisAI." />
                <div className="max-w-3xl mx-auto">
                    <PodcastPlayer
                        title={activeNote?.title || 'AI Podcast'}
                        script={podcastScript}
                        onClose={() => setView('view-note')}
                    />
                </div>
            </div>
        );
    }

    if (view === 'view-note' && activeNote) {
        return (
            <div className="flex-1 overflow-y-auto p-6">
                <SEO title={activeNote.title} description={`Read notes about ${activeNote.title} on MentisAI.`} />
                <div className="max-w-3xl mx-auto">
                    <button onClick={() => { setView('list'); setActiveNote(null); }} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Back to Notes
                    </button>
                    <NotesEditor
                        title={activeNote.title}
                        content={activeNote.content}
                        sourceType={activeNote.sourceType}
                        onCreateQuiz={handleCreateQuiz}
                        onCreateFlashcards={handleCreateFlashcards}
                        onGeneratePodcast={handleCreatePodcast}
                    />
                    {isGenerating && (
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 flex items-center gap-3 shadow-2xl">
                                <span className="material-symbols-outlined text-[24px] animate-spin text-indigo-500">progress_activity</span>
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{generatingStatus}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'create') {
        return (
            <div className="flex-1 overflow-y-auto p-6">
                <SEO title="Create Notes" description="Create AI-powered notes by uploading audio, PDFs, or YouTube links." />
                <div className="max-w-3xl mx-auto">
                    <button onClick={() => setView('list')} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Back to Notes
                    </button>

                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Create Notes</h1>

                    <div className="space-y-6">
                        <AudioRecorder onTranscriptReady={(t) => handleContentReady(t, 'audio')} />
                        <ContentImporter onContentReady={handleContentReady} />
                    </div>

                    {isGenerating && (
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 flex items-center gap-3 shadow-2xl">
                                <span className="material-symbols-outlined text-[24px] animate-spin text-indigo-500">progress_activity</span>
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{generatingStatus}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Main list view
    return (
        <div className="flex-1 overflow-y-auto p-6">
            <SEO title="Notes Hub" description="Create AI-powered notes from audio, PDFs, YouTube, and more with MentisAI." />
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Notes Hub</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">Create AI-powered notes from audio, PDFs, YouTube, and more</p>
                    </div>
                    <button
                        onClick={() => setView('create')}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        New Notes
                    </button>
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: 'mic', label: 'Audio Recording', color: 'red', desc: 'Record & transcribe' },
                        { icon: 'picture_as_pdf', label: 'PDF Import', color: 'orange', desc: 'Extract from docs' },
                        { icon: 'play_circle', label: 'YouTube', color: 'red', desc: 'Video to notes' },
                        { icon: 'slideshow', label: 'Slideshows', color: 'blue', desc: 'Slides to notes' },
                    ].map(f => (
                        <button key={f.label} onClick={() => setView('create')} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 text-center hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group">
                            <span className={`material-symbols-outlined text-[32px] text-${f.color}-500 mb-2 block group-hover:scale-110 transition-transform`}>{f.icon}</span>
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">{f.label}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{f.desc}</p>
                        </button>
                    ))}
                </div>

                {/* Notes list */}
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500">description</span>
                    Your Notes ({notes.length})
                </h2>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <span className="material-symbols-outlined text-[24px] animate-spin text-zinc-400">progress_activity</span>
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                        <span className="material-symbols-outlined text-[64px] text-zinc-300 dark:text-zinc-700 mb-3 block">note_stack</span>
                        <p className="text-sm mb-4">No notes yet. Create your first AI-powered notes!</p>
                        <button onClick={() => setView('create')} className="text-indigo-500 hover:text-indigo-600 text-sm font-medium">
                            Get Started →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.map(note => {
                            const sourceIcons: Record<string, string> = {
                                audio: 'mic', pdf: 'picture_as_pdf', youtube: 'play_circle',
                                slideshow: 'slideshow', text: 'text_fields', chat: 'chat'
                            };
                            return (
                                <div
                                    key={note.id}
                                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
                                    onClick={() => {
                                        setActiveNote({ id: note.id, title: note.title, content: note.content, sourceType: note.sourceType });
                                        setView('view-note');
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <span className="material-symbols-outlined text-[20px] text-indigo-500 mt-0.5">
                                                {sourceIcons[note.sourceType] || 'description'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{note.title}</h3>
                                                <p className="text-xs text-zinc-500 mt-1 capitalize">{note.sourceType}</p>
                                                <p className="text-xs text-zinc-400 mt-0.5">{new Date(note.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                            className="p-1 text-zinc-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-3 line-clamp-2">{note.content.slice(0, 120)}...</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
