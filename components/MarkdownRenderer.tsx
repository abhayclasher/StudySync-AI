import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderMarkdown = (text: string) => {
    // Split content into lines for processing
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listStack: { type: 'ul' | 'ol'; items: React.ReactNode[] }[] = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLanguage = '';

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
            <pre key={`code-${i}`} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-2">
              <code className="text-sm">{codeBlockContent}</code>
            </pre>
          );
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      // Handle headings
      if (line.match(/^#{1,6}\s/)) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.substring(level).trim();
        const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
        elements.push(
          <HeadingTag key={i} className={`text-${Math.max(2, 6 - level + 1)}xl font-bold text-white my-4`}>
            {text}
          </HeadingTag>
        );
        continue;
      }

      // Handle horizontal rules
      if (line.match(/^[-*_]{3,}/)) {
        elements.push(<hr key={i} className="border-gray-600 my-4" />);
        continue;
      }

      // Handle blockquotes
      if (line.match(/^>\s/)) {
        elements.push(
          <blockquote key={i} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-900/20 my-2 italic">
            {line.substring(2)}
          </blockquote>
        );
        continue;
      }

      // Handle numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
      if (numberedMatch) {
        const [, number, text] = numberedMatch;
        
        // Check if we're starting a new list or continuing
        if (listStack.length === 0 || listStack[listStack.length - 1].type !== 'ol') {
          listStack.push({ type: 'ol', items: [] });
        }
        
        listStack[listStack.length - 1].items.push(
          <li key={i} className="py-1">
            <span className="font-semibold mr-2">{number}.</span>
            <span>{renderInlineMarkdown(text)}</span>
          </li>
        );
        continue;
      }

      // Handle bullet lists
      const bulletMatch = line.match(/^[-*]\s(.+)/);
      if (bulletMatch) {
        const [, text] = bulletMatch;
        
        // Check if we're starting a new list or continuing
        if (listStack.length === 0 || listStack[listStack.length - 1].type !== 'ul') {
          listStack.push({ type: 'ul', items: [] });
        }
        
        listStack[listStack.length - 1].items.push(
          <li key={i} className="py-1">
            <span className="mr-2">•</span>
            <span>{renderInlineMarkdown(text)}</span>
          </li>
        );
        continue;
      }

      // Handle list continuation (empty line in list)
      if (line.trim() === '' && listStack.length > 0) {
        // Just continue, empty lines will be handled below
        continue;
      }

      // Close any open lists
      while (listStack.length > 0) {
        const list = listStack.pop()!;
        const ListTag = list.type === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${elements.length}`} className="list-none space-y-1 pl-4">
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
        <ListTag key={`list-${elements.length}`} className="list-none space-y-1 pl-4">
          {list.items}
        </ListTag>
      );
    }

    return elements;
  };

  const renderInlineMarkdown = (text: string) => {
    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text
    text = text.replace(/__(.*?)__/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Handle inline code
    text = text.replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>');

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return <div className="markdown-content">{renderMarkdown(content)}</div>;
};

export default MarkdownRenderer;
