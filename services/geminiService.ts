/**
 * @module geminiService
 *
 * Stateless service layer for communicating with the Google Gemini API.
 * This module is used as a standalone alternative to the hybrid
 * {@link useAI} hook — primarily for server-side or non-React contexts.
 *
 * Selects between `gemini-3-pro-preview` (for math, physics, coding) and
 * `gemini-3-flash-preview` (for all other subjects) based on complexity.
 *
 * Depends on `process.env.API_KEY`, which is injected by Vite at build
 * time from `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY`.
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Subject } from "../types";

/** Gemini client initialized with the build-time API key. */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Generates a subject-specific system instruction for the Gemini model.
 * Includes formatting directives (e.g. LaTeX for STEM subjects, code
 * snippets for coding).
 *
 * @param subject - The user's selected academic subject.
 * @returns A system instruction string to guide AI behavior.
 */
const getSystemInstruction = (subject: Subject): string => {
  const baseInstruction = `You are a helpful, expert tutor specializing in ${subject}.`;

  if (subject === Subject.MATH || subject === Subject.PHYSICS || subject === Subject.CHEMISTRY) {
    return `${baseInstruction} 
    - CRITICAL: You MUST use LaTeX formatting for all mathematical equations, formulas, and symbols.
    - Wrap block equations in double dollar signs: $$ ... $$
    - Wrap inline equations in single dollar signs: $ ... $
    - Explain concepts step-by-step.
    - If the user makes a mistake, gently correct them.`;
  }

  if (subject === Subject.CODING) {
    return `${baseInstruction} Provide clean, well-commented code snippets. Explain the logic behind the code.`;
  }

  return `${baseInstruction} Be concise and clear.`;
};

/**
 * Sends a prompt to the Gemini API within a chat session and returns
 * the model's text response.
 *
 * @param prompt  - The user's input text for this turn.
 * @param subject - Active subject; determines model selection and system prompt.
 * @param history - Previous conversation turns formatted as Gemini expects
 *                  (`{ role, parts: [{ text }] }`).
 * @returns The generated text response, or an error message string.
 *
 * @example
 * ```ts
 * const reply = await generateTutorResponse("Explain Newton's 2nd Law", Subject.PHYSICS, []);
 * ```
 */
export const generateTutorResponse = async (
  prompt: string,
  subject: Subject,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API_KEY is missing in environment variables.";
  }

  try {
    const modelId = (subject === Subject.MATH || subject === Subject.PHYSICS || subject === Subject.CODING)
      ? 'gemini-3-pro-preview'
      : 'gemini-3-flash-preview';

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: getSystemInstruction(subject),
      },
      history: history
    });

    const result: GenerateContentResponse = await chat.sendMessage({ message: prompt });
    return result.text || "I couldn't generate a response.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
};