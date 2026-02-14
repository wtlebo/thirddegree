import React, { useMemo } from 'react';
import { usePuzzlesByMonth } from '../../../hooks/usePuzzles';
import type { PuzzleDocument } from '../../../types';

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
        const map = new Map<string, PuzzleDocument>();
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

            // Classes
            const statusClass = (puzzle && !isPast) ? `status-${puzzle.status}` : '';

            // Status Logic (Votes & Colors)
            let dotColor = '#999';
            let dotBorder = 'none';
            let approveVotes = 0;

            if (puzzle) {
                approveVotes = puzzle.votes?.filter(v => v.vote === 'approve').length || 0;
                const needsChangeVotes = puzzle.votes?.filter(v => v.vote === 'needs_change').length || 0;
                const isReady = approveVotes >= 3;
                // const isPublished = puzzle.status === 'published' || puzzle.status === 'ready'; // Unused, using direct check below

                if (puzzle.status === 'draft') {
                    dotColor = '#2196f3'; // Blue
                    dotBorder = '1px dashed #fff';
                }
                else if (puzzle.status === 'published') dotColor = '#4caf50'; // Published always Green
                else if (needsChangeVotes > 0) dotColor = '#f44336'; // Needs Change? Red!
                else if (isReady || puzzle.status === 'ready') dotColor = '#4caf50'; // Ready? Green
                else if (puzzle.status === 'beta') dotColor = '#ffc107'; // Testing? Yellow
            }

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
                            {/* Status Dot & Votes */}
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                            }}>
                                <div className="dot" style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: dotColor,
                                    border: dotBorder
                                }} />
                                {(puzzle.status === 'beta' || puzzle.status === 'ready' || puzzle.status === 'published') && (
                                    <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                                        {approveVotes}/3
                                    </span>
                                )}
                            </div>

                            {/* Author Name */}
                            <div style={{
                                fontSize: '0.6rem',
                                position: 'absolute',
                                bottom: '2px', // Moved up slightly since checkmark is gone
                                left: 0, right: 0,
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                padding: '0 2px',
                                opacity: 0.7
                            }}>
                                {puzzle.author}
                            </div>


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
            {isLoading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10
                }}>
                    Loading...
                </div>
            )}

            <div className="calendar-grid">
                {DAYS.map(day => <div key={day} className="calendar-day-header">{day}</div>)}
                {renderCalendarGrid()}
            </div>

            {/* Visual Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4caf50' }}></div>
                    <span style={{ fontSize: '0.85rem' }}>Ready</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffc107' }}></div>
                    <span style={{ fontSize: '0.85rem' }}>Needs Approval</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f44336' }}></div>
                    <span style={{ fontSize: '0.85rem' }}>Needs Change</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2196f3', border: '1px dashed #fff' }}></div>
                    <span style={{ fontSize: '0.85rem' }}>Draft</span>
                </div>
            </div>
        </div>
    );
};

