import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Subject, Message, Role } from '../types';

interface UseGeminiReturn {
  sendMessage: (text: string, subject: Subject, previousMessages: Message[]) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export const useGemini = (): UseGeminiReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string, subject: Subject, previousMessages: Message[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key is not configured (VITE_GEMINI_API_KEY missing).");
      }

      const genAI = new GoogleGenerativeAI(apiKey);

      // Transform internal Message type to Gemini history format
      const history = previousMessages.map(msg => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Use clear model names
      const modelId = "gemini-1.5-flash";

      let systemInstruction = `You are an expert ${subject} tutor.`;
      if ([Subject.MATH, Subject.PHYSICS, Subject.CHEMISTRY].includes(subject)) {
        systemInstruction += ` Use LaTeX for all math equations. Wrap block equations in $$ and inline in $. Provide clear, step-by-step explanations.`;
      }

      const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: systemInstruction
      });

      const chat = model.startChat({
        history: history,
        generationConfig: {
          temperature: 0.7,
        }
      });

      const result = await chat.sendMessage(text);
      const response = await result.response;

      return response.text();

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Failed to communicate with Gemini.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error };
};