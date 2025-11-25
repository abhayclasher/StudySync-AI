import React from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface StudyStreakCalendarProps {
    data: Record<string, number>;
}

const getIntensity = (minutes: number) => {
    if (minutes >= 60) return 5;
    if (minutes >= 30) return 4;
    if (minutes >= 15) return 3;
    if (minutes >= 5) return 2;
    if (minutes > 0) return 1;
    return 0;
};

const colors = [
    '#2d2d2d', // 0
    '#3b1f5c', // 1
    '#5a2a8c', // 2
    '#7b3ebf', // 3
    '#9c5ce5', // 4
    '#b784ff', // 5
];

const StudyStreakCalendar: React.FC<StudyStreakCalendarProps> = ({ data }) => {
    const end = new Date();
    const start = subDays(end, 83); // 84 days total
    const days = eachDayOfInterval({ start, end });

    return (
        <div className="flex flex-col items-center">
            <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const minutes = data[key] ?? 0;
                    const intensity = getIntensity(minutes);
                    return (
                        <div
                            key={key}
                            title={`${key}: ${minutes} min`}
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: colors[intensity] }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default StudyStreakCalendar;
