import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { Subject, Message, Role } from '../types';

interface UseAIReturn {
    sendMessage: (text: string, subject: Subject, previousMessages: Message[], attachment?: { content: string, type: 'image' | 'text', mimeType?: string }) => Promise<string>;
    isLoading: boolean;
    error: string | null;
    statusMessage: string | null;
}

export const useAI = (): UseAIReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const sendMessage = useCallback(async (text: string, subject: Subject, previousMessages: Message[], attachment?: { content: string, type: 'image' | 'text', mimeType?: string }) => {
        setIsLoading(true);
        setStatusMessage("Thinking...");
        setError(null);

        try {
            // Check Settings for Mode
            const directMode = localStorage.getItem('directAnswers') === 'true';

            // Construct System Prompt
            let basePrompt = `You are an expert Socratic Tutor specialized in ${subject}. `;
            if (directMode) {
                basePrompt += `You are a direct tutor. Provide the answer immediately with a concise explanation. Do not beat around the bush.`;
            } else {
                basePrompt += `Do NOT give the answer immediately. Guide the user step-by-step with leading questions to help them solve it themselves. Only provide the full answer if the user explicitly asks for it. Be patient and encouraging.`;
            }

            // Subject Specifics
            if (subject === Subject.MATH) basePrompt += " Use LaTeX for math equations.";
            if (subject === Subject.CODING) basePrompt += " Provide clean, commented code snippets.";

            const systemInstruction = basePrompt;

            const history = previousMessages.map(msg => ({
                role: msg.role === Role.USER ? "user" : "model",
                parts: [{ text: msg.content + (msg.attachment ? `\n[Attachment: ${msg.attachment.fileName}]` : "") }]
            }));

            // Groq Messages Format
            const messagesForAI = [
                { role: "system", content: systemInstruction },
                ...previousMessages.map(msg => ({
                    role: msg.role === Role.USER ? "user" : "assistant",
                    content: msg.content + (msg.attachment?.type === 'text' ? `\n[File]: ${msg.attachment.content}` : '')
                })),
                { role: "user", content: text + (attachment?.type === 'text' ? `\n[File]: ${attachment.content}` : '') }
            ];

            // 1. Check for Image (Gemini Vision)
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

            // 2. Text Only (Groq with Fallback)
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

