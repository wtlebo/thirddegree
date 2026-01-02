import { useState, useEffect } from 'react';
import { getPuzzleStatusForMonth, savePuzzle, getPuzzleByDate } from '../services/puzzles';
import { getMonthlyStats } from '../services/analytics';
// Import new functions
import { generatePuzzles, generateSinglePuzzle, generateIdeaList, generateHistoryEvents } from '../services/ai';
// ... existing imports ...
import { PuzzleBoard } from '../components/PuzzleBoard';
import { useUsers } from '../contexts/UsersContext';
import type { PuzzleDocument, Puzzle } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const PuzzleMasterPortal = () => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [existingPuzzles, setExistingPuzzles] = useState<Map<string, string>>(new Map());
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

    // Real-time validation state
    const [validationErrors, setValidationErrors] = useState<{ [index: number]: string | null }>({});


    // Initial load for calendar
    useEffect(() => {
        loadMonthStatus();
    }, [viewDate]);

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

    const handleDateClick = async (day: number) => {
        const year = viewDate.getFullYear();
        const month = String(viewDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const fullDate = `${year}-${month}-${dayStr}`;

        setSelectedDate(fullDate);
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        // Try to load existing
        const existing = await getPuzzleByDate(fullDate);
        if (existing) {
            setPuzzleData(existing);
        } else {
            // Template
            setPuzzleData({
                date: fullDate,
                puzzles: [
                    { clue: '', answer: '', revealOrder: [] },
                    { clue: '', answer: '', revealOrder: [] },
                    { clue: '', answer: '', revealOrder: [] },
                    { clue: '', answer: '', revealOrder: [] },
                    { clue: '', answer: '', revealOrder: [] }
                ] as any,
                author: currentUser?.handle || 'Anonymous',
                status: 'draft'
            });
        }
        setLoading(false);
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setViewDate(newDate);
    };

    const validatePuzzle = (data: PuzzleDocument): string | null => {
        const seenWords = new Set<string>();
        const repeats = new Set<string>();

        for (let i = 0; i < data.puzzles.length; i++) {
            const p = data.puzzles[i];

            // Hard Stop: Empty fields
            if (!p.clue.trim() || !p.answer.trim()) {
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

    const handleSave = async () => {
        if (!puzzleData || !selectedDate) return;

        setError(null);
        setSuccessMsg(null);

        const validationError = validatePuzzle(puzzleData);
        if (validationError) {
            setError(validationError);
            return;
        }

        const preparedPuzzles = preparePuzzlesForSave(puzzleData);

        setLoading(true);
        try {
            await savePuzzle(selectedDate, preparedPuzzles, puzzleData.author);
            setSuccessMsg("Puzzle saved successfully!");
            loadMonthStatus();
        } catch (e: any) {
            setError(e.message);
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
            const author = existingPuzzles.get(dateStr);
            const hasPuzzle = !!author;
            const stats = monthlyStats.get(dateStr);

            days.push(
                <div
                    key={i}
                    className={`calendar-day ${isToday ? 'today' : ''} ${hasPuzzle ? 'has-puzzle' : ''}`}
                    onClick={() => handleDateClick(i)}
                    style={{
                        position: 'relative',
                        background: isPast ? 'rgba(255,255,255,0.03)' : undefined, // Dim past days
                        borderColor: isPast ? 'rgba(255,255,255,0.05)' : undefined
                    }}
                >
                    <span style={{ zIndex: 1, opacity: isPast ? 0.5 : 1 }}>{i}</span>

                    {/* Stats Overlay - Simplified to just Plays at top */}
                    {isPast && stats && (
                        <div style={{
                            position: 'absolute', top: '5px', left: 0, right: 0,
                            textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold',
                            color: 'var(--color-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}>
                            {stats.plays > 0 ? `${stats.plays} plays` : ''}
                        </div>
                    )}

                    {
                        hasPuzzle && (
                            <>
                                <div className="dot" />
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
                                    color: 'rgba(255,255,255,0.7)'
                                }}>
                                    {author}
                                </div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <button onClick={() => setSelectedDate(null)} className="back-btn">← Back</button>
                        <button onClick={() => setShowPreview(true)} className="save-btn" style={{ background: 'var(--color-secondary)', color: 'black', padding: '5px 15px' }}>
                            Preview
                        </button>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ margin: 0 }}>Editing: {selectedDate}</h2>
                        {isReadOnly && <span style={{
                            fontSize: '0.8rem',
                            background: 'var(--color-secondary)',
                            color: 'black',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            display: 'inline-block',
                            marginTop: '5px'
                        }}>READ ONLY</span>}
                    </div>
                </div>

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
                                            disabled={isReadOnly}
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
                                            disabled={isReadOnly}
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
                                </div>
                            </div>
                        ))}
                    </div>

                    {error && <div className="error-msg">{error}</div>}
                    {successMsg && <div className="success-msg">{successMsg}</div>}

                    {!isReadOnly && (
                        <div className="editor-actions">
                            <button onClick={handleSave} disabled={loading} className="save-btn">
                                {loading ? 'Saving...' : 'Save Puzzle'}
                            </button>
                        </div>
                    )}

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
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px' }}>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📅 This Day in History ({selectedDate})</label>
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
                                        padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px'
                                    }}
                                >
                                    {historyLoading ? 'Searching parameters of time...' : 'Find Historical Events & Birthdays'}
                                </button>

                                {historyEvents.length > 0 && (
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
