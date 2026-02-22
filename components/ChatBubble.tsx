/**
 * @module ChatBubble
 *
 * Renders a single chat message bubble. User messages appear right-aligned
 * with a "YOU" badge; AI messages appear left-aligned with the MentisAI
 * avatar and include action buttons (thumbs up/down, copy, regenerate).
 *
 * AI responses feature a typewriter animation for recently received
 * messages (within a 3-second window), which is disabled on mobile
 * for performance.
 *
 * Feedback (thumbs up/down) is persisted to a top-level `feedback`
 * Firestore collection for analytics.
 */

import React, { useState, useEffect } from 'react';
import { Message, Role } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { db, collection, addDoc, serverTimestamp } from '../firebase';

/**
 * Props for the {@link ChatBubble} component.
 *
 * @property message      - The message data to render.
 * @property onEdit       - Callback to edit this message (user messages only).
 * @property onRegenerate - Callback to regenerate this response (AI messages only).
 */
interface ChatBubbleProps {
  message: Message;
  onEdit?: () => void;
  onRegenerate?: () => void;
}

/**
 * Renders a styled message bubble with role-specific layout, actions,
 * and an optional typewriter reveal animation for AI responses.
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onEdit, onRegenerate }) => {
  const isUser = message.role === Role.USER;
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);

  // Typewriter animation: only for AI messages received within the last 3 seconds, and not on mobile
  const isRecent = (new Date().getTime() - new Date(message.timestamp).getTime()) < 3000;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shouldAnimate = !isUser && isRecent && !isMobile;

  const [displayedContent, setDisplayedContent] = useState(shouldAnimate ? '' : message.content);

  /** Drive the typewriter effect by revealing one character at a time. */
  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedContent(message.content || '');
      return;
    }

    let currentIndex = 0;
    const text = message.content || '';
    const speed = 15;

    setDisplayedContent('');

    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedContent(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [message.content, shouldAnimate]);

  /** Copy the full message content to the clipboard. */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  /**
   * Submit user feedback (thumbs up/down) to the Firestore `feedback` collection.
   * Prevents duplicate submissions for the same rating.
   */
  const handleFeedback = async (rating: 'up' | 'down') => {
    if (feedback === rating) return;
    setFeedback(rating);

    try {
      await addDoc(collection(db, 'feedback'), {
        messageId: message.id || 'unknown',
        content: message.content,
        rating: rating,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Error sending feedback", e);
    }
  };

  /* ── User Message Bubble ── */
  if (isUser) {
    return (
      <div id={`msg-${message.id}`} className="flex justify-end gap-3 animate-fade-in-up group">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%] relative">
          <div className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-5 py-3.5 rounded-lg rounded-tr-sm shadow-sm">
            <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          {message.attachment && (
            <div className="mt-1 text-xs text-zinc-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">attachment</span>
              {message.attachment.fileName || 'Attachment'}
            </div>
          )}

          {/* Edit button — revealed on hover */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-700"
              title="Edit Prompt"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          )}
        </div>
        <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 shadow-sm shrink-0 mt-auto hidden sm:flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-bold text-xs">
          YOU
        </div>
      </div>
    );
  }

  /* ── AI Response Bubble ── */
  return (
    <div id={`msg-${message.id}`} className="flex justify-start gap-4 animate-fade-in-up">
      <div className="shrink-0 mt-1">
        <img alt="MentisAI Avatar" className="size-8 object-contain" src="/logo.png" />
      </div>
      <div className="flex flex-col max-w-[90%] sm:max-w-[85%]">
        <div className="bg-white dark:bg-black px-0 py-2 space-y-4">
          <div className="text-zinc-800 dark:text-zinc-200 text-[15px] sm:text-base leading-7">
            <MarkdownRenderer content={displayedContent} />
          </div>
          {/* Action bar: feedback, copy */}
          <div className="flex items-center gap-2 mt-2 ml-0 pt-0">
            <button
              onClick={() => handleFeedback('up')}
              className={`p-1 rounded transition-colors ${feedback === 'up' ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              title="Helpful"
            >
              <span className={`material-symbols-outlined text-[18px] ${feedback === 'up' ? 'fill-current' : ''}`}>thumb_up</span>
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={`p-1 rounded transition-colors ${feedback === 'down' ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              title="Not Helpful"
            >
              <span className={`material-symbols-outlined text-[18px] ${feedback === 'down' ? 'fill-current' : ''}`}>thumb_down</span>
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
            <button
              onClick={handleCopy}
              className={`p-1 rounded transition-colors flex items-center gap-1 ${copied ? 'text-green-600 dark:text-green-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              title="Copy"
            >
              <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
              {copied && <span className="text-xs font-medium">Copied</span>}
            </button>
          </div>
          {/* Regenerate button — shown only on the latest AI response */}
          {onRegenerate && (
            <div className="flex justify-start mt-2">
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                Regenerate Response
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};