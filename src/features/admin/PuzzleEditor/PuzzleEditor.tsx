import React, { useState, useEffect } from 'react';
import { usePuzzleByDate, useSavePuzzle, useDeletePuzzle } from '../../../hooks/usePuzzles';
import type { PuzzleDocument, Puzzle } from '../../../lib/schemas';
import { validatePuzzle } from '../../../lib/puzzleUtils';
import { useUsers } from '../../../contexts/UsersContext';
import { InspirationTool } from '../AI_Tools/InspirationTool';
import { IdeaListTool } from '../AI_Tools/IdeaListTool';
import { HistoryTool } from '../AI_Tools/HistoryTool';
import { BirthdayTool } from '../AI_Tools/BirthdayTool';
import { NationalDayTool } from '../AI_Tools/NationalDayTool';
import { GameContainer } from '../../../components/GameContainer';
import { StyleGuideModal } from './StyleGuideModal';

interface PuzzleEditorProps {
    date: string;
    onBack: () => void;
    onNavigate: (delta: number) => void;
}

export const PuzzleEditor: React.FC<PuzzleEditorProps> = ({ date, onBack, onNavigate }) => {
    const { currentUser } = useUsers();

    // Data Fetching
    const { data: remotePuzzle, isLoading: isFetching } = usePuzzleByDate(date);
    const saveMutation = useSavePuzzle();
    const deleteMutation = useDeletePuzzle();

    // Local Form State
    const [formData, setFormData] = useState<PuzzleDocument | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [showStyleGuide, setShowStyleGuide] = useState(false);
    const [theme, setTheme] = useState('');

    // Sync remote data
    // 1. Sync remote data (only when remote data actually changes)
    useEffect(() => {
        if (remotePuzzle) {
            setFormData(remotePuzzle);
        }
    }, [remotePuzzle]);

    // 2. Init new puzzle (only if no data exists)
    useEffect(() => {
        if (!isFetching && !remotePuzzle && !formData) {
            setFormData({
                date,
                puzzles: Array(5).fill(null).map(() => ({ clue: '', answer: '', revealOrder: [] })) as unknown as [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle],
                author: currentUser?.handle || 'Anonymous',
                status: 'draft',
                approvedBy: null
            });
        }
    }, [isFetching, remotePuzzle, date, currentUser, formData]);



    const handleSave = async (status: 'draft' | 'review' | 'published') => {
        if (!formData) return;

        // Force Uppercase for saving and validation
        const sanitizedPuzzles = formData.puzzles.map(p => ({
            ...p,
            answer: p.answer.toUpperCase()
        })) as [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle];

        const sanitizedFormData = { ...formData, puzzles: sanitizedPuzzles };

        const error = validatePuzzle(sanitizedFormData, status === 'draft');
        if (error) {
            alert(error);
            return;
        }

        const preparedPuzzles = sanitizedPuzzles.map(p => ({
            ...p,
            revealOrder: Array.from(new Set(p.answer.replace(/[^A-Z]/g, '').split('')))
                .sort((a, b) => (a.charCodeAt(0) * 13 + 7) % 100 - (b.charCodeAt(0) * 13 + 7) % 100)
        })) as [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle];

        const docToSave: PuzzleDocument = {
            ...formData,
            status,
            puzzles: preparedPuzzles,
            approvedBy: status === 'published' ? (currentUser?.handle || 'Admin') : (formData.approvedBy || null)
        };

        try {
            await saveMutation.mutateAsync(docToSave);
            alert(`Saved as ${status}!`);
        } catch (error: any) {
            console.error("Save failed:", error);
            alert(`Failed to save: ${error.message || "Unknown error"}`);
        }
    };

    const handleDelete = () => {
        if (confirm("PERMANENTLY DELETE this puzzle?\nThis cannot be undone.")) {
            deleteMutation.mutate(date, { onSuccess: () => onBack() });
        }
    };

    const movePuzzle = (idx: number, dir: -1 | 1) => {
        if (!formData) return;
        const newPuzzles = [...formData.puzzles];
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= 5) return;
        [newPuzzles[idx], newPuzzles[newIdx]] = [newPuzzles[newIdx], newPuzzles[idx]];
        setFormData({ ...formData, puzzles: newPuzzles as any });
    };

    if (isFetching && !formData) return <div>Loading...</div>;
    if (!formData) return <div>Error init form</div>;

    if (isPreviewing && formData) {
        // Create a mock DailySet for the preview
        const mockDailySet = {
            date: formData.date,
            puzzles: formData.puzzles.map(p => {
                const upperAnswer = p.answer.toUpperCase();
                return {
                    ...p,
                    answer: upperAnswer,
                    revealOrder: Array.from(new Set(upperAnswer.replace(/[^A-Z]/g, '').split('')))
                        .sort((a, b) => (a.charCodeAt(0) * 13 + 7) % 100 - (b.charCodeAt(0) * 13 + 7) % 100)
                };
            }) as [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle],
            author: formData.author
        };

        return (
            <GameContainer
                dailySet={mockDailySet}
                onClose={() => setIsPreviewing(false)}
                isPreview={true}
            />
        );
    }

    const isApprovable = formData.status === 'review' || formData.status === 'published';

    const handleSingleMagic = async (idx: number) => {
        if (!theme.trim()) {
            alert("Please enter a theme in the Magic Generator first!");
            return;
        }
        if (!formData) return;

        try {
            // Import dynamically to avoid top-level issues if not used
            const { generateSinglePuzzle } = await import('../../../services/ai');
            const currentAnswers = formData.puzzles.filter(p => p.answer).map(p => p.answer);

            const newPuzzle = await generateSinglePuzzle(theme, currentAnswers);

            const newPuzzles = [...formData.puzzles];
            newPuzzles[idx] = newPuzzle;
            setFormData({ ...formData, puzzles: newPuzzles as any });
        } catch (e: any) {
            alert(`Magic Fill failed: ${e.message}`);
        }
    };

    return (
        <div className="puzzle-editor">
            {/* Header */}
            <div className="editor-header" style={{ flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <button onClick={onBack} className="back-btn">← Back</button>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button onClick={() => onNavigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'white' }}>◀</button>
                        <h2 style={{ margin: 0 }}>{date}</h2>
                        <button onClick={() => onNavigate(1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'white' }}>▶</button>
                    </div>
                    <button
                        onClick={() => setShowStyleGuide(true)}
                        className="back-btn"
                        style={{ fontSize: '0.9rem', color: 'var(--color-secondary)' }}
                    >
                        🎨 Rules
                    </button>
                </div>

                {/* Metadata Bar */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 15px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem',
                    marginBottom: '10px'
                }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <span>
                            <span style={{ opacity: 0.6 }}>Author: </span>
                            <strong style={{ color: 'var(--color-primary)' }}>{formData.author}</strong>
                        </span>
                        <span>
                            <span style={{ opacity: 0.6 }}>Status: </span>
                            <strong style={{
                                color: formData.status === 'published' ? '#4ecdc4' :
                                    formData.status === 'review' ? '#ffc107' : '#aaa',
                                textTransform: 'capitalize'
                            }}>
                                {formData.status}
                            </strong>
                        </span>
                    </div>
                    {formData.approvedBy && (
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            ✓ Approved by {formData.approvedBy}
                        </span>
                    )}
                </div>

                {/* Action Bar */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setIsPreviewing(true)} className="save-btn" style={{ background: '#3b82f6', color: 'white', flex: '1 1 100px' }}>👁️ Preview</button>
                    <button onClick={() => handleSave('draft')} className="save-btn" style={{ background: '#ffc107', color: 'black', flex: '1 1 100px' }}>Save Draft</button>
                    <button onClick={() => handleSave('review')} className="save-btn" style={{ background: '#dc3545', color: 'white', flex: '1 1 100px' }}>Submit Review</button>
                    <button
                        onClick={() => handleSave('published')}
                        className="save-btn"
                        disabled={!isApprovable}
                        style={{
                            background: isApprovable ? '#4ecdc4' : '#444',
                            color: isApprovable ? 'black' : '#aaa',
                            cursor: isApprovable ? 'pointer' : 'not-allowed',
                            flex: '1 1 100px'
                        }}
                    >
                        Approve
                    </button>
                </div>
            </div>

            <form className="editor-form" onSubmit={(e) => e.preventDefault()}>
                {/* Stacked AI Tools */}
                <div className="ai-tools-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    <IdeaListTool />
                    <InspirationTool
                        theme={theme}
                        onThemeChange={setTheme}
                        onPuzzlesGenerated={(p) => setFormData({ ...formData, puzzles: p })}
                    />

                    {/* Horizontal Group for smaller tools */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                        <HistoryTool date={date} />
                        <BirthdayTool date={date} />
                        <NationalDayTool date={date} />
                    </div>
                </div>

                {/* Puzzles */}
                <div className="puzzles-container">
                    {formData.puzzles.map((p, idx) => (
                        <div key={idx} className="puzzle-row">
                            <div className="row-controls">
                                <span className="row-num">{idx + 1}</span>
                                <div className="move-btns">
                                    <button onClick={() => movePuzzle(idx, -1)}>▲</button>
                                    <button onClick={() => movePuzzle(idx, 1)}>▼</button>
                                </div>
                                <button
                                    className="magic-wand-btn"
                                    onClick={() => handleSingleMagic(idx)}
                                    title="Magic Fill this clue (uses Theme)"
                                    style={{
                                        background: 'var(--color-primary)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                        padding: '0 5px',
                                        marginLeft: '5px'
                                    }}
                                >
                                    ✨
                                </button>
                            </div>

                            <div className="puzzle-inputs">
                                <div className="input-group">
                                    <label>Clue</label>
                                    <textarea
                                        value={p.clue}
                                        spellCheck={true}
                                        lang="en"
                                        autoComplete="off"
                                        autoCorrect="on"
                                        autoCapitalize="sentences"
                                        onChange={e => {
                                            const newP = [...formData.puzzles];
                                            newP[idx] = { ...p, clue: e.target.value };
                                            setFormData({ ...formData, puzzles: newP as any });
                                        }}
                                        rows={2}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Answer</label>
                                    <input
                                        value={p.answer}
                                        spellCheck={true}
                                        lang="en"
                                        autoCapitalize="sentences"
                                        autoCorrect="on"
                                        style={{ textTransform: 'uppercase' }}
                                        onChange={e => {
                                            const val = e.target.value; // Store as typed (allow lowercase for spellcheck)
                                            const newP = [...formData.puzzles];
                                            newP[idx] = { ...p, answer: val };
                                            setFormData({ ...formData, puzzles: newP as any });
                                        }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Comment</label>
                                    <input
                                        value={p.comment || ''}
                                        onChange={e => {
                                            const newP = [...formData.puzzles];
                                            newP[idx] = { ...p, comment: e.target.value };
                                            setFormData({ ...formData, puzzles: newP as any });
                                        }}
                                        style={{ background: 'rgba(255,255,255,0.05)' }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div style={{ marginTop: '40px', textAlign: 'center', paddingBottom: '20px' }}>
                    <button
                        onClick={handleDelete}
                        className="delete-btn"
                        style={{
                            background: 'transparent',
                            border: '2px solid #dc3545',
                            color: '#dc3545',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        🗑️ Delete Puzzle
                    </button>
                </div>

                {saveMutation.isPending && <div className="success-msg">Saving...</div>}
            </form>

            <StyleGuideModal isOpen={showStyleGuide} onClose={() => setShowStyleGuide(false)} />
        </div >
    );
};
