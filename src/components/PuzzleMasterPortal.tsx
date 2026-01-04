import React, { useState } from 'react';
import { CalendarView } from '../features/admin/Calendar/CalendarView';
import { PuzzleEditor } from '../features/admin/PuzzleEditor/PuzzleEditor';

export const PuzzleMasterPortal: React.FC = () => {
    // Top-level navigation state
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // If a date is selected, show the Editor
    if (selectedDate) {
        return (
            <PuzzleEditor
                date={selectedDate}
                onBack={() => setSelectedDate(null)}
                onNavigate={(delta) => {
                    // Calculate next day string
                    const curr = new Date(selectedDate);
                    curr.setDate(curr.getDate() + delta);
                    const y = curr.getFullYear();
                    const m = String(curr.getMonth() + 1).padStart(2, '0');
                    const d = String(curr.getDate()).padStart(2, '0');
                    const nextDateStr = `${y}-${m}-${d}`;
                    setSelectedDate(nextDateStr);

                    // Sync viewDate for when we return
                    if (curr.getMonth() !== viewDate.getMonth()) {
                        const newView = new Date(viewDate);
                        newView.setMonth(curr.getMonth());
                        newView.setFullYear(curr.getFullYear());
                        setViewDate(newView);
                    }
                }}
            />
        );
    }

    // Otherwise, show the Calendar
    return (
        <div className="puzzle-master-portal">
            <h1 style={{ margin: '20px 0', color: 'var(--color-primary)', textAlign: 'center' }}>Puzzle Master Portal</h1>
            <CalendarView
                viewDate={viewDate}
                setViewDate={setViewDate}
                onSelectDate={setSelectedDate}
            />
        </div>
    );
};
