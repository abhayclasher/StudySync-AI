// Vercel Serverless Function for AI Test Series Generation
// Hybrid Approach: Uses AI knowledge + optional user-provided previous papers

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { topic, questionCount, difficulty, examType, referencePapers } = req.body;

        // Validation
        if (!topic || !questionCount) {
            return res.status(400).json({ error: 'Topic and question count are required' });
        }

        if (questionCount < 10 || questionCount > 100) {
            return res.status(400).json({ error: 'Question count must be between 10 and 100' });
        }

        const validDifficulties = ['easy', 'medium', 'hard'];
        const selectedDifficulty = difficulty || 'medium';
        if (!validDifficulties.includes(selectedDifficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty level' });
        }

        // Construct AI prompt based on difficulty and exam type
        let difficultyInstruction = '';
        switch (selectedDifficulty) {
            case 'easy':
                difficultyInstruction = 'Create easy-level questions focusing on basic concepts, definitions, and fundamental understanding. Questions should be straightforward and test recall of key facts.';
                break;
            case 'medium':
                difficultyInstruction = 'Create medium-level questions that require application of concepts, understanding of relationships, and basic problem-solving. Mix conceptual and application-based questions.';
                break;
            case 'hard':
                difficultyInstruction = `Create HARD-LEVEL questions suitable for competitive exams with the following characteristics:

**Question Distribution:**
- 40% Conceptual (deep understanding, theory application)
- 30% Numerical (multi-step calculations, problem-solving)
- 30% Analytical (graph interpretation, data analysis, reasoning)

**Complexity Requirements:**
1. **Multi-Concept Integration**: Combine 2-3 related concepts in a single question
2. **Multi-Step Reasoning**: Require 3+ logical steps to reach the answer
3. **Edge Cases & Exceptions**: Include tricky scenarios and special conditions
4. **Real-World Application**: Apply concepts to practical, complex scenarios
5. **Graph/Data Interpretation**: Include questions requiring analysis of trends, patterns, or visual data

**For Science/Math Topics:**
- Include numerical problems with multiple calculation steps
- Add questions requiring graph interpretation (describe the graph in the question text)
- Use LaTeX notation for mathematical formulas (e.g., $E = mc^2$, $\\\\frac{d}{dx}(x^2) = 2x$)
- Include questions about experimental setups, circuit diagrams, or chemical reactions

**Visual Content Instructions:**
- For questions requiring graphs/diagrams, provide detailed textual descriptions
- Example: "Consider a velocity-time graph showing linear increase from 0 to 20 m/s over 10 seconds..."
- Mark such questions with figureDescription and figureType fields

**Avoid:**
- Simple recall questions
- Single-step calculations
- Obvious or trivial answers
- Direct formula applications without context`;
                break;
        }

        const examContext = examType ? `This is for ${examType} examination preparation.` : '';

        // Exam-specific templates and marking schemes
        let examSpecificInstructions = '';
        const examTypeLower = (examType || '').toLowerCase();

        if (examTypeLower.includes('neet')) {
            examSpecificInstructions = `\n\n🎯 **NEET EXAM PATTERN:**
- Sections: Physics, Chemistry, Biology (Botany + Zoology)
- Marking: +4 for correct, -1 for incorrect
- Focus on: Diagrams, NCERT-based concepts, application questions
- Include questions on: Human physiology, plant biology, organic chemistry, mechanics, optics`;
        } else if (examTypeLower.includes('jee')) {
            examSpecificInstructions = `\n\n🎯 **JEE EXAM PATTERN:**
- Sections: Mathematics, Physics, Chemistry
- Marking: +4 for correct, -1 for incorrect
- Focus on: Numerical problem-solving, multi-concept integration, calculus applications
- Include questions on: Calculus, mechanics, thermodynamics, organic chemistry, algebra`;
        } else if (examTypeLower.includes('upsc')) {
            examSpecificInstructions = `\n\n🎯 **UPSC EXAM PATTERN:**
- Focus on: Current affairs, Indian polity, history, geography, economics
- Marking: +2 for correct, -0.66 for incorrect
- Include: Analytical and reasoning-based questions`;
        } else if (examTypeLower.includes('ssc')) {
            examSpecificInstructions = `\n\n🎯 **SSC EXAM PATTERN:**
- Focus on: Reasoning, quantitative aptitude, general awareness, English
- Marking: +2 for correct, -0.5 for incorrect
- Include: Quick calculation questions, logical reasoning`;
        }

        // HYBRID APPROACH: Include reference papers if provided
        let referencePapersContext = '';
        if (referencePapers && referencePapers.trim().length > 0) {
            referencePapersContext = `\n\n📚 REFERENCE MATERIAL (Previous Year Questions/Papers):\n${referencePapers.substring(0, 4000)}\n\nIMPORTANT: Analyze the above reference material to understand:
1. Question patterns and styles used in previous exams
2. Common topics and subtopics that are frequently tested
3. The level of difficulty and complexity expected
4. The format and structure of questions

Use this analysis to generate NEW questions that follow similar patterns but are NOT direct copies. Create original questions that test the same concepts in different ways.`;
        } else {
            referencePapersContext = '\n\nNote: No reference papers provided. Generate questions based on your knowledge of the topic and common examination patterns.';
        }

        const systemPrompt = `You are an expert exam question generator specializing in creating high-quality multiple-choice questions for competitive exams. ${examContext}${examSpecificInstructions}

Your task is to generate ${questionCount} unique, well-crafted multiple-choice questions on the topic: "${topic}".

${difficultyInstruction}

IMPORTANT FORMATTING RULES:
1. Return ONLY a valid JSON object with a "questions" array
2. Each question must have exactly 4 options
3. correctAnswer must be the index (0-3) of the correct option
4. Include brief explanations for educational value
5. Ensure questions are diverse and cover different aspects of the topic
6. Avoid repetitive question patterns
7. Questions should be original and not direct copies from reference material

**ENHANCED QUESTION SCHEMA:**
{
  "questions": [
    {
      "question": "Question text here (use LaTeX for formulas: $E = mc^2$)?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct and why others are wrong",
      "difficulty": "${selectedDifficulty}",
      "subtopic": "Specific subtopic within ${topic}",
      "questionType": "conceptual" | "numerical" | "analytical",
      "marks": 4,
      "negativeMarks": -1,
      "hasLatex": true | false,
      "figureDescription": "Optional: Detailed description of graph/diagram if needed",
      "figureType": "graph" | "diagram" | "circuit" | "chemical-structure" | null
    }
  ]
}${referencePapersContext}`;

        // Call Groq API
        const apiKey = process.env.VITE_GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate ${questionCount} questions on "${topic}" at ${selectedDifficulty} difficulty level. ${referencePapers ? 'Use the reference material to understand patterns but create original questions.' : 'Create questions based on standard examination patterns for this topic.'}` }
                ],
                temperature: 0.8, // Higher temperature for more variety
                max_tokens: 8000,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Groq API error');
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || '{}';

        // Parse and validate JSON
        let questions;
        try {
            const parsed = JSON.parse(content);
            questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        } catch (e) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1]);
                questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
            } else {
                throw new Error('Failed to parse AI response');
            }
        }

        // Validate questions
        const validQuestions = questions.filter(q =>
            q.question &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            typeof q.correctAnswer === 'number' &&
            q.correctAnswer >= 0 &&
            q.correctAnswer <= 3
        ).slice(0, questionCount);

        if (validQuestions.length === 0) {
            throw new Error('No valid questions generated');
        }

        // Add IDs to questions
        const questionsWithIds = validQuestions.map((q, index) => ({
            id: `q-${Date.now()}-${index}`,
            ...q,
            type: 'multiple-choice'
        }));

        return res.status(200).json({
            success: true,
            questions: questionsWithIds,
            metadata: {
                topic,
                difficulty: selectedDifficulty,
                examType,
                totalQuestions: questionsWithIds.length,
                usedReferencePapers: !!referencePapers,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Test series generation error:', error);
        return res.status(500).json({
            error: 'Failed to generate test series',
            details: error.message
        });
    }
}
