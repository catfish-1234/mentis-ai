import React, { useState, useEffect } from 'react';
import { Message, Role } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { db, collection, addDoc, serverTimestamp } from '../firebase';

interface ChatBubbleProps {
  message: Message;
  onEdit?: () => void;
  onRegenerate?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onEdit, onRegenerate }) => {
  const isUser = message.role === Role.USER;
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);

  // Typewriter Logic
  const isRecent = (new Date().getTime() - new Date(message.timestamp).getTime()) < 3000; // 3 seconds threshold
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shouldAnimate = !isUser && isRecent && !isMobile;

  const [displayedContent, setDisplayedContent] = useState(shouldAnimate ? '' : message.content);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedContent(message.content || '');
      return;
    }

    let currentIndex = 0;
    const text = message.content || '';
    const speed = 15; // ms per char

    // Reset displayed content when starting animation
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleFeedback = async (rating: 'up' | 'down') => {
    if (feedback === rating) return; // Prevent duplicate
    setFeedback(rating);

    try {
      // Write to 'feedback' collection
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

  if (isUser) {
    return (
      <div id={`msg-${message.id}`} className="flex justify-end gap-3 animate-fade-in-up group">
        {/* User Bubble */}
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%] relative">
          <div className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-5 py-3.5 rounded-lg rounded-tr-sm shadow-sm">
            <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          {/* Attachment Rendering Stub if needed */}
          {message.attachment && (
            <div className="mt-1 text-xs text-zinc-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">attachment</span>
              {message.attachment.fileName || 'Attachment'}
            </div>
          )}

          {/* Edit Button - Visible on Hover */}
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