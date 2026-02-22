/**
 * @module PodcastPlayer
 * AI podcast player using Web Speech API for text-to-speech.
 * Simulates two hosts discussing the content with alternating voices.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface PodcastPlayerProps {
    script: string;
    title: string;
    onClose?: () => void;
}

interface PodcastSegment {
    speaker: 'A' | 'B';
    text: string;
}

export const PodcastPlayer: React.FC<PodcastPlayerProps> = ({ script, title, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSegment, setCurrentSegment] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [progress, setProgress] = useState(0);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const segments: PodcastSegment[] = React.useMemo(() => {
        const lines = script.split('\n').filter(l => l.trim());
        const parsed: PodcastSegment[] = [];

        lines.forEach((line, i) => {
            const cleaned = line.replace(/^(Host [AB]|Speaker [AB]|[AB]):\s*/i, '').trim();
            if (cleaned) {
                parsed.push({
                    speaker: i % 2 === 0 ? 'A' : 'B',
                    text: cleaned,
                });
            }
        });

        if (parsed.length === 0) {
            const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
            sentences.forEach((s, i) => {
                if (s.trim()) {
                    parsed.push({
                        speaker: i % 2 === 0 ? 'A' : 'B',
                        text: s.trim(),
                    });
                }
            });
        }

        return parsed;
    }, [script]);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const playSegment = useCallback((index: number) => {
        if (index >= segments.length) {
            setIsPlaying(false);
            setProgress(100);
            return;
        }

        const segment = segments[index];
        setCurrentSegment(index);
        setProgress(Math.round((index / segments.length) * 100));

        const utterance = new SpeechSynthesisUtterance(segment.text);
        utterance.rate = speed;
        utterance.pitch = segment.speaker === 'A' ? 1.0 : 0.85;

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 1) {
            utterance.voice = segment.speaker === 'A' ? voices[0] : voices[1];
        }

        utterance.onend = () => {
            playSegment(index + 1);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [segments, speed]);

    const handlePlay = useCallback(() => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            playSegment(currentSegment);
        }
    }, [isPlaying, currentSegment, playSegment]);

    const handleRestart = useCallback(() => {
        window.speechSynthesis.cancel();
        setCurrentSegment(0);
        setProgress(0);
        setIsPlaying(false);
    }, []);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <span className="material-symbols-outlined text-white text-[24px]">podcasts</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white">{title}</h3>
                        <p className="text-xs text-zinc-500">{segments.length} segments · AI Generated</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800">
                <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {/* Controls */}
            <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={handleRestart} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[20px]">replay</span>
                    </button>
                    <button
                        onClick={handlePlay}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[24px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
                    </button>
                    <button
                        onClick={() => { const nextSpeed = speed >= 2 ? 0.5 : speed + 0.25; setSpeed(nextSpeed); }}
                        className="px-3 py-1 text-xs font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        {speed}x
                    </button>
                </div>
                <span className="text-xs text-zinc-400">Segment {currentSegment + 1} of {segments.length}</span>
            </div>

            {/* Current segment display */}
            <div className="px-6 pb-4 max-h-60 overflow-y-auto">
                {segments.map((seg, i) => (
                    <div
                        key={i}
                        className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-all ${i === currentSegment && isPlaying ? 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800' : ''
                            } ${i < currentSegment ? 'opacity-50' : ''}`}
                    >
                        <span className={`text-xs font-bold shrink-0 mt-1 px-2 py-0.5 rounded-full ${seg.speaker === 'A'
                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                            }`}>
                            Host {seg.speaker}
                        </span>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{seg.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
