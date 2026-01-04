import React, { useMemo } from 'react';
import { usePuzzlesByMonth } from '../../../hooks/usePuzzles';

interface CalendarViewProps {
    viewDate: Date;
    setViewDate: (date: Date) => void;
    onSelectDate: (date: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView: React.FC<CalendarViewProps> = ({ viewDate, setViewDate, onSelectDate }) => {
    // Determine year/month 
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;

    // Fetch data using React Query
    const { data: puzzles, isLoading, error } = usePuzzlesByMonth(year, month);

    // Convert array to efficient lookup map
    const puzzlesMap = useMemo(() => {
        const map = new Map();
        if (puzzles) {
            puzzles.forEach(p => map.set(p.date, p));
        }
        return map;
    }, [puzzles]);

    // Navigation handlers
    const changeMonth = (delta: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setViewDate(newDate);
    };

    // Calendar generation helpers
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const renderCalendarGrid = () => {
        const numDays = getDaysInMonth(viewDate);
        const padding = getFirstDayOfMonth(viewDate);
        const days = [];

        // Empty padding cells
        for (let i = 0; i < padding; i++) {
            days.push(<div key={`pad-${i}`} className="calendar-day empty" />);
        }

        // Days
        for (let i = 1; i <= numDays; i++) {
            const dayStr = String(i).padStart(2, '0');
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${dayStr}`;

            // Date logic
            const todayStr = new Date().toLocaleDateString('en-CA');
            const isToday = dateStr === todayStr;
            const isPast = dateStr < todayStr;

            // Puzzle Data
            const puzzle = puzzlesMap.get(dateStr);
            const hasPuzzle = !!puzzle;

            // Classes using existing CSS (we'll keep logical class names)
            const statusClass = (puzzle && !isPast) ? `status-${puzzle.status}` : '';

            days.push(
                <div
                    key={i}
                    className={`calendar-day ${isToday ? 'today' : ''} ${hasPuzzle ? 'has-puzzle' : ''} ${statusClass}`}
                    onClick={() => onSelectDate(dateStr)}
                    style={{
                        position: 'relative',
                        background: isPast ? 'rgba(255,255,255,0.03)' : undefined,
                        borderColor: isPast ? 'rgba(255,255,255,0.05)' : undefined
                    }}
                >
                    <span style={{ zIndex: 1, opacity: isPast ? 0.5 : 1 }}>{i}</span>

                    {/* Puzzle Metadata Overlay */}
                    {hasPuzzle && (
                        <>
                            {/* Status Dot */}
                            <div className="dot" style={{
                                background: puzzle.status === 'review' ? '#dc3545' :
                                    puzzle.status === 'draft' ? '#ffc107' : undefined
                            }} />

                            {/* Author Name */}
                            <div style={{
                                fontSize: '0.6rem',
                                position: 'absolute',
                                bottom: '12px',
                                left: 0, right: 0,
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                padding: '0 2px',
                                color: 'rgba(255,255,255,0.7)'
                            }}>
                                {puzzle.author}
                            </div>

                            {/* Approver Checkmark */}
                            {puzzle.approvedBy && (
                                <div style={{
                                    fontSize: '0.6rem',
                                    position: 'absolute',
                                    bottom: '2px',
                                    left: 0, right: 0,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    padding: '0 2px',
                                    color: 'var(--color-primary)'
                                }}>
                                    ✓ {puzzle.approvedBy}
                                </div>
                            )}
                        </>
                    )}
                </div>
            );
        }
        return days;
    };

    if (error) return <div className="error-msg">Error loading calendar data</div>;

    return (
        <div className="calendar-view">
            {/* Nav Header */}
            <div className="calendar-nav">
                <button onClick={() => changeMonth(-1)}>◀</button>
                <h2 className="calendar-header" style={{ margin: 0, color: 'var(--color-secondary)' }}>
                    {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={() => changeMonth(1)}>▶</button>
            </div>

            {/* Loading Indicator Overlay */}
            {isLoading && <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.9rem', opacity: 0.7 }}>Loading...</div>}

            <div className="calendar-grid">
                {DAYS.map(d => <div key={d} className="calendar-header">{d}</div>)}
                {renderCalendarGrid()}
            </div>

            <div className="portal-footer" style={{ textAlign: 'center', marginTop: '30px' }}>
                <p>Green = Published | Yellow = Draft | Red = Needs Review</p>
                <p style={{ marginTop: '10px' }}>Big thanks to all of our PMs!</p>
            </div>
        </div>
    );
};
