import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-800 prose-pre:text-zinc-100 w-full">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Ensure math is rendered in a span/div appropriately if needed
          // But usually default is fine. 
          // We adding a robust error boundary or fallback could be good here.
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MarkdownRenderer);