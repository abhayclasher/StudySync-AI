import React from 'react';
import { EnhancedNotesInterface } from './notes/EnhancedNotesInterface';

interface NotesManagerProps {
    type: 'video' | 'custom';
}

export const NotesManager: React.FC<NotesManagerProps> = ({ type }) => {
    return (
        <EnhancedNotesInterface type={type} />
    );
};

export default NotesManager;
