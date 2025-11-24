import React from 'react';

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
            <pre key={`code-${i}`} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 border border-gray-700">
              <code className="text-sm font-mono">{codeBlockContent}</code>
            </pre>
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
          <div key={`table-${i}`} className="overflow-x-auto my-4">
            <table className="min-w-full border border-gray-700 rounded-lg">
              <thead className="bg-gray-800">
                <tr>
                  {tableHeaders.map((header, idx) => (
                    <th key={idx} className="px-4 py-2 text-left text-white border-b border-gray-600">
                      {renderInlineMarkdown(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-900/50' : ''}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-2 border-t border-gray-700">
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
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-2 pl-${list.indentLevel * 4} my-2`}>
              {list.items}
            </ListTag>
          );
        }

        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.substring(level).trim();
        const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
        const headingClasses = [
          'text-4xl font-bold text-white my-6',      // h1
          'text-3xl font-bold text-white my-6',      // h2
          'text-2xl font-bold text-white my-5',      // h3
          'text-xl font-bold text-white my-4',       // h4
          'text-lg font-bold text-white my-4',       // h5
          'text-base font-bold text-white my-3'      // h6
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
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-2 pl-${list.indentLevel * 4} my-2`}>
              {list.items}
            </ListTag>
          );
        }
        
        elements.push(<hr key={i} className="border-gray-600 my-8 opacity-50" />);
        continue;
      }

      // Handle blockquotes
      if (line.match(/^>\s/)) {
        // Close any open lists before blockquote
        while (listStack.length > 0) {
          const list = listStack.pop()!;
          const ListTag = list.type === 'ol' ? 'ol' : 'ul';
          elements.push(
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-2 pl-${list.indentLevel * 4} my-2`}>
              {list.items}
            </ListTag>
          );
        }
        
        elements.push(
          <blockquote key={i} className="border-l-4 border-blue-500 pl-6 pr-4 py-3 bg-blue-900/20 my-4 italic text-slate-300">
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
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-2 pl-${list.indentLevel * 4} my-2`}>
              {list.items}
            </ListTag>
          );
        }
        
        // Check if we're starting a new list or continuing
        if (listStack.length === 0 || listStack[listStack.length - 1].indentLevel < indentLevel) {
          listStack.push({ type: 'ol', items: [], indentLevel });
        }
        
        listStack[listStack.length - 1].items.push(
          <li key={i} className="py-1 text-slate-300">
            <span className="font-semibold mr-3 text-blue-400">{number}.</span>
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
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-2 pl-${list.indentLevel * 4} my-2`}>
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
          <li key={i} className="py-1 text-slate-300">
            <span className="mr-3 text-blue-400">{bulletChar}</span>
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
            <ListTag key={`list-${elements.length}`} className={`list-none space-y-2 pl-${list.indentLevel * 4} my-2`}>
              {list.items}
            </ListTag>
          );
        }
        
        if (listStack.length === 0 || listStack[listStack.length - 1].indentLevel < indentLevel) {
          listStack.push({ type: 'ul', items: [], indentLevel });
        }
        
        listStack[listStack.length - 1].items.push(
          <li key={i} className="py-1 text-slate-300 flex items-center">
            <input
              type="checkbox"
              checked={checked.toLowerCase() === 'x'}
              className="mr-3 h-4 w-4 text-blue-500 bg-gray-700 rounded border-gray-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
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
          <ListTag key={`list-${elements.length}`} className={`list-none space-y-2 pl-${list.indentLevel * 4} my-2`}>
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
    text = text.replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-700">$1</code>');
    
    // Handle strikethrough
    text = text.replace(/~~(.*?)~~/g, '<span class="line-through">$1</span>');
    
    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
    
    // Handle italic text (after bold to avoid conflicts)
    text = text.replace(/__(.*?)__/g, '<em class="italic text-blue-300">$1</em>');
    text = text.replace(/_(.*?)_/g, '<em class="italic text-blue-300">$1</em>');
    
    // Handle links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>');

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <div className="markdown-content prose prose-invert max-w-none">
      {renderMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;
