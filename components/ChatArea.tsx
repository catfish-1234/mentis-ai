/**
 * @module ChatArea
 *
 * Displays the main conversation thread between the user and the AI tutor.
 * Handles three visual states:
 * 1. Loading spinner while chat history is being fetched.
 * 2. Empty-state welcome message when no messages exist.
 * 3. Scrollable list of {@link ChatBubble} components with a thinking indicator.
 *
 * Auto-scrolls to the latest message whenever the message list changes
 * or the AI is actively generating a response.
 */

import React, { useEffect, useRef } from 'react';
import { Message, Role, Subject } from '../types';
import { ChatBubble } from './ChatBubble';

/**
 * Props for the {@link ChatArea} component.
 *
 * @property loadingHistory  - Whether the initial message history is loading.
 * @property messages        - The ordered list of chat messages to display.
 * @property user            - Firebase Auth user object (used for greeting).
 * @property activeSubject   - Current academic subject (shown in welcome text).
 * @property handleEdit      - Callback when the user clicks "Edit" on their message.
 * @property handleRegenerate - Callback to re-generate the last AI response.
 * @property isThinking      - Whether the AI is currently processing a request.
 * @property statusMessage   - Transient status text (e.g. "Analyzing image…").
 */
interface ChatAreaProps {
    loadingHistory: boolean;
    messages: Message[];
    user: any;
    activeSubject: Subject;
    handleEdit: (msg: Message) => void;
    handleRegenerate: () => void;
    isThinking: boolean;
    statusMessage: string | null;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
    loadingHistory,
    messages,
    user,
    activeSubject,
    handleEdit,
    handleRegenerate,
    isThinking,
    statusMessage
}) => {
    /** Invisible anchor element used to scroll to the bottom of the chat. */
    const bottomRef = useRef<HTMLDivElement>(null);

    /** Smooth-scroll to the bottom whenever messages change or AI starts thinking. */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex justify-center">
                <span className="text-xs font-medium text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full shadow-sm">
                    Today
                </span>
            </div>

            {loadingHistory ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
                </div>
            ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center opacity-60 mt-10 p-6">
                    <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-700 mb-4">school</span>
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Hello, {user?.displayName?.split(' ')[0] || 'Guest'}!</h3>
                    <p className="text-zinc-500 text-sm max-w-sm">
                        I'm your {activeSubject} tutor. Ask me a question below to get started!
                    </p>
                </div>
            ) : (
                messages.map((msg) => (
                    <ChatBubble
                        key={msg.id}
                        message={msg}
                        onEdit={msg.role === Role.USER ? () => {
                            if (user?.isAnonymous) { alert("Sign in to edit messages!"); return; }
                            handleEdit(msg);
                        } : undefined}
                        onRegenerate={msg.role === Role.MODEL ? () => {
                            if (user?.isAnonymous) { alert("Sign in to regenerate responses!"); return; }
                            handleRegenerate();
                        } : undefined}
                    />
                ))
            )}

            {/* AI thinking / status indicator */}
            {(isThinking || statusMessage) && (
                <div className="flex justify-start gap-4 animate-pulse">
                    <div className="shrink-0 mt-1">
                        <img alt="MentisAI Avatar" className="size-8 object-contain" src="/logo.png" />
                    </div>
                    <div className="bg-white dark:bg-black px-6 py-4 rounded-lg rounded-tl-sm shadow-sm border border-zinc-200 dark:border-zinc-800">
                        {statusMessage ? (
                            <div className="flex gap-2 items-center text-zinc-600 dark:text-zinc-400 font-medium text-sm">
                                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                                <span>{statusMessage}</span>
                            </div>
                        ) : (
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
};
