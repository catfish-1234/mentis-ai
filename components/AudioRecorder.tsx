/**
 * @module AudioRecorder
 * Live audio recording with Web Speech API transcription.
 * Records audio and transcribes in real-time for AI note generation.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface AudioRecorderProps {
    onTranscriptReady: (transcript: string) => void;
    onRecordingStateChange?: (isRecording: boolean) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptReady, onRecordingStateChange }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<any>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (_) { }
            }
        };
    }, []);

    const startRecording = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Speech recognition not supported in this browser. Try Chrome or Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = localStorage.getItem('preferredLanguage') || 'en-US';

        let finalTranscript = '';

        recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setTranscript(finalTranscript + interim);
        };

        recognition.onerror = (event: any) => {
            if (event.error !== 'aborted') {
                setError(`Recognition error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            if (isRecording) {
                try { recognition.start(); } catch (_) { }
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        setDuration(0);
        setError(null);
        onRecordingStateChange?.(true);

        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    }, [isRecording, onRecordingStateChange]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRecording(false);
        onRecordingStateChange?.(false);
    }, [onRecordingStateChange]);

    const handleSubmit = useCallback(() => {
        if (transcript.trim()) {
            onTranscriptReady(transcript.trim());
        }
    }, [transcript, onTranscriptReady]);

    const formatDuration = (seconds: number): string => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-[24px] text-red-500">mic</span>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Audio Recording</h3>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Recording controls */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${isRecording
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 animate-pulse'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                        }`}
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {isRecording ? 'stop' : 'mic'}
                    </span>
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>

                {isRecording && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">{formatDuration(duration)}</span>
                    </div>
                )}
            </div>

            {/* Live transcript */}
            {transcript && (
                <div className="space-y-4">
                    <div className="h-48 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-400">{transcript.split(/\s+/).length} words</p>
                        <button
                            onClick={handleSubmit}
                            disabled={isRecording}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                            Generate Notes from Recording
                        </button>
                    </div>
                </div>
            )}

            {!transcript && !isRecording && (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-4">
                    Click "Start Recording" to begin capturing audio. Your speech will be transcribed in real-time.
                </p>
            )}
        </div>
    );
};
