import { useState, useEffect } from 'react';
import { getPuzzleStatusForMonth, savePuzzle, getPuzzleByDate, deletePuzzle } from '../services/puzzles';
import { getMonthlyStats } from '../services/analytics';
// Import new functions
import { generatePuzzles, generateSinglePuzzle, generateIdeaList, generateHistoryEvents, generateBirthdays, generateNationalDays } from '../services/ai';
// ... existing imports ...
import { PuzzleBoard } from '../components/PuzzleBoard';
import { useUsers } from '../contexts/UsersContext';
import type { PuzzleDocument, Puzzle } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const PuzzleMasterPortal = () => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [existingPuzzles, setExistingPuzzles] = useState<Map<string, { author: string, status: 'draft' | 'review' | 'published', approvedBy?: string }>>(new Map());
    const [monthlyStats, setMonthlyStats] = useState<Map<string, { rating: number | null, score: number | null, plays: number }>>(new Map());
    const { currentUser } = useUsers();

    // Editor State
    const [loading, setLoading] = useState(false);
    const [puzzleData, setPuzzleData] = useState<PuzzleDocument | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [aiTheme, setAiTheme] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    // New Tools State
    const [ideaTopic, setIdeaTopic] = useState('');
    const [ideaList, setIdeaList] = useState<string[]>([]);
    const [ideaLoading, setIdeaLoading] = useState(false);

    const [historyEvents, setHistoryEvents] = useState<{ event: string, link: string }[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [birthdays, setBirthdays] = useState<{ event: string, link: string }[]>([]);
    const [birthdaysLoading, setBirthdaysLoading] = useState(false);

    const [nationalDays, setNationalDays] = useState<{ event: string, link: string }[]>([]);
    const [nationalDaysLoading, setNationalDaysLoading] = useState(false);

    // Real-time validation state
    const [validationErrors, setValidationErrors] = useState<{ [index: number]: string | null }>({});


    // Initial load for calendar
    useEffect(() => {
        loadMonthStatus();
    }, [viewDate]);

    // Auto-save draft to LocalStorage
    useEffect(() => {
        if (puzzleData && selectedDate) {
            const key = `puzzle_draft_${selectedDate}`;
            localStorage.setItem(key, JSON.stringify(puzzleData));
        }
    }, [puzzleData, selectedDate]);

    // Warn on close/refresh if unsaved changes might be lost (though LS saves them, this is good practice)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (puzzleData) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [puzzleData]);

    const loadMonthStatus = async () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth() + 1;
        const [stati, stats] = await Promise.all([
            getPuzzleStatusForMonth(year, month),
            getMonthlyStats(year, month)
        ]);
        console.log("Portal Loaded Stats:", stats, "Size:", stats.size);
        setExistingPuzzles(stati);
        setMonthlyStats(stats);
    };

    const handleNavigateDay = (delta: number) => {
        if (!selectedDate) return;

        // Parse current date
        const parts = selectedDate.split('-');
        const current = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

        // Add delta
        current.setDate(current.getDate() + delta);

        // Format back to YYYY-MM-DD
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const dayStr = String(current.getDate()).padStart(2, '0');
        const newDateStr = `${year}-${month}-${dayStr}`;

        // Update viewDate if month changed so calendar background is correct when returning
        if (current.getMonth() !== viewDate.getMonth() || current.getFullYear() !== viewDate.getFullYear()) {
            setViewDate(new Date(current.getFullYear(), current.getMonth(), 1));
        }

        // Reuse handleDateClick logic by extracting day num, but we can just call this directly
        // However, handleDateClick expects a day number and uses viewDate. 
        // It's safer to refactor or just set the state and call logic. 
        // Actually, handleDateClick is bound to viewDate. Let's redirect properly.

        // Let's copy the load logic to a robust function to avoid 'viewDate' dependency mess? 
        // Or just call handleDateClick with the new day if month matches?
        // Simpler: Just recursively call handleDateClick-like logic.

        // Refactored Load Logic to be Date-String based:
        loadPuzzleForDate(newDateStr);
    };

    const loadPuzzleForDate = async (fullDate: string) => {
        setSelectedDate(fullDate);
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        const localDraft = localStorage.getItem(`puzzle_draft_${fullDate}`);
        const existing = await getPuzzleByDate(fullDate);

        if (localDraft) {
            try {
                const draftData = JSON.parse(localDraft);
                setPuzzleData(draftData);
                setSuccessMsg("Restored unsaved draft from this device.");
            } catch (e) {
                if (existing) setPuzzleData(existing);
            }
        } else if (existing) {
            setPuzzleData(existing);
        } else {
            setPuzzleData({
                date: fullDate,
                puzzles: Array(5).fill(null).map(() => ({ clue: '', answer: '', revealOrder: [] })) as any,
                author: currentUser?.handle || 'Anonymous',
                status: 'draft'
            });
        }
        setLoading(false);
    };

    const handleDateClick = async (day: number) => {
        const year = viewDate.getFullYear();
        const month = String(viewDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const fullDate = `${year}-${month}-${dayStr}`;
        loadPuzzleForDate(fullDate);
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setViewDate(newDate);
    };

    const validatePuzzle = (data: PuzzleDocument, isDraft: boolean = false): string | null => {
        const seenWords = new Set<string>();
        const repeats = new Set<string>();

        for (let i = 0; i < data.puzzles.length; i++) {
            const p = data.puzzles[i];

            // Drafts: Allow empty, but skip validation if empty
            if (isDraft && (!p.clue.trim() || !p.answer.trim())) {
                continue;
            }

            // Hard Stop: Empty fields (Non-Draft)
            if (!isDraft && (!p.clue.trim() || !p.answer.trim())) {
                return `Puzzle #${i + 1}: Clue and Answer are required.`;
            }

            // Hard Stop: Max length
            if (p.clue.length > 100) return `Puzzle #${i + 1}: Clue must be under 100 characters (Current: ${p.clue.length}).`;
            if (p.answer.length > 50) return `Puzzle #${i + 1}: Answer must be under 50 characters (Current: ${p.answer.length}).`;

            // Hard Stop: Letters and spaces only
            if (!/^[A-Z ]+$/.test(p.answer)) {
                return `Puzzle #${i + 1}: Answer must contain only uppercase letters and spaces.`;
            }

            // Hard Stop: No words > 10 chars
            const words = p.answer.split(' ');
            for (const word of words) {
                if (word.length > 10) {
                    return `Puzzle #${i + 1}: Word "${word}" is too long (Max 10 chars. per word).`;
                }
                if (seenWords.has(word) && word.length > 2) {
                    repeats.add(word);
                }
                seenWords.add(word);
            }
        }
        return null;
    };

    const preparePuzzlesForSave = (data: PuzzleDocument) => {
        return data.puzzles.map(p => ({
            ...p,
            revealOrder: Array.from(new Set(p.answer.replace(/[^A-Z]/g, '').split('')))
                .sort((a, b) => { // Deterministic pseudo-random sort for consistency
                    return (a.charCodeAt(0) * 13 + 7) % 100 - (b.charCodeAt(0) * 13 + 7) % 100;
                })
        })) as [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle];
    };

    const handleSave = async (targetStatus: 'draft' | 'review' | 'published') => {
        if (!puzzleData || !selectedDate) return;

        setError(null);
        setSuccessMsg(null);

        const validationError = validatePuzzle(puzzleData, targetStatus === 'draft');
        if (validationError) {
            setError(validationError);
            alert("❌ Save Failed:\n\n" + validationError + "\n\n(Drafts can be partial, but Review/Publish requires 100% completion.)");
            return;
        }

        const preparedPuzzles = preparePuzzlesForSave(puzzleData);

        // Define approver BEFORE optimistic update
        const approver = targetStatus === 'published' ? (currentUser?.handle || 'Unknown') : undefined;

        setLoading(true);

        // Optimistically update calendar view IMMEDIATELY (True Optimistic UI)
        setExistingPuzzles(prev => {
            const newMap = new Map(prev);
            newMap.set(selectedDate, {
                author: puzzleData.author || 'Anonymous',
                status: targetStatus,
                approvedBy: approver // Now included!
            });
            return newMap;
        });

        try {
            await savePuzzle(selectedDate, preparedPuzzles, puzzleData.author, targetStatus, approver);

            // Update local state to reflect changes immediately
            setPuzzleData({ ...puzzleData, status: targetStatus, approvedBy: approver });

            let msg = "Puzzle saved!";
            if (targetStatus === 'draft') msg = "Draft saved successfully. (Yellow on calendar)";
            if (targetStatus === 'review') msg = "submitted for review! (Red on calendar)";
            if (targetStatus === 'published') msg = "Puzzle Approved & Published!";

            setSuccessMsg(msg);
            // Clear draft on successful save
            localStorage.removeItem(`puzzle_draft_${selectedDate}`);

            // Note: We don't fetch from DB here to preserve the optimistic update
        } catch (e: any) {
            console.error("Save failed:", e);
            setError(e.message);
            alert("❌ Save Failed: " + e.message);
            // Revert state on failure
            await loadMonthStatus();
        }
        setLoading(false);
    };

    const handleDeleteDay = async () => {
        if (!selectedDate) return;

        setLoading(true);
        try {
            // Delete from DB
            await deletePuzzle(selectedDate);

            // Delete drom Local Storage
            localStorage.removeItem(`puzzle_draft_${selectedDate}`);

            // Optimistic Update
            setExistingPuzzles(prev => {
                const newMap = new Map(prev);
                newMap.delete(selectedDate);
                return newMap;
            });

            setSuccessMsg("Puzzle deleted successfully.");
            setSelectedDate(null); // Return to calendar
        } catch (e: any) {
            console.error("Delete failed:", e);
            setError("Failed to delete puzzle: " + e.message);
            alert("❌ Delete Failed: " + e.message);
        }
        setLoading(false);
    };

    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const renderCalendar = () => {
        const numDays = getDaysInMonth(viewDate);
        const padding = getFirstDayOfMonth(viewDate);
        const days = [];

        for (let i = 0; i < padding; i++) {
            days.push(<div key={`pad-${i}`} className="calendar-day empty" />);
        }

        for (let i = 1; i <= numDays; i++) {
            const year = viewDate.getFullYear();
            const month = String(viewDate.getMonth() + 1).padStart(2, '0');
            const dayStr = String(i).padStart(2, '0');
            const dateStr = `${year}-${month}-${dayStr}`;
            const isToday = dateStr === new Date().toLocaleDateString('en-CA');
            const isPast = dateStr < new Date().toLocaleDateString('en-CA');
            const existing = existingPuzzles.get(dateStr);
            const hasPuzzle = !!existing;
            const stats = monthlyStats.get(dateStr);

            // Status Styling
            const statusClass = (existing && !isPast) ? `status-${existing.status}` : '';

            days.push(
                <div
                    key={i}
                    className={`calendar-day ${isToday ? 'today' : ''} ${hasPuzzle ? 'has-puzzle' : ''} ${statusClass}`}
                    onClick={() => handleDateClick(i)}
                    style={{
                        position: 'relative',
                        background: isPast ? 'rgba(255,255,255,0.03)' : undefined,
                        borderColor: isPast ? 'rgba(255,255,255,0.05)' : undefined
                    }}
                >
                    <span style={{ zIndex: 1, opacity: isPast ? 0.5 : 1 }}>{i}</span>

                    {/* Stats Overlay - Simplified to just Plays at top */}
                    {isPast && stats && (
                        <div style={{
                            position: 'absolute', top: '5px', right: '5px',
                            textAlign: 'right', fontSize: '0.75rem', fontWeight: 'bold',
                            color: 'var(--color-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}>
                            {stats.plays > 0 ? `${stats.plays}` : ''}
                        </div>
                    )}

                    {
                        hasPuzzle && (
                            <>
                                <div className="dot" style={{ background: existing?.status === 'review' ? '#dc3545' : existing?.status === 'draft' ? '#ffc107' : undefined }} />
                                <div style={{
                                    fontSize: '0.6rem',
                                    position: 'absolute',
                                    bottom: '12px',
                                    left: 0,
                                    right: 0,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    padding: '0 2px',
                                    color: 'rgba(255,255,255,0.7)'
                                }}>
                                    {existing.author}
                                </div>
                                {existing.approvedBy && (
                                    <div style={{
                                        fontSize: '0.6rem',
                                        position: 'absolute',
                                        bottom: '2px',
                                        left: 0,
                                        right: 0,
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        padding: '0 2px',
                                        color: '#4ECDC4'
                                    }}>
                                        ✓ {existing.approvedBy}
                                    </div>
                                )}
                            </>
                        )
                    }
                </div >
            );
        }

        return (
            <div className="calendar-grid">
                {DAYS.map(d => <div key={d} className="calendar-header">{d}</div>)}
                {days}
            </div>
        );
    };

    const today = new Date().toLocaleDateString('en-CA');
    const isReadOnly = selectedDate ? selectedDate <= today : false;

    if (loading) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Portal...</div>;
    }

    const movePuzzle = (index: number, direction: -1 | 1) => {
        if (!puzzleData) return;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= puzzleData.puzzles.length) return;

        const newPuzzles = [...puzzleData.puzzles];
        [newPuzzles[index], newPuzzles[newIndex]] = [newPuzzles[newIndex], newPuzzles[index]];
        setPuzzleData({ ...puzzleData, puzzles: newPuzzles as [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle] });
    };

    if (selectedDate && puzzleData) {
        return (
            <div className="puzzle-editor">
                {/* Header Restructured for Mobile */}
                <div className="editor-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <button onClick={() => setSelectedDate(null)} className="back-btn">← Back</button>

                        {/* Navigation Wrapper */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                onClick={() => handleNavigateDay(-1)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer', fontSize: '1.2rem', padding: '5px', opacity: 0.8 }}
                                title="Previous Day"
                            >
                                ◀
                            </button>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedDate}</h2>
                            <button
                                onClick={() => handleNavigateDay(1)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer', fontSize: '1.2rem', padding: '5px', opacity: 0.8 }}
                                title="Next Day"
                            >
                                ▶
                            </button>
                        </div>

                        <button onClick={() => setShowPreview(true)} className="save-btn" style={{ background: 'var(--color-secondary)', color: 'black', padding: '5px 15px' }}>
                            Preview
                        </button>
                        <button className="delete-btn"
                            onClick={() => {
                                if (confirm("☠️ Are you sure you want to PERMANENTLY DELETE this day?\nThis cannot be undone.")) {
                                    handleDeleteDay();
                                }
                            }}
                            disabled={loading}
                            style={{
                                background: '#dc3545', color: 'white', border: 'none',
                                padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '10px'
                            }}
                            title="Delete Day & Reset"
                        >
                            🗑️
                        </button>
                    </div>
                </div>

                {/* Status & Metadata Box */}
                <div style={{
                    background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', marginBottom: '15px',
                    border: puzzleData.status === 'draft' ? '1px dashed #ffc107' : puzzleData.status === 'review' ? '1px solid #dc3545' : '1px solid var(--color-primary)',
                    display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.9rem' }}>
                        <span>Author: <strong>{puzzleData.author}</strong></span>
                        <span>Status: <strong style={{
                            color: puzzleData.status === 'draft' ? '#ffc107' : puzzleData.status === 'review' ? '#dc3545' : '#4ecdc4'
                        }}>
                            {(() => {
                                if (puzzleData.status === 'draft') return 'WORK IN PROGRESS';
                                if (puzzleData.status === 'review') return 'READY FOR REVIEW';
                                if (puzzleData.status === 'published') {
                                    const todayStr = new Date().toLocaleDateString('en-CA');
                                    return selectedDate && selectedDate > todayStr ? 'APPROVED TO PUBLISH' : 'PUBLISHED';
                                }
                                return 'NOT STARTED';
                            })()}
                        </strong></span>
                        {puzzleData.approvedBy && <span>Approver: <strong>{puzzleData.approvedBy}</strong></span>}
                    </div>
                    {isReadOnly && <span style={{
                        alignSelf: 'center', fontSize: '0.8rem', background: 'var(--color-secondary)', color: 'black',
                        padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold'
                    }}>READ ONLY (PAST)</span>}
                </div>

                {/* Action Buttons (Top) */}
                {!isReadOnly && (
                    <div className="editor-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px', marginTop: 0, flexWrap: 'wrap' }}>
                        <button
                            onClick={() => handleSave('draft')}
                            disabled={loading || puzzleData.status === 'published'}
                            style={{
                                background: puzzleData.status === 'published' ? '#444' : '#ffc107',
                                color: puzzleData.status === 'published' ? '#888' : 'black',
                                border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: '1 1 auto', minWidth: '120px'
                            }}
                        >
                            {loading ? '...' : 'Save Draft 💾'}
                        </button>

                        <button
                            onClick={() => handleSave('review')}
                            disabled={loading || puzzleData.status === 'published'}
                            style={{
                                background: puzzleData.status === 'published' ? '#444' : '#dc3545',
                                color: puzzleData.status === 'published' ? '#888' : 'white',
                                border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: '1 1 auto', minWidth: '120px'
                            }}
                        >
                            {loading ? '...' : 'Submit Review 🚩'}
                        </button>

                        {puzzleData.status === 'published' ? (
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to UN-APPROVE this puzzle?\nIt will be moved back to 'Work in Progress' (Draft).")) {
                                        handleSave('draft');
                                    }
                                }}
                                disabled={loading}
                                style={{ background: '#666', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: '1 1 auto', minWidth: '120px' }}
                            >
                                {loading ? '...' : 'Unapprove ↩️'}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleSave('published')}
                                disabled={loading || puzzleData.status !== 'review'}
                                style={{
                                    background: puzzleData.status !== 'review' ? '#444' : 'var(--color-primary)',
                                    color: puzzleData.status !== 'review' ? '#888' : 'white',
                                    border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: '1 1 auto', minWidth: '120px'
                                }}
                            >
                                {loading ? '...' : 'Approve ✅'}
                            </button>
                        )}
                    </div>
                )}

                <div className="editor-form">
                    {isReadOnly && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '15px',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)'
                        }}>
                            <h3 style={{ margin: '0 0 15px 0', textAlign: 'center', color: 'var(--color-primary)' }}>Archived Puzzle Stats</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{monthlyStats.get(selectedDate)?.plays || 0}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Plays</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>{monthlyStats.get(selectedDate)?.score || '-'}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Avg Score</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>{monthlyStats.get(selectedDate)?.rating || '-'}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Rating</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{puzzleData.author}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Puzzle Master</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isReadOnly && (
                        <div className="form-group">
                            <label>AI Theme (Optional)</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    value={aiTheme}
                                    onChange={e => setAiTheme(e.target.value)}
                                    placeholder="e.g. 80s Movies"
                                    style={{ flex: 1 }}
                                />
                                <button
                                    onClick={async () => {
                                        if (!aiTheme) {
                                            alert("Please enter a theme first");
                                            return;
                                        }
                                        setAiLoading(true);
                                        try {
                                            const generated = await generatePuzzles(aiTheme);
                                            setPuzzleData({ ...puzzleData, puzzles: generated } as PuzzleDocument);
                                            setSuccessMsg("Generated 5 new puzzles!");
                                        } catch (e: any) {
                                            setError(e.message);
                                        }
                                        setAiLoading(false);
                                    }}
                                    disabled={aiLoading}
                                    style={{
                                        whiteSpace: 'nowrap',
                                        background: 'var(--color-accent)',
                                        border: 'none',
                                        borderRadius: '5px',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        padding: '0 15px',
                                        cursor: 'pointer',
                                        opacity: aiLoading ? 0.7 : 1
                                    }}
                                >
                                    {aiLoading ? '...' : '✨ Magic Fill'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="puzzles-container">
                        {puzzleData.puzzles.map((p, idx) => (
                            <div key={idx} className="puzzle-row">
                                <div className="row-controls">
                                    <span className="row-num">{idx + 1}</span>
                                    {!isReadOnly && (
                                        <>
                                            <div className="move-btns">
                                                <button disabled={idx === 0} onClick={() => movePuzzle(idx, -1)}>▲</button>
                                                <button disabled={idx === puzzleData.puzzles.length - 1} onClick={() => movePuzzle(idx, 1)}>▼</button>
                                            </div>
                                            <button
                                                title="Regenerate this puzzle only"
                                                onClick={async () => {
                                                    if (!aiTheme) {
                                                        alert("Please enter a theme above first");
                                                        return;
                                                    }
                                                    setAiLoading(true);
                                                    try {
                                                        const otherAnswers = puzzleData.puzzles.filter((_, i) => i !== idx).map(pz => pz.answer);
                                                        const newPuzzle = await generateSinglePuzzle(aiTheme, otherAnswers);

                                                        const newPuzzles = [...puzzleData.puzzles];
                                                        newPuzzles[idx] = newPuzzle;
                                                        setPuzzleData({ ...puzzleData, puzzles: newPuzzles as any });
                                                    } catch (e: any) {
                                                        alert(e.message);
                                                    }
                                                    setAiLoading(false);
                                                }}
                                                className="magic-btn"
                                            >
                                                ✨
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="puzzle-inputs">
                                    <div className="input-group">
                                        <label>Clue</label>
                                        <textarea
                                            value={p.clue}
                                            onChange={e => {
                                                const newPuzzles = [...puzzleData.puzzles];
                                                newPuzzles[idx] = { ...p, clue: e.target.value };
                                                setPuzzleData({ ...puzzleData, puzzles: newPuzzles as any });
                                            }}
                                            maxLength={100}
                                            disabled={isReadOnly || puzzleData.status === 'published'}
                                            rows={2}
                                            style={{ width: '100%', resize: 'vertical' }}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Answer</label>
                                        <input
                                            value={p.answer}
                                            onChange={e => {
                                                // Allow typing freely, validate real-time
                                                const val = e.target.value;
                                                const newPuzzles = [...puzzleData.puzzles];
                                                newPuzzles[idx] = { ...p, answer: val };
                                                setPuzzleData({ ...puzzleData, puzzles: newPuzzles as any });

                                                // Real-time validation check
                                                let errorMsg = null;
                                                const words = val.toUpperCase().split(' ');
                                                for (const w of words) {
                                                    if (w.length > 10) {
                                                        errorMsg = "Max 10 chars. per word";
                                                        break;
                                                    }
                                                }
                                                setValidationErrors(prev => ({ ...prev, [idx]: errorMsg }));
                                            }}
                                            onBlur={() => {
                                                // Format on blur
                                                const val = p.answer.toUpperCase().replace(/[^A-Z ]/g, '');
                                                const newPuzzles = [...puzzleData.puzzles];
                                                newPuzzles[idx] = { ...p, answer: val };
                                                setPuzzleData({ ...puzzleData, puzzles: newPuzzles as any });
                                            }}
                                            maxLength={50}
                                            disabled={isReadOnly || puzzleData.status === 'published'}
                                            style={{
                                                width: '100%',
                                                borderColor: validationErrors[idx] ? 'var(--color-error)' : undefined
                                            }}
                                        />
                                        {validationErrors[idx] && (
                                            <div style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '2px' }}>
                                                {validationErrors[idx]}
                                            </div>
                                        )}
                                    </div>
                                    {/* New Comment Field for Approver/PM Communication (Moved below Answer) */}
                                    <div className="input-group" style={{ marginTop: '5px' }}>
                                        <label style={{ fontSize: '0.8rem', color: '#aaa' }}>Comments / Notes</label>
                                        <input
                                            value={p.comment || ''}
                                            onChange={e => {
                                                const newPuzzles = [...puzzleData.puzzles];
                                                newPuzzles[idx] = { ...p, comment: e.target.value };
                                                setPuzzleData({ ...puzzleData, puzzles: newPuzzles as any });
                                            }}
                                            placeholder="Optional note for reviewer..."
                                            disabled={isReadOnly || puzzleData.status === 'published'}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid #444',
                                                fontSize: '0.85rem',
                                                padding: '4px 8px'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isReadOnly && (
                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <button
                                onClick={async () => {
                                    if (!selectedDate) return;
                                    if (confirm(`ARE YOU SURE?\n\nThis will permanently DELETE the puzzle for ${selectedDate}.\nThis cannot be undone.`)) {
                                        setLoading(true);
                                        try {
                                            await deletePuzzle(selectedDate);
                                            // Clear draft if exists
                                            localStorage.removeItem(`puzzle_draft_${selectedDate}`);

                                            // Refresh calendar
                                            await loadMonthStatus();

                                            // Go back
                                            setSelectedDate(null);
                                        } catch (e: any) {
                                            alert("Error deleting: " + e.message);
                                            setLoading(false);
                                        }
                                    }
                                }}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #dc3545',
                                    color: '#dc3545',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    opacity: 0.8
                                }}
                            >
                                🗑️ Clear / Delete Day
                            </button>
                        </div>
                    )}

                    {error && <div className="error-msg">{error}</div>}
                    {successMsg && <div className="success-msg">{successMsg}</div>}



                    {!isReadOnly && (
                        <div style={{ marginTop: '40px', borderTop: '1px solid #444', paddingTop: '20px' }}>
                            <h3 style={{ color: 'var(--color-primary)' }}>🛠️ Puzzle Master Tools</h3>

                            {/* Tool 1: Idea Generator */}
                            <div style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px' }}>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>💡 Inspiration List Generator</label>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <input
                                        value={ideaTopic}
                                        onChange={e => setIdeaTopic(e.target.value)}
                                        placeholder="Enter topic (e.g. '90s Sitcoms', 'Types of Cheese')"
                                        style={{ flex: 1, padding: '8px', borderRadius: '5px', border: 'none' }}
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!ideaTopic) return;
                                            setIdeaLoading(true);
                                            const res = await generateIdeaList(ideaTopic);
                                            setIdeaList(res);
                                            setIdeaLoading(false);
                                        }}
                                        disabled={ideaLoading}
                                        style={{
                                            background: 'var(--color-secondary)', color: 'black', border: 'none',
                                            padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                                        }}
                                    >
                                        {ideaLoading ? 'Generating...' : 'Get Ideas'}
                                    </button>
                                </div>
                                {ideaList.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {ideaList.map((item, i) => (
                                            <span key={i} style={{
                                                background: 'rgba(255,255,255,0.1)', padding: '4px 10px',
                                                borderRadius: '15px', fontSize: '0.9rem'
                                            }}>
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tool 2: This Day in History */}
                            <div style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px' }}>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📜 This Day in History ({selectedDate})</label>
                                {historyEvents.length === 0 ? (
                                    <button
                                        onClick={async () => {
                                            if (!selectedDate) return;
                                            setHistoryLoading(true);
                                            const res = await generateHistoryEvents(selectedDate);
                                            setHistoryEvents(res);
                                            setHistoryLoading(false);
                                        }}
                                        disabled={historyLoading}
                                        style={{
                                            background: 'var(--color-accent)', color: 'white', border: 'none',
                                            padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                                        }}
                                    >
                                        {historyLoading ? 'Searching...' : 'Find Historical Events'}
                                    </button>
                                ) : (
                                    <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>Showing {historyEvents.length} events</h4>
                                        <button
                                            onClick={() => setHistoryEvents([])}
                                            style={{ background: 'transparent', border: '1px solid #666', color: '#aaa', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}

                                {historyEvents.length > 0 && (
                                    <>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {historyEvents.map((evt, i) => (
                                                <li key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <div style={{ marginBottom: '3px' }}>{evt.event}</div>
                                                    <a
                                                        href={evt.link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{ color: 'var(--color-primary)', fontSize: '0.85rem', textDecoration: 'none' }}
                                                    >
                                                        Read on Wikipedia →
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={async () => {
                                                if (!selectedDate) return;
                                                setHistoryLoading(true);
                                                // Extract existing event descriptions to exclude
                                                const existingDescriptions = historyEvents.map(e => e.event);
                                                const res = await generateHistoryEvents(selectedDate, existingDescriptions);

                                                // Append new unique events
                                                setHistoryEvents(prev => [...prev, ...res]);
                                                setHistoryLoading(false);
                                            }}
                                            disabled={historyLoading}
                                            style={{
                                                width: '100%',
                                                marginTop: '15px',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                color: 'var(--color-primary)',
                                                border: '1px dashed var(--color-primary)',
                                                padding: '10px',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {historyLoading ? 'Searching...' : 'Load More Events (+10)'}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Tool 3: Famous Birthdays */}
                            <div style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px' }}>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>🎂 Famous Birthdays ({selectedDate})</label>

                                {birthdays.length === 0 ? (
                                    <button
                                        onClick={async () => {
                                            if (!selectedDate) return;
                                            setBirthdaysLoading(true);
                                            const res = await generateBirthdays(selectedDate);
                                            setBirthdays(res);
                                            setBirthdaysLoading(false);
                                        }}
                                        disabled={birthdaysLoading}
                                        style={{
                                            background: 'var(--color-primary)', color: 'white', border: 'none',
                                            padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                                        }}
                                    >
                                        {birthdaysLoading ? 'Searching...' : 'Find Birthdays'}
                                    </button>
                                ) : (
                                    <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>Found {birthdays.length} birthdays</h4>
                                        <button
                                            onClick={() => setBirthdays([])}
                                            style={{ background: 'transparent', border: '1px solid #666', color: '#aaa', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}

                                {birthdays.length > 0 && (
                                    <>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {birthdays.map((evt, i) => (
                                                <li key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <div style={{ marginBottom: '3px' }}>{evt.event}</div>
                                                    <a href={evt.link} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', textDecoration: 'none' }}>
                                                        Read on Wikipedia →
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={async () => {
                                                if (!selectedDate) return;
                                                setBirthdaysLoading(true);
                                                const existing = birthdays.map(e => e.event);
                                                const res = await generateBirthdays(selectedDate, existing);
                                                setBirthdays(prev => [...prev, ...res]);
                                                setBirthdaysLoading(false);
                                            }}
                                            disabled={birthdaysLoading}
                                            style={{
                                                width: '100%', marginTop: '15px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--color-primary)',
                                                border: '1px dashed var(--color-primary)', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                                            }}
                                        >
                                            {birthdaysLoading ? 'Searching...' : 'Load More Birthdays (+10)'}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Tool 4: National Days */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px' }}>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>🎉 National Days & Holidays ({selectedDate})</label>

                                {nationalDays.length === 0 ? (
                                    <button
                                        onClick={async () => {
                                            if (!selectedDate) return;
                                            setNationalDaysLoading(true);
                                            const res = await generateNationalDays(selectedDate);
                                            setNationalDays(res);
                                            setNationalDaysLoading(false);
                                        }}
                                        disabled={nationalDaysLoading}
                                        style={{
                                            background: '#ff69b4', color: 'white', border: 'none', // Hot pink for holidays
                                            padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                                        }}
                                    >
                                        {nationalDaysLoading ? 'Searching...' : 'Find National Days'}
                                    </button>
                                ) : (
                                    <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>Found {nationalDays.length} days</h4>
                                        <button
                                            onClick={() => setNationalDays([])}
                                            style={{ background: 'transparent', border: '1px solid #666', color: '#aaa', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}

                                {nationalDays.length > 0 && (
                                    <>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {nationalDays.map((evt, i) => (
                                                <li key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <div style={{ marginBottom: '3px' }}>{evt.event}</div>
                                                    <a href={evt.link} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', textDecoration: 'none' }}>
                                                        Read on Wikipedia →
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={async () => {
                                                if (!selectedDate) return;
                                                setNationalDaysLoading(true);
                                                const existing = nationalDays.map(e => e.event);
                                                const res = await generateNationalDays(selectedDate, existing);
                                                setNationalDays(prev => [...prev, ...res]);
                                                setNationalDaysLoading(false);
                                            }}
                                            disabled={nationalDaysLoading}
                                            style={{
                                                width: '100%', marginTop: '15px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--color-primary)',
                                                border: '1px dashed var(--color-primary)', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                                            }}
                                        >
                                            {nationalDaysLoading ? 'Searching...' : 'Load More National Days (+10)'}
                                        </button>
                                    </>
                                )}
                            </div>



                        </div>
                    )}
                </div>

                {showPreview && (
                    <div className="modal-overlay" onClick={() => setShowPreview(false)}>
                        <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }} onClick={e => e.stopPropagation()}>
                            <h2 style={{ color: 'var(--color-primary)', marginBottom: '20px' }}>Preview</h2>
                            <PuzzleBoard
                                puzzles={preparePuzzlesForSave(puzzleData).map(p => ({ ...p, revealOrder: [] })) as any}
                                currentLevel={0}
                                guessedLetters={new Set()}
                                revealedLetters={new Set()}
                                gameStatus='playing'
                                showAll={true}
                            />
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                                <button className="btn-confirm" onClick={() => setShowPreview(false)}>Close Preview</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="puzzle-master-portal">
            <div className="calendar-nav">
                <button onClick={() => changeMonth(-1)}>←</button>
                <h2>{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => changeMonth(1)}>→</button>
            </div>
            {renderCalendar()}
            <p className="portal-footer">Thanks to our Puzzle Masters for creating the fun!</p>
        </div>
    );
};
