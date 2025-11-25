/**
 * SuperMemo-2 (SM-2) Algorithm Implementation
 * 
 * The SM-2 algorithm is used to calculate the interval for the next review
 * of a flashcard based on the user's performance.
 * 
 * Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

export interface SM2Item {
    interval: number;      // Days until next review
    repetitions: number;   // Consecutive successful reviews
    easeFactor: number;    // Difficulty multiplier (starts at 2.5)
}

/**
 * Calculates the next review interval, repetitions, and ease factor.
 * 
 * @param grade - The quality of the response (0-5)
 *   5 - perfect response
 *   4 - correct response after a hesitation
 *   3 - correct response recalled with serious difficulty
 *   2 - incorrect response; where the correct one seemed easy to recall
 *   1 - incorrect response; the correct one remembered
 *   0 - complete blackout
 * @param previous - The previous state of the item
 * @returns The new state of the item
 */
export const calculateSM2 = (grade: number, previous: SM2Item): SM2Item => {
    let { interval, repetitions, easeFactor } = previous;

    // 1. Update repetitions and interval
    if (grade >= 3) {
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
    } else {
        repetitions = 0;
        interval = 1;
    }

    // 2. Update ease factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

    // Ease factor should not drop below 1.3
    if (easeFactor < 1.3) {
        easeFactor = 1.3;
    }

    return { interval, repetitions, easeFactor };
};

/**
 * Helper to get the initial state for a new card
 */
export const getInitialSM2State = (): SM2Item => ({
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5
});
