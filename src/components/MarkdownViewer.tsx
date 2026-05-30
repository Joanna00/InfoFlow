/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  if (!content) return <p className="text-gray-400 italic">内容为空</p>;

  const lines = content.split('\n');
  let inList = false;
  let listItems: string[] = [];
  const renderedElements: React.ReactNode[] = [];

  const parseInlineStyles = (text: string) => {
    // Basic bold parser **text** -> strong
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-semibold text-gray-900 border-b border-rose-100/40 bg-rose-50/30 px-1 rounded">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${key}`} className="list-disc pl-6 space-y-2 mb-4 text-gray-700">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">{parseInlineStyles(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // 1. Headers
    if (trimmed.startsWith('# ')) {
      flushList(index);
      renderedElements.push(
        <h1 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-4 leading-tight tracking-tight border-b border-gray-100 pb-2">
          {parseInlineStyles(trimmed.substring(2))}
        </h1>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(index);
      renderedElements.push(
        <h2 key={index} className="text-xl font-semibold text-gray-900 mt-5 mb-3 leading-snug tracking-tight">
          {parseInlineStyles(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(index);
      renderedElements.push(
        <h3 key={index} className="text-lg font-medium text-gray-900 mt-4 mb-2">
          {parseInlineStyles(trimmed.substring(4))}
        </h3>
      );
    }
    // 2. Horizontal divider
    else if (trimmed === '---') {
      flushList(index);
      renderedElements.push(<hr key={index} className="my-6 border-t border-gray-200" />);
    }
    // 3. Unordered list
    else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      inList = true;
      listItems.push(trimmed.substring(2));
    }
    // 4. Blockquote
    else if (trimmed.startsWith('> ')) {
      flushList(index);
      renderedElements.push(
        <blockquote key={index} className="border-l-4 border-rose-500 bg-rose-50/50 px-4 py-3 my-4 italic text-gray-800 rounded-r-md">
          {parseInlineStyles(trimmed.substring(2))}
        </blockquote>
      );
    }
    // 5. Code blocks / Empty / Regular text
    else if (trimmed === '') {
      flushList(index);
    } else {
      if (inList) {
        // If we are currently compiling a list, but this line doesn't start with * or -,
        // flush the list unless it's a continuing line
        flushList(index);
      }
      renderedElements.push(
        <p key={index} className="text-gray-700 leading-relaxed mb-4 text-justify whitespace-pre-wrap">
          {parseInlineStyles(trimmed)}
        </p>
      );
    }
  });

  // Flush any remaining list items at EOF
  flushList(lines.length);

  return <div className="space-y-1 font-sans text-[15px]">{renderedElements}</div>;
}
