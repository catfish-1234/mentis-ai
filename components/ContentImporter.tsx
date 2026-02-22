/**
 * @module ContentImporter
 * Import content from PDFs, YouTube URLs, and slideshows for AI note generation.
 */

import React, { useState, useCallback, useRef } from 'react';

interface ContentImporterProps {
    onContentReady: (content: string, sourceType: 'pdf' | 'youtube' | 'slideshow' | 'text', sourceUrl?: string) => void;
}

export const ContentImporter: React.FC<ContentImporterProps> = ({ onContentReady }) => {
    const [activeTab, setActiveTab] = useState<'pdf' | 'youtube' | 'text'>('pdf');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [textContent, setTextContent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handlePdfUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setFileName(file.name);

        try {
            const text = await file.text();

            if (text && text.trim().length > 50) {
                onContentReady(text.trim(), 'pdf');
            } else {
                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                let extractedText = '';
                let inText = false;
                let textBuffer = '';

                for (let i = 0; i < uint8Array.length; i++) {
                    const char = String.fromCharCode(uint8Array[i]);
                    if (!inText) {
                        if (i + 1 < uint8Array.length &&
                            char === 'T' && String.fromCharCode(uint8Array[i + 1]) === 'j') {
                            inText = false;
                            if (textBuffer.trim()) extractedText += textBuffer.trim() + ' ';
                            textBuffer = '';
                        }
                        if (char === '(') {
                            inText = true;
                            textBuffer = '';
                        }
                    } else {
                        if (char === ')') {
                            inText = false;
                            extractedText += textBuffer;
                            textBuffer = '';
                        } else {
                            textBuffer += char;
                        }
                    }
                }

                if (extractedText.trim().length > 20) {
                    onContentReady(extractedText.trim(), 'pdf');
                } else {
                    onContentReady(
                        `[PDF file uploaded: ${file.name}, size: ${(file.size / 1024).toFixed(1)}KB. The text could not be fully extracted from this PDF. Please summarize the key topics this PDF likely covers based on the filename and create comprehensive study notes.]`,
                        'pdf'
                    );
                }
            }
        } catch (err) {
            setError('Could not process PDF. Try a text-based PDF file.');
            console.error('PDF processing error:', err);
        } finally {
            setIsProcessing(false);
        }
    }, [onContentReady]);

    const handleYoutubeSubmit = useCallback(() => {
        if (!youtubeUrl.trim()) return;

        const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (!videoIdMatch) {
            setError('Please enter a valid YouTube URL');
            return;
        }

        setIsProcessing(true);
        setError(null);

        const videoId = videoIdMatch[1];

        onContentReady(
            `[YouTube Video ID: ${videoId}, URL: ${youtubeUrl}. Please create comprehensive study notes for this video. Cover the main topics, key points, and important takeaways. Structure the notes with clear headings, bullet points, and summaries.]`,
            'youtube',
            youtubeUrl
        );
        setIsProcessing(false);
    }, [youtubeUrl, onContentReady]);

    const handleTextSubmit = useCallback(() => {
        if (textContent.trim()) {
            onContentReady(textContent.trim(), 'text');
        }
    }, [textContent, onContentReady]);

    const tabs = [
        { id: 'pdf' as const, icon: 'picture_as_pdf', label: 'PDF' },
        { id: 'youtube' as const, icon: 'play_circle', label: 'YouTube' },
        { id: 'text' as const, icon: 'text_fields', label: 'Text / Slides' },
    ];

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setError(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {activeTab === 'pdf' && (
                    <div className="space-y-4">
                        <div
                            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer"
                            onClick={() => fileRef.current?.click()}
                        >
                            <span className="material-symbols-outlined text-[48px] text-zinc-300 dark:text-zinc-600 mb-3 block">cloud_upload</span>
                            {fileName ? (
                                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{fileName}</p>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Drop your PDF here or click to browse</p>
                                    <p className="text-xs text-zinc-400">Supports .pdf files</p>
                                </>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handlePdfUpload} />
                        {isProcessing && (
                            <div className="flex items-center justify-center gap-2 text-sm text-indigo-500">
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                Processing document...
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'youtube' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">YouTube Video URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={youtubeUrl}
                                    onChange={e => setYoutubeUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                />
                                <button
                                    onClick={handleYoutubeSubmit}
                                    disabled={!youtubeUrl.trim() || isProcessing}
                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                    Create Notes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'text' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Paste your text, lecture notes, or slideshow content</label>
                            <textarea
                                value={textContent}
                                onChange={e => setTextContent(e.target.value)}
                                placeholder="Paste your content here..."
                                rows={8}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleTextSubmit}
                                disabled={!textContent.trim()}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                Generate Notes
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
