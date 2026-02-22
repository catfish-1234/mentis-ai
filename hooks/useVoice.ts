/**
 * @module useVoice
 *
 * Custom React hook providing browser-native speech-to-text input via the
 * Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
 *
 * Manages the recognition lifecycle (start/stop/error) and accumulates
 * finalized transcript segments. The parent component should consume and
 * clear the transcript via `resetTranscript()` after appending it to
 * the chat input.
 *
 * @remarks
 * - Only supported in Chromium-based browsers and Safari.
 * - Recognition is configured for continuous, interim-results mode in `en-US`.
 * - On mobile, voice input is hidden from the UI due to limited support.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Shape of the value returned by {@link useVoice}.
 *
 * @property isListening     - `true` while the microphone is actively recording.
 * @property transcript      - Accumulated finalized speech text since last reset.
 * @property startListening  - Begin capturing speech.
 * @property stopListening   - Stop capturing speech.
 * @property resetTranscript - Clear the accumulated transcript.
 * @property error           - Error string from the Speech API, or `null`.
 */
interface UseVoiceReturn {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    error: string | null;
}

/**
 * Provides speech-to-text functionality for the chat input.
 *
 * @returns {UseVoiceReturn} Speech recognition controls and state.
 *
 * @example
 * ```tsx
 * const { isListening, transcript, startListening, stopListening } = useVoice();
 * ```
 */
export const useVoice = (): UseVoiceReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    /** Persistent reference to the SpeechRecognition instance. */
    const recognitionRef = useRef<any>(null);

    /** Initialize the SpeechRecognition engine on mount. */
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setError(null);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setError(event.error);
                setIsListening(false);
            };

            /** Accumulate only finalized transcripts (ignore interim). */
            recognitionRef.current.onresult = (event: any) => {
                let finalTrans = '';
                let interimTrans = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTrans += event.results[i][0].transcript;
                    } else {
                        interimTrans += event.results[i][0].transcript;
                    }
                }

                if (finalTrans) {
                    setTranscript(prev => prev + finalTrans + ' ');
                }
            };
        } else {
            setError("Web Speech API not supported in this browser.");
        }
    }, []);

    /** Start the speech recognition session. No-op if already listening. */
    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Failed to start", e);
            }
        }
    }, [isListening]);

    /** Stop the active speech recognition session. */
    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    /** Clear the accumulated transcript text. */
    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return { isListening, transcript, startListening, stopListening, resetTranscript, error };
};
