import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const MarkdownTest: React.FC = () => {
  const testMarkdown = `## Welcome to StudySync AI

I'm your intelligent study assistant, here to help you learn more effectively.

### 🎯 How I Can Help You

1. **Comprehensive Study Notes** - I'll transform any content into structured, easy-to-understand notes
2. **Interactive Flashcards** - Create personalized flashcards for better memorization
3. **Practice Quizzes** - Generate quizzes to test your understanding
4. **Study Roadmaps** - Build step-by-step learning paths for any topic

### 📚 Study Features Available

- **Video Analysis** - Upload YouTube videos for detailed breakdowns
- **Document Processing** - Extract and analyze PDF content
- **Concept Explanations** - Clear explanations of complex topics
- **Progress Tracking** - Monitor your learning journey

### 💡 Pro Tips for Best Results

- **Be Specific**: The more details you provide, the better I can help
- **Ask Follow-ups**: Don't hesitate to ask for clarification or examples
- **Use Examples**: Share specific problems you're working on
- **Request Different Formats**: Ask for summaries, detailed explanations, or step-by-step guides

### 🔄 Getting Started

Ready to dive in? Try asking me:

- "Can you explain machine learning basics?"
- "Create flashcards for Python programming"
- "Generate a quiz about web development"
- "Build a study roadmap for data science"

---

**Note**: I always format responses with clear structure, headings, and organized content to make your learning experience as effective as possible.`;

  const tableTest = `## Comparison Table

Here's a comparison of different study methods:

| Method | Effectiveness | Time Required | Best For |
|--------|--------------|---------------|----------|
| **Spaced Repetition** | ⭐⭐⭐⭐⭐ | Low | Memorization |
| **Active Recall** | ⭐⭐⭐⭐⭐ | Medium | Understanding |
| **Mind Mapping** | ⭐⭐⭐ | Low | Visual Learners |
| **Practice Testing** | ⭐⭐⭐⭐ | High | Exam Prep |

### Task List Example

Here's your study plan:

- [x] Watch introductory video
- [x] Read chapter 1
- [ ] Complete practice exercises
- [ ] Review flashcards
- [ ] Take quiz`;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Markdown Renderer Test</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Formatting Test</h2>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <MarkdownRenderer content={testMarkdown} />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Advanced Features Test</h2>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <MarkdownRenderer content={tableTest} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownTest;