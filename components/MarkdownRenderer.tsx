/**
 * @module MarkdownRenderer
 *
 * Renders AI-generated Markdown content with full support for:
 * - Standard Markdown formatting (headings, lists, code blocks, etc.)
 * - LaTeX math expressions via `remark-math` and `rehype-katex`.
 *   - Inline math: `$ ... $`
 *   - Block math: `$$ ... $$`
 * - HTML sanitization via `rehype-sanitize` to prevent XSS from AI output.
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
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

/**
 * Custom sanitization schema that extends the default to allow KaTeX
 * elements (spans with KaTeX class names) while blocking dangerous
 * elements like script, iframe, object, embed, etc.
 */
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // Allow class names on spans and divs for KaTeX rendering
    span: [...(defaultSchema.attributes?.span || []), 'className', 'class', 'style'],
    div: [...(defaultSchema.attributes?.div || []), 'className', 'class', 'style'],
    math: [...(defaultSchema.attributes?.math || []), 'xmlns'],
    annotation: [...(defaultSchema.attributes?.annotation || []), 'encoding'],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    // Allow KaTeX-specific elements
    'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub',
    'mfrac', 'mover', 'munder', 'msqrt', 'mroot', 'mtable', 'mtr',
    'mtd', 'mtext', 'mspace', 'annotation',
  ],
};

/**
 * Props for the {@link MarkdownRenderer} component.
 *
 * @property content - Raw Markdown/LaTeX string to render.
 */
interface MarkdownRendererProps {
  content: string;
}

/**
 * Memoized Markdown renderer with LaTeX math support and HTML sanitization.
 * Renders the provided content string as formatted HTML while stripping
 * dangerous elements like <script>, <iframe>, <object>, etc.
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-800 prose-pre:text-zinc-100 w-full">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeSanitize, sanitizeSchema]]}
        components={{}}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MarkdownRenderer);