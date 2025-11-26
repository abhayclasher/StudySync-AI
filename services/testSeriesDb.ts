import { supabase } from '../lib/supabase';
import { TestSeries, TestAttempt } from '../types';

/**
 * Save a generated test series to the database
 */
export const saveTestSeries = async (
    topic: string,
    examType: string | undefined,
    difficulty: 'easy' | 'medium' | 'hard',
    questions: any[],
    referencePapers?: string
): Promise<TestSeries | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Generate a title based on topic and difficulty
        const title = `${topic} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level`;

        const { data, error } = await supabase
            .from('test_series')
            .insert({
                user_id: user.id,
                title,
                topic,
                exam_type: examType,
                difficulty,
                total_questions: questions.length,
                time_limit: questions.length * 2, // 2 minutes per question
                questions,
                reference_papers: referencePapers
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving test series:', error);
        return null;
    }
};

/**
 * Get all test series for the current user
 */
export const getTestSeriesList = async (): Promise<TestSeries[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('test_series')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching test series:', error);
        return [];
    }
};

/**
 * Get a specific test series by ID
 */
export const getTestSeriesById = async (id: string): Promise<TestSeries | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('test_series')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching test series:', error);
        return null;
    }
};

/**
 * Save a test attempt result
 */
export const saveTestAttempt = async (
    testSeriesId: string,
    score: number,
    totalQuestions: number,
    timeTaken: number,
    answers: any[]
): Promise<TestAttempt | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('test_attempts')
            .insert({
                user_id: user.id,
                test_series_id: testSeriesId,
                score,
                total_questions: totalQuestions,
                time_taken: timeTaken,
                answers
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving test attempt:', error);
        return null;
    }
};

/**
 * Get all attempts for a specific test series
 */
export const getTestAttempts = async (testSeriesId: string): Promise<TestAttempt[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('test_attempts')
            .select('*')
            .eq('test_series_id', testSeriesId)
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching test attempts:', error);
        return [];
    }
};

/**
 * Get all test attempts for the current user
 */
export const getAllTestAttempts = async (): Promise<TestAttempt[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('test_attempts')
            .select('*')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching all test attempts:', error);
        return [];
    }
};

/**
 * Delete a test series and all its attempts
 */
export const deleteTestSeries = async (id: string): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('test_series')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting test series:', error);
        return false;
    }
};

/**
 * Get test series analytics for the current user
 */
export const getTestSeriesAnalytics = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('test_series_analytics')
            .select('*')
            .eq('user_id', user.id);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching test series analytics:', error);
        return [];
    }
};
