
export type TopicCategory = 'competitive' | 'academic' | 'professional' | 'general';

export interface TopicContext {
    category: TopicCategory;
    examType?: string; // e.g., 'NEET', 'JEE'
    isCompetitive: boolean;
    suggestedModes: string[];
}

const COMPETITIVE_KEYWORDS = [
    'neet', 'jee', 'upsc', 'ssc', 'cat', 'gate', 'iit', 'aiims', 'bitsat', 'clat', 'nda', 'cds', 'afcat', 'ibps', 'sbi', 'rrb', 'cbse', 'icse'
];

const PROFESSIONAL_KEYWORDS = [
    'python', 'java', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'design', 'marketing', 'business', 'finance', 'accounting', 'management', 'leadership', 'sales', 'coding', 'programming'
];

export const classifyTopic = (topicInput: string): TopicContext => {
    const normalizedInput = topicInput.toLowerCase().trim();

    // Check for competitive exams
    const foundExam = COMPETITIVE_KEYWORDS.find(keyword => normalizedInput.includes(keyword));
    if (foundExam) {
        let examType = foundExam.toUpperCase();
        if (examType === 'IIT') examType = 'JEE Advanced';
        if (examType === 'AIIMS') examType = 'NEET';

        return {
            category: 'competitive',
            examType: examType,
            isCompetitive: true,
            suggestedModes: ['test-series', 'mock-exam', 'previous-year']
        };
    }

    // Check for professional/skill topics
    if (PROFESSIONAL_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
        return {
            category: 'professional',
            isCompetitive: false,
            suggestedModes: ['practical-quiz', 'skill-assessment', 'project-based']
        };
    }

    // Default to general/academic
    return {
        category: 'general',
        isCompetitive: false,
        suggestedModes: ['concept-builder', 'quick-quiz']
    };
};
