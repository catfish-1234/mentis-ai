import React, { useState } from 'react';
import { Message, Role } from '../types';

interface ConversationTimelineProps {
    messages: Message[];
    onNodeClick: (messageId: string) => void;
}

export const ConversationTimeline: React.FC<ConversationTimelineProps> = ({ messages, onNodeClick }) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    if (messages.length === 0) return null;

    const getPreviewText = (content: string) => {
        const words = content.split(/\s+/).slice(0, 5);
        return words.join(' ') + (content.split(/\s+/).length > 5 ? '...' : '');
    };

    return (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-40">
            {/* Timeline line */}
            <div className="absolute inset-0 w-0.5 bg-gradient-to-b from-indigo-500/20 via-violet-500/20 to-indigo-500/20 left-1/2 -translate-x-1/2 rounded-full" />

            {messages.map((msg, idx) => (
                <div key={msg.id} className="relative">
                    {/* Node */}
                    <button
                        onClick={() => onNodeClick(msg.id)}
                        onMouseEnter={() => setHoveredId(msg.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`
                            w-3 h-3 rounded-full relative z-10 transition-all duration-200
                            ${msg.role === Role.USER
                                ? 'bg-indigo-500 hover:bg-indigo-400 hover:scale-125'
                                : 'bg-violet-500 hover:bg-violet-400 hover:scale-125'
                            }
                            ${hoveredId === msg.id ? 'ring-2 ring-white shadow-lg scale-125' : ''}
                        `}
                        title={msg.role === Role.USER ? 'Your message' : 'AI response'}
                    />

                    {/* Hover tooltip */}
                    {hoveredId === msg.id && (
                        <div className={`
                            absolute right-full mr-3 top-1/2 -translate-y-1/2
                            bg-zinc-900 dark:bg-zinc-800 text-white text-xs px-3 py-2 rounded-lg
                            shadow-lg max-w-48 whitespace-nowrap overflow-hidden text-ellipsis
                            animate-fade-in
                        `}>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${msg.role === Role.USER ? 'bg-indigo-400' : 'bg-violet-400'}`} />
                                <span className="text-zinc-400 text-[10px] uppercase">
                                    {msg.role === Role.USER ? 'You' : 'AI'}
                                </span>
                            </div>
                            <div className="mt-1 text-zinc-200 truncate">
                                {getPreviewText(msg.content)}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
