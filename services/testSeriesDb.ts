import { supabase } from '../lib/supabase';
import { TestSeries, TestAttempt } from '../types';

// Helper for local storage
const getLocal = (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch { return null; }
};

const setLocal = (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
};

/**
 * Save a generated test series to the database
 */
export const saveTestSeries = async (
    topic: string,
    examType: string | undefined,
    difficulty: 'easy' | 'medium' | 'hard',
    questions: any[],
    referencePapers?: string,
    timeLimit?: number,
    negativeMarking?: boolean
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
                time_limit: timeLimit || questions.length * 2, // Default to 2 minutes per question if not provided
                questions,
                reference_papers: referencePapers,
                negative_marking: negativeMarking || false
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
        console.log('saveTestAttempt called with:', { testSeriesId, score, totalQuestions, timeTaken, answersCount: answers.length });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
            console.error('Auth error:', authError);
            throw new Error('Authentication error: ' + authError.message);
        }
        if (!user) {
            console.error('No user found');
            throw new Error('User not authenticated');
        }

        console.log('User authenticated, inserting test attempt...');

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

        if (error) {
            console.error('Database insert error:', error);
            throw error;
        }

        console.log('Test attempt saved successfully:', data);
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
 * Get a specific test attempt by ID with full details
 */
export const getTestAttemptById = async (attemptId: string): Promise<TestAttempt | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // First get the attempt
        const { data: attemptData, error: attemptError } = await supabase
            .from('test_attempts')
            .select('*')
            .eq('id', attemptId)
            .eq('user_id', user.id)
            .single();

        if (attemptError) throw attemptError;
        if (!attemptData) return null;

        // Then get the test series details
        const { data: seriesData, error: seriesError } = await supabase
            .from('test_series')
            .select('topic, exam_type, difficulty')
            .eq('id', attemptData.test_series_id)
            .single();

        if (seriesError) {
            console.warn('Could not fetch test series details:', seriesError);
        }

        // Combine the data
        return {
            ...attemptData,
            topic: seriesData?.topic,
            examType: seriesData?.exam_type,
            difficulty: seriesData?.difficulty
        } as TestAttempt;
    } catch (error) {
        console.error('Error fetching test attempt by ID:', error);
        return null;
    }
};

/**
 * Get test series history with details for the history view
 */
export const getTestSeriesHistoryCached = (): TestAttempt[] => {
    return getLocal('cached_test_series_history') || [];
};

export const getTestSeriesHistory = async (limit: number = 50): Promise<TestAttempt[]> => {
    if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            try {
                // First, get the test attempts
                const { data: attemptsData, error: attemptsError } = await supabase
                    .from('test_attempts')
                    .select(`
                        id,
                        user_id,
                        test_series_id,
                        score,
                        total_questions,
                        time_taken,
                        answers,
                        completed_at,
                        created_at
                    `)
                    .eq('user_id', user.id)
                    .order('completed_at', { ascending: false })
                    .limit(limit);

                if (!attemptsError && attemptsData) {
                    // Get unique test series IDs to fetch their details
                    const testSeriesIds = [...new Set(attemptsData.map(attempt => attempt.test_series_id))];

                    if (testSeriesIds.length > 0) {
                        // Fetch test series details
                        const { data: seriesData, error: seriesError } = await supabase
                            .from('test_series')
                            .select('id, topic, exam_type, difficulty')
                            .in('id', testSeriesIds);

                        if (!seriesError && seriesData) {
                            // Create a map for quick lookup
                            const seriesMap = new Map(seriesData.map(series => [series.id, series]));

                            // Combine the data
                            const result = attemptsData.map((item: any) => ({
                                id: item.id,
                                user_id: item.user_id,
                                test_series_id: item.test_series_id,
                                score: item.score,
                                total_questions: item.total_questions,
                                time_taken: item.time_taken,
                                completed_at: item.completed_at,
                                created_at: item.created_at || item.completed_at,
                                answers: item.answers,
                                // Add extended properties for UI
                                topic: seriesMap.get(item.test_series_id)?.topic,
                                examType: seriesMap.get(item.test_series_id)?.exam_type,
                                difficulty: seriesMap.get(item.test_series_id)?.difficulty
                            })) as TestAttempt[];

                            setLocal('cached_test_series_history', result);
                            return result;
                        }
                    } else {
                        // If no test series IDs, return attempts without series details
                        const result = attemptsData.map((item: any) => ({
                            id: item.id,
                            user_id: item.user_id,
                            test_series_id: item.test_series_id,
                            score: item.score,
                            total_questions: item.total_questions,
                            time_taken: item.time_taken,
                            completed_at: item.completed_at,
                            created_at: item.created_at || item.completed_at,
                            answers: item.answers,
                            // Add extended properties for UI
                            topic: undefined,
                            examType: undefined,
                            difficulty: undefined
                        })) as TestAttempt[];

                        setLocal('cached_test_series_history', result);
                        return result;
                    }
                }
            } catch (err) {
                console.error('Error fetching test series history:', err);
            }
        }
    }
    return [];
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
