import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderMarkdown = (text: string) => {
    // Split content into lines for processing
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listStack: { type: 'ul' | 'ol'; items: React.ReactNode[]; indentLevel: number }[] = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLanguage = '';
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeaders: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          // Start code block
          inCodeBlock = true;
          codeBlockLanguage = line.replace(/```/, '').trim();
          codeBlockContent = '';
        } else {
          // End code block
          inCodeBlock = false;
          elements.push(
            <Highlight
              key={`code-${i}`}
              theme={themes.vsDark}
              code={codeBlockContent.trim()}
              language={codeBlockLanguage || 'text'}
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <div className="relative group my-4">
                  <div className="absolute top-0 right-0 px-2 py-1 text-[10px] text-slate-500 font-mono bg-[#1a1a1a] rounded-bl-lg border-l border-b border-white/5">
                    {codeBlockLanguage || 'text'}
                  </div>
                  <pre className={`${className} p-4 rounded-xl overflow-x-auto border border-white/10 bg-[#0a0a0a] !bg-[#0a0a0a]`} style={{ ...style, backgroundColor: '#0a0a0a' }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                </div>
              )}
            </Highlight>
          );
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      // Handle table rows
      if (line.includes('|') && (line.includes('--') || tableHeaders.length > 0)) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);

        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
          tableRows = [];
        } else if (!line.includes('---') && !line.includes('===')) {
          tableRows.push(cells);
        }
        continue;
      }

      // Close table if we encounter a non-table line and we're in a table
      if (inTable && !line.includes('|')) {
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-4 rounded-xl border border-white/10">
            <table className="min-w-full">
              <thead className="bg-white/5">
                <tr>
                  {tableHeaders.map((header, idx) => (
                    <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-white border-b border-white/10 uppercase tracking-wider">
                      {renderInlineMarkdown(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 border-t border-white/5 text-sm text-slate-300">
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }

      // Handle headings
      if (line.match(/^#{1,6}\s/)) {
        // Close any open lists before heading
        while (listStack.length > 0) {
          const list = listStack.pop()!;
          const ListTag = list.type === 'ol' ? 'ol' : 'ul';
          elements.push(
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-1 pl-${list.indentLevel * 3} my-1`}>
              {list.items}
            </ListTag>
          );
        }

        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.substring(level).trim();
        const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
        const headingClasses = [
          'text-3xl font-bold text-white my-6 tracking-tight',      // h1
          'text-2xl font-bold text-white my-5 tracking-tight',      // h2
          'text-xl font-bold text-blue-100 my-4',      // h3
          'text-lg font-bold text-blue-200 my-3',       // h4
          'text-base font-bold text-blue-300 my-2',       // h5
          'text-sm font-bold text-blue-300 my-2'      // h6
        ];

        elements.push(
          <HeadingTag key={i} className={headingClasses[level - 1]}>
            {renderInlineMarkdown(text)}
          </HeadingTag>
        );
        continue;
      }

      // Handle horizontal rules
      if (line.match(/^[-*_]{3,}/)) {
        // Close any open lists before hr
        while (listStack.length > 0) {
          const list = listStack.pop()!;
          const ListTag = list.type === 'ol' ? 'ol' : 'ul';
          elements.push(
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-1 pl-${list.indentLevel * 3} my-1`}>
              {list.items}
            </ListTag>
          );
        }

        elements.push(<hr key={i} className="border-white/10 my-6" />);
        continue;
      }

      // Handle blockquotes
      if (line.match(/^>\s/)) {
        // Close any open lists before blockquote
        while (listStack.length > 0) {
          const list = listStack.pop()!;
          const ListTag = list.type === 'ol' ? 'ol' : 'ul';
          elements.push(
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-1 pl-${list.indentLevel * 3} my-1`}>
              {list.items}
            </ListTag>
          );
        }

        elements.push(
          <blockquote key={i} className="border-l-4 border-blue-500 pl-4 pr-3 py-2 bg-blue-500/5 rounded-r-lg my-4 italic text-slate-300">
            {renderInlineMarkdown(line.substring(2))}
          </blockquote>
        );
        continue;
      }

      // Handle numbered lists
      const numberedMatch = line.match(/^(\s*)(\d+)\.\s(.+)/);
      if (numberedMatch) {
        const [, indent, number, text] = numberedMatch;
        const indentLevel = Math.floor(indent.length / 2);

        // Close lists with higher indent level
        while (listStack.length > 0 && listStack[listStack.length - 1].indentLevel >= indentLevel) {
          const list = listStack.pop()!;
          const ListTag = list.type === 'ol' ? 'ol' : 'ul';
          elements.push(
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-1 pl-${list.indentLevel * 3} my-1`}>
              {list.items}
            </ListTag>
          );
        }

        // Check if we're starting a new list or continuing
        if (listStack.length === 0 || listStack[listStack.length - 1].indentLevel < indentLevel) {
          listStack.push({ type: 'ol', items: [], indentLevel });
        }

        listStack[listStack.length - 1].items.push(
          <li key={i} className="py-1 text-slate-300 flex items-start gap-2">
            <span className="font-bold text-blue-400 shrink-0 mt-0.5">{number}.</span>
            <span>{renderInlineMarkdown(text)}</span>
          </li>
        );
        continue;
      }

      // Handle bullet lists
      const bulletMatch = line.match(/^(\s*)([-*+])\s(.+)/);
      if (bulletMatch) {
        const [, indent, bullet, text] = bulletMatch;
        const indentLevel = Math.floor(indent.length / 2);

        // Close lists with higher indent level
        while (listStack.length > 0 && listStack[listStack.length - 1].indentLevel >= indentLevel) {
          const list = listStack.pop()!;
          const ListTag = list.type === 'ol' ? 'ol' : 'ul';
          elements.push(
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-1 pl-${list.indentLevel * 3} my-1`}>
              {list.items}
            </ListTag>
          );
        }

        // Check if we're starting a new list or continuing
        if (listStack.length === 0 || listStack[listStack.length - 1].indentLevel < indentLevel) {
          listStack.push({ type: 'ul', items: [], indentLevel });
        }

        const bulletChar = bullet === '*' ? '•' : bullet === '-' ? '◦' : '▪';

        listStack[listStack.length - 1].items.push(
          <li key={i} className="py-1 text-slate-300 flex items-start gap-2">
            <span className="text-blue-400 font-bold shrink-0 mt-0.5">{bulletChar}</span>
            <span>{renderInlineMarkdown(text)}</span>
          </li>
        );
        continue;
      }

      // Handle task lists
      const taskMatch = line.match(/^(\s*)[-*+]\s*\[(x| )\]\s(.+)/);
      if (taskMatch) {
        const [, indent, checked, text] = taskMatch;
        const indentLevel = Math.floor(indent.length / 2);

        // Close lists with higher indent level
        while (listStack.length > 0 && listStack[listStack.length - 1].indentLevel >= indentLevel) {
          const list = listStack.pop()!;
          const ListTag = list.type === 'ol' ? 'ol' : 'ul';
          elements.push(
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-1 pl-${list.indentLevel * 3} my-1`}>
              {list.items}
            </ListTag>
          );
        }

        if (listStack.length === 0 || listStack[listStack.length - 1].indentLevel < indentLevel) {
          listStack.push({ type: 'ul', items: [], indentLevel });
        }

        listStack[listStack.length - 1].items.push(
          <li key={i} className="py-1 text-slate-300 flex items-center gap-2">
            <input
              type="checkbox"
              checked={checked.toLowerCase() === 'x'}
              className="h-4 w-4 text-blue-500 bg-[#1a1a1a] rounded border-white/20 focus:ring-blue-500 focus:ring-2 cursor-pointer"
              readOnly
            />
            <span className={checked.toLowerCase() === 'x' ? 'line-through text-slate-500' : ''}>
              {renderInlineMarkdown(text)}
            </span>
          </li>
        );
        continue;
      }

      // Handle list continuation (empty line in list)
      if (line.trim() === '' && listStack.length > 0) {
        // Just continue, empty lines will be handled below
        continue;
      }

      // Close any open lists when encountering regular text
      while (listStack.length > 0) {
        const list = listStack.pop()!;
        const ListTag = list.type === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${elements.length}`} className={`list-none space-y-1 pl-${list.indentLevel * 3} my-1`}>
            {list.items}
          </ListTag>
        );
      }

      // Handle regular paragraphs
      if (line.trim()) {
        elements.push(
          <p key={i} className="text-slate-300 leading-relaxed mb-4">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    }

    // Close any remaining open lists
    while (listStack.length > 0) {
      const list = listStack.pop()!;
      const ListTag = list.type === 'ol' ? 'ol' : 'ul';
      elements.push(
        <ListTag key={`list-${elements.length}`} className={`list-none space-y-2 pl-${list.indentLevel * 4} my-2`}>
          {list.items}
        </ListTag>
      );
    }

    return elements;
  };

  const renderInlineMarkdown = (text: string) => {
    // Handle code spans first (to avoid conflicts with other formatting)
    text = text.replace(/`(.*?)`/g, '<code class="bg-[#1a1a1a] px-1.5 py-0.5 rounded text-sm font-mono border border-white/10 text-blue-200">$1</code>');

    // Handle strikethrough
    text = text.replace(/~~(.*?)~~/g, '<span class="line-through text-slate-500">$1</span>');

    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    // Handle italic text (after bold to avoid conflicts)
    text = text.replace(/__(.*?)__/g, '<em class="italic text-blue-300">$1</em>');
    text = text.replace(/_(.*?)_/g, '<em class="italic text-blue-300">$1</em>');

    // Handle links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300">$1</a>');

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <div className="markdown-content w-full">
      {renderMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;
