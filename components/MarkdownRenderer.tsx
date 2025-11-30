import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Helper to render inline styles
  const renderInlineMarkdown = (text: string) => {
    // Code spans
    text = text.replace(/`([^`]+)`/g, '<code class="bg-[#1a1a1a] px-1.5 py-0.5 rounded text-xs font-mono border border-white/10 text-blue-200">$1</code>');
    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    // Italic
    text = text.replace(/_([^_]+)_/g, '<em class="italic text-blue-300">$1</em>');
    text = text.replace(/\*([^*]+)\*/g, '<em class="italic text-blue-300">$1</em>');
    // Strikethrough
    text = text.replace(/~~([^~]+)~~/g, '<span class="line-through text-slate-500">$1</span>');
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300">$1</a>');

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLang = '';
    let inTable = false;
    let tableHeader: string[] = [];
    let tableRows: string[][] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // --- Code Blocks ---
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          elements.push(
            <div key={`code-${i}`} className="my-3 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
                <span className="text-xs font-mono text-slate-400">{codeLang || 'text'}</span>
              </div>
              <Highlight theme={themes.vsDark} code={codeContent.trim()} language={codeLang || 'text'}>
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={`${className} p-3 text-xs leading-relaxed overflow-x-auto font-mono`} style={{ ...style, backgroundColor: 'transparent' }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          );
          inCodeBlock = false;
          codeContent = '';
          codeLang = '';
        } else {
          // Start code block
          inCodeBlock = true;
          codeLang = line.replace('```', '').trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        continue;
      }

      // --- Tables ---
      if (line.includes('|')) {
        const row = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
        if (row.length > 0) {
          if (!inTable) {
            // Check if it's a header (next line has dashes)
            if (i + 1 < lines.length && lines[i + 1].includes('---')) {
              inTable = true;
              tableHeader = row;
              i++; // Skip separator line
            }
          } else {
            tableRows.push(row);
          }
          continue;
        }
      } else if (inTable) {
        // End of table
        elements.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/5 text-slate-200">
                <tr>
                  {tableHeader.map((h, idx) => (
                    <th key={idx} className="px-3 py-2 font-semibold border-b border-white/10 whitespace-nowrap">
                      {renderInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-400">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/[0.02]">
                    {row.map((c, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                        {renderInlineMarkdown(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableHeader = [];
        tableRows = [];
      }

      // --- Headings ---
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const classes = {
          1: "text-lg md:text-xl font-bold text-white mt-4 mb-2",
          2: "text-base md:text-lg font-bold text-white mt-3 mb-2",
          3: "text-sm md:text-base font-bold text-blue-100 mt-2 mb-1",
          4: "text-sm font-semibold text-blue-200 mt-2 mb-1",
          5: "text-xs font-semibold text-blue-300 mt-1.5 mb-1",
          6: "text-xs text-blue-300 mt-1.5 mb-1",
        }[level] || "text-sm";

        elements.push(
          <div key={`h-${i}`} className={classes}>
            {renderInlineMarkdown(text)}
          </div>
        );
        continue;
      }

      // --- Lists ---
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
      if (listMatch) {
        const indent = listMatch[1].length;
        const bullet = listMatch[2];
        const content = listMatch[3];
        const isOrdered = /^\d+\./.test(bullet);

        elements.push(
          <div key={`list-${i}`} className={`flex gap-2 text-sm text-slate-300 leading-relaxed ${indent > 0 ? 'ml-6' : ''} my-1`}>
            <span className="text-blue-500 shrink-0 font-mono text-xs mt-1">
              {isOrdered ? bullet : '•'}
            </span>
            <span>{renderInlineMarkdown(content)}</span>
          </div>
        );
        continue;
      }

      // --- Blockquotes ---
      if (line.startsWith('>')) {
        elements.push(
          <div key={`quote-${i}`} className="border-l-2 border-blue-500/50 pl-3 py-1 my-2 text-sm italic text-slate-400 bg-blue-500/5 rounded-r">
            {renderInlineMarkdown(line.replace(/^>\s*/, ''))}
          </div>
        );
        continue;
      }

      // --- Horizontal Rule ---
      if (line.match(/^[-*_]{3,}$/)) {
        elements.push(<hr key={`hr-${i}`} className="border-white/10 my-4" />);
        continue;
      }

      // --- Paragraphs ---
      if (line.trim()) {
        elements.push(
          <p key={`p-${i}`} className="text-sm text-slate-300 leading-relaxed mb-2 last:mb-0">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    }

    // Flush remaining table
    if (inTable) {
      elements.push(
        <div key={`table-end`} className="my-3 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-xs text-left">
            <thead className="bg-white/5 text-slate-200">
              <tr>
                {tableHeader.map((h, idx) => (
                  <th key={idx} className="px-3 py-2 font-semibold border-b border-white/10 whitespace-nowrap">
                    {renderInlineMarkdown(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-400">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.02]">
                  {row.map((c, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                      {renderInlineMarkdown(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
  };

  return (
    <div className="w-full break-words">
      {renderContent()}
    </div>
  );
};

export default MarkdownRenderer;
