/**
 * @module useAI
 *
 * Custom React hook for AI provider communication. Implements a hybrid
 * architecture: Groq (LLaMA 3.3 70B) primary, Gemini fallback.
 * Supports Direct, Socratic, and Reasoning modes.
 * Includes multi-language support via i18n.
 */

import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { Subject, Message, Role } from '../types';
import { getStoredLanguage, getLanguageInstruction } from '../i18n';

interface UseAIReturn {
    sendMessage: (text: string, subject: Subject, previousMessages: Message[], attachment?: { content: string, type: 'image' | 'text', mimeType?: string }, socraticMode?: boolean, reasoningMode?: boolean) => Promise<string>;
    isLoading: boolean;
    error: string | null;
    statusMessage: string | null;
}

export const useAI = (): UseAIReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const sendMessage = useCallback(async (text: string, subject: Subject, previousMessages: Message[], attachment?: { content: string, type: 'image' | 'text', mimeType?: string }, socraticMode: boolean = false, reasoningMode: boolean = false) => {
        setIsLoading(true);
        setStatusMessage(reasoningMode ? "Reasoning deeply..." : "Thinking...");
        setError(null);

        try {
            const language = getStoredLanguage();
            const langInstruction = getLanguageInstruction(language);

            let basePrompt = `You are an expert Tutor specialized in ${subject}. IMPORTANT: Always use proper grammar, spelling, and formatting. Never use typos.`;

            if (reasoningMode) {
                basePrompt += `

MODE: Deep Reasoning
- Think through the problem step by step before answering.
- Wrap your internal reasoning in <thinking> tags.
- After your reasoning, provide a clear, well-structured final answer.
- Show mathematical derivations, logical deductions, and analytical steps.
- Consider edge cases and alternative approaches.
- Be thorough but organized in your reasoning.
- Format: <thinking>your step-by-step reasoning here</thinking> followed by the final answer.`;
            } else if (socraticMode) {
                basePrompt += `

MODE: Socratic Tutor
- NEVER give the answer directly unless the student has tried and explicitly asks for it.
- Guide the student through leading questions to help them discover the answer.
- Identify where the student is struggling and ask probing questions about that specific area.
- Be patient, encouraging, and supportive.
- After the student understands, offer to create practice problems for the areas they struggled with.
- Start by asking what they already know about the topic.
- If they're stuck, give small hints instead of answers.`;
            } else {
                basePrompt += `

MODE: Direct Answer
- Provide the answer immediately with a clear, concise explanation.
- Show your work/reasoning step by step.
- Be efficient and to the point.
- Use examples when helpful.`;
            }

            if (subject === Subject.MATH) basePrompt += " Use LaTeX for math equations.";
            if (subject === Subject.CODING) basePrompt += " Provide clean, commented code snippets.";

            basePrompt += langInstruction;

            const systemInstruction = basePrompt;

            const history = previousMessages.map(msg => ({
                role: msg.role === Role.USER ? "user" : "model",
                parts: [{ text: msg.content + (msg.attachment ? `\n[Attachment: ${msg.attachment.fileName}]` : "") }]
            }));

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

                const imagePart = {
                    inlineData: {
                        data: attachment.content.split(',')[1],
                        mimeType: attachment.mimeType || "image/jpeg"
                    }
                };

                const chat = model.startChat({ history });
                const result = await chat.sendMessage([text, imagePart]);
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
                    temperature: reasoningMode ? 0.3 : 0.7,
                    max_tokens: reasoningMode ? 2048 : 1024,
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
