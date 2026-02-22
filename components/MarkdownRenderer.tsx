/**
 * @module MarkdownRenderer
 *
 * Renders AI-generated Markdown content with full support for:
 * - Standard Markdown formatting (headings, lists, code blocks, etc.)
 * - LaTeX math expressions via `remark-math` and `rehype-katex`.
 *   - Inline math: `$ ... $`
 *   - Block math: `$$ ... $$`
 *
 * Wrapped in `React.memo` to prevent unnecessary re-renders during
 * the typewriter animation in {@link ChatBubble}.
 *
 * Uses Tailwind's `prose` typography plugin for consistent styling.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * Props for the {@link MarkdownRenderer} component.
 *
 * @property content - Raw Markdown/LaTeX string to render.
 */
interface MarkdownRendererProps {
  content: string;
}

/**
 * Memoized Markdown renderer with LaTeX math support.
 * Renders the provided content string as formatted HTML.
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-800 prose-pre:text-zinc-100 w-full">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{}}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MarkdownRenderer);