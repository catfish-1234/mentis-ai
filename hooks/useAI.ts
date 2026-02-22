/**
 * @module useAI
 *
 * Custom React hook that encapsulates all AI provider logic for MentisAI.
 * Implements a hybrid architecture: Groq (LLaMA 3.3 70B) is the primary
 * provider for text-only queries, with Google Gemini as the fallback.
 * Image-bearing queries always route to Gemini Vision.
 *
 * The hook manages loading state, status messages (e.g. "Thinking…",
 * "Analyzing image…"), and error handling across both providers.
 *
 * Depends on environment variables:
 *  - `VITE_GROQ_API_KEY`   — Groq Cloud API key.
 *  - `VITE_GEMINI_API_KEY` — Google Gemini API key.
 */

import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { Subject, Message, Role } from '../types';

/**
 * Shape of the value returned by {@link useAI}.
 *
 * @property sendMessage   - Sends a user message to the AI and returns the text response.
 * @property isLoading     - `true` while an AI request is in flight.
 * @property error         - Human-readable error message, or `null`.
 * @property statusMessage - Transient UI status (e.g. "Thinking…"), or `null`.
 */
interface UseAIReturn {
    sendMessage: (text: string, subject: Subject, previousMessages: Message[], attachment?: { content: string, type: 'image' | 'text', mimeType?: string }, socraticMode?: boolean) => Promise<string>;
    isLoading: boolean;
    error: string | null;
    statusMessage: string | null;
}

/**
 * Hook that provides a `sendMessage` function for communicating with
 * the AI backend. Handles provider selection, prompt construction,
 * Socratic/Direct mode switching, and automatic Groq → Gemini fallback.
 *
 * @returns {UseAIReturn} AI communication interface.
 *
 * @example
 * ```tsx
 * const { sendMessage, isLoading } = useAI();
 * const reply = await sendMessage("What is gravity?", Subject.PHYSICS, []);
 * ```
 */
export const useAI = (): UseAIReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    /**
     * Sends a message to the AI and returns the generated response text.
     *
     * @param text             - The user's input text.
     * @param subject          - Active academic subject (affects system prompt).
     * @param previousMessages - Conversation history for context.
     * @param attachment       - Optional file attachment (image or text).
     * @param socraticMode     - When `true`, the AI guides the student via questions
     *                           instead of giving direct answers.
     * @returns The AI-generated response string.
     *
     * @throws Catches all errors internally; returns an error string on failure.
     */
    const sendMessage = useCallback(async (text: string, subject: Subject, previousMessages: Message[], attachment?: { content: string, type: 'image' | 'text', mimeType?: string }, socraticMode: boolean = false) => {
        setIsLoading(true);
        setStatusMessage("Thinking...");
        setError(null);

        try {
            const directMode = localStorage.getItem('directAnswers') === 'true';
            const isSocratic = socraticMode;

            // Build the system prompt based on subject and teaching mode
            let basePrompt = `You are an expert Tutor specialized in ${subject}. IMPORTANT: Always use proper grammar, spelling, and formatting. Never use typos.`;
            if (!isSocratic) {
                basePrompt += `

MODE: Direct Answer
- Provide the answer immediately with a clear, concise explanation.
- Show your work/reasoning step by step.
- Be efficient and to the point.
- Use examples when helpful.`;
            } else {
                basePrompt += `

MODE: Socratic Tutor
- NEVER give the answer directly unless the student has tried and explicitly asks for it.
- Guide the student through leading questions to help them discover the answer.
- Identify where the student is struggling and ask probing questions about that specific area.
- Be patient, encouraging, and supportive.
- After the student understands, offer to create practice problems for the areas they struggled with.
- Start by asking what they already know about the topic.
- If they're stuck, give small hints instead of answers.`;
            }

            // Append subject-specific formatting instructions
            if (subject === Subject.MATH) basePrompt += " Use LaTeX for math equations.";
            if (subject === Subject.CODING) basePrompt += " Provide clean, commented code snippets.";

            const systemInstruction = basePrompt;

            // Format conversation history for Gemini's chat API
            const history = previousMessages.map(msg => ({
                role: msg.role === Role.USER ? "user" : "model",
                parts: [{ text: msg.content + (msg.attachment ? `\n[Attachment: ${msg.attachment.fileName}]` : "") }]
            }));

            // Format conversation history for Groq's OpenAI-compatible API
            const messagesForAI = [
                { role: "system", content: systemInstruction },
                ...previousMessages.map(msg => ({
                    role: msg.role === Role.USER ? "user" : "assistant",
                    content: msg.content + (msg.attachment?.type === 'text' ? `\n[File]: ${msg.attachment.content}` : '')
                })),
                { role: "user", content: text + (attachment?.type === 'text' ? `\n[File]: ${attachment.content}` : '') }
            ];

            // Route 1: Image attachments always use Gemini Vision
            if (attachment?.type === 'image') {
                setStatusMessage("Analyzing image...");
                const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    systemInstruction: systemInstruction
                });

                const prompt = text;
                const imagePart = {
                    inlineData: {
                        data: attachment.content.split(',')[1],
                        mimeType: attachment.mimeType || "image/jpeg"
                    }
                };

                const chat = model.startChat({
                    history: history,
                });

                const result = await chat.sendMessage([prompt, imagePart]);
                return result.response.text();
            }

            // Route 2: Text-only — try Groq first, fall back to Gemini
            try {
                const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
                if (!groqApiKey) throw new Error("Groq API Key missing");

                const groq = new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true });

                const completion = await groq.chat.completions.create({
                    messages: messagesForAI as any,
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.7,
                    max_tokens: 1024,
                });

                const response = completion.choices[0]?.message?.content;
                if (!response) throw new Error("Empty response from Groq");
                return response;

            } catch (groqError: any) {
                console.warn("Groq failed, falling back to Gemini", groqError);
                setStatusMessage("Using backup model...");

                const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    systemInstruction: systemInstruction
                });

                const chat = model.startChat({ history });
                const result = await chat.sendMessage(text + (attachment?.type === 'text' ? `\n\nFile Content:\n${attachment.content}` : ''));
                return result.response.text();
            }

        } catch (error: any) {
            console.error("AI Error:", error);
            setError(error.message || "I'm having trouble connecting right now. Please try again.");
            return "Error: Unable to process request.";
        } finally {
            setIsLoading(false);
            setStatusMessage(null);
        }
    }, []);

    return { sendMessage, isLoading, error, statusMessage };
};
