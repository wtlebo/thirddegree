import React, { useState, useEffect } from 'react';
import { useUsers } from '../contexts/UsersContext';
import { getPuzzleByDate, savePuzzle } from '../services/puzzles';
import type { PuzzleDocument } from '../types';

interface BetaFeedbackControlsProps {
    date: string;
    onNavigate?: (delta: number) => void;
    externalDoc?: PuzzleDocument; // For Admin Editor usage
    onExternalSave?: (doc: PuzzleDocument) => Promise<void>; // For Admin Editor usage
}

export const BetaFeedbackControls: React.FC<BetaFeedbackControlsProps> = ({ date, onNavigate, externalDoc, onExternalSave }) => {
    const { currentUser } = useUsers();

    const [puzzleDoc, setPuzzleDoc] = useState<PuzzleDocument | null>(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch the full puzzle document (we need votes/comments fields, which might not be in the DailySet passed to GameContainer effectively? 
    // Actually GameContainer has DailySet. DailySet is a subset of PuzzleDocument?
    // types.ts says PuzzleDocument extends DailySet.
    // fetchDailyPuzzle returns DailySet. It might return the full PuzzleDocument if it casts it?
    // fetchDailyPuzzle casting: `as DailySet`.
    // We should probably fetch the latest doc here to ensure we have fresh comments/votes.

    const refreshDoc = async () => {
        if (externalDoc) {
            setPuzzleDoc(externalDoc);
            setLoading(false);
            return;
        }
        setLoading(true);
        const doc = await getPuzzleByDate(date);
        setPuzzleDoc(doc);
        setLoading(false);
    };

    useEffect(() => {
        refreshDoc();
    }, [date, externalDoc]); // Re-run if externalDoc changes (Editor updates)

    const handleVote = async (vote: 'approve' | 'needs_change') => {
        if (!currentUser || !puzzleDoc) return;
        setIsSubmitting(true);

        const newVotes = [...(puzzleDoc.votes || [])];
        // Remove existing vote by this user
        const existingIdx = newVotes.findIndex(v => v.handle === currentUser.handle);
        if (existingIdx >= 0) {
            newVotes.splice(existingIdx, 1);
        }

        // Add new vote
        newVotes.push({
            uid: currentUser.uid,
            handle: currentUser.handle,
            vote,
            timestamp: new Date()
        });

        // Check for promotion logic (3 approvals -> Ready)
        const approvals = newVotes.filter(v => v.vote === 'approve').length;
        let newStatus = puzzleDoc.status;
        if (approvals >= 3 && puzzleDoc.status === 'beta') {
            newStatus = 'ready';
        }

        const updatedDoc: PuzzleDocument = {
            ...puzzleDoc,
            votes: newVotes,
            status: newStatus
        };

        try {
            await savePuzzle(updatedDoc);
            setPuzzleDoc(updatedDoc);
            // If we voted, maybe we want to go to next puzzle? Or stay here?
            // Let's stay here and let user click Next.
        } catch (e) {
            console.error("Failed to save vote:", e);
            alert("Failed to save vote");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComment = async () => {
        if (!currentUser || !puzzleDoc || !comment.trim()) return;
        setIsSubmitting(true);

        const newComments = [...(puzzleDoc.comments || [])];
        newComments.push({
            uid: currentUser.uid,
            handle: currentUser.handle,
            text: comment.trim(),
            timestamp: new Date(),
            resolved: false
        });

        const updatedDoc: PuzzleDocument = {
            ...puzzleDoc,
            comments: newComments
        };

        try {
            if (onExternalSave) {
                await onExternalSave(updatedDoc);
                setComment(''); // Clear comment on success
            } else {
                await savePuzzle(updatedDoc);
                setPuzzleDoc(updatedDoc);
                setComment('');
            }
        } catch (e) {
            console.error("Failed to save comment:", e);
            alert("Failed to save comment");
        } finally {
            setIsSubmitting(false);
        }
    };



    if (loading) return <div className="beta-controls loading">Loading feedback data...</div>;
    if (!puzzleDoc) return null;

    return (
        <div className="beta-container">
            <div className="beta-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span className="beta-badge" style={{ background: '#9c27b0', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>{date}</span>
                <div className="beta-actions" style={{ display: 'flex', gap: '10px', marginLeft: '10px' }}>
                    {onNavigate && (
                        <>
                            <button onClick={() => onNavigate(-1)} className="beta-action-btn secondary"
                                style={{
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '4px',
                                    color: 'rgba(255,255,255,0.9)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}>
                                <span>←</span> Prev
                            </button>
                            <button onClick={() => onNavigate(1)} className="beta-action-btn secondary"
                                style={{
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '4px',
                                    color: 'rgba(255,255,255,0.9)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}>
                                Next <span>→</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Voting */}
            <div className="voting-section" style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: 0.8 }}>Your Vote:</h3>
                <div className="vote-buttons" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <button
                        onClick={() => handleVote('approve')}
                        disabled={isSubmitting}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                            background: puzzleDoc.votes?.find(v => v.handle === currentUser?.handle && v.vote === 'approve') ? '#4caf50' : '#2e3b4e',
                            color: 'white', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s'
                        }}
                    >
                        ✅ Approve
                    </button>
                    <button
                        onClick={() => handleVote('needs_change')}
                        disabled={isSubmitting}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                            background: puzzleDoc.votes?.find(v => v.handle === currentUser?.handle && v.vote === 'needs_change') ? '#ff9800' : '#2e3b4e',
                            color: 'white', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s'
                        }}
                    >
                        🚧 Needs Change
                    </button>
                </div>
                <div className="vote-status" style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.9rem' }}>
                    <div style={{ color: '#4caf50' }}>
                        <strong>Approvals ({puzzleDoc.votes?.filter(v => v.vote === 'approve').length || 0}/3):</strong>{' '}
                        {puzzleDoc.votes?.filter(v => v.vote === 'approve').map(v => v.handle).join(', ') || 'None'}
                    </div>
                    {puzzleDoc.votes?.some(v => v.vote === 'needs_change') && (
                        <div style={{ color: '#ff9800' }}>
                            <strong>Needs Change:</strong>{' '}
                            {puzzleDoc.votes?.filter(v => v.vote === 'needs_change').map(v => v.handle).join(', ')}
                        </div>
                    )}
                </div>
            </div>

            {/* Comments */}
            <div className="comments-section">
                <div className="comments-list">
                    {puzzleDoc.comments?.map((c, i) => (
                        <div key={i} className="comment" style={{ whiteSpace: 'pre-wrap' }}>
                            <strong>{c.handle}: </strong> {c.text}
                        </div>
                    ))}
                    {(!puzzleDoc.comments || puzzleDoc.comments.length === 0) && <div className="no-comments">No comments yet.</div>}
                </div>
                <div className="add-comment" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Leave a comment..."
                        disabled={isSubmitting}
                        rows={5}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#1a1a2e', color: 'white',
                            fontFamily: 'inherit', resize: 'vertical', minHeight: '80px'
                        }}

                    />
                    <button onClick={handleComment} disabled={isSubmitting}
                        style={{
                            padding: '0 20px', height: '40px', background: 'var(--color-secondary)', border: 'none', borderRadius: '6px',
                            color: 'white', fontWeight: 'bold', cursor: 'pointer'
                        }}>
                        Post
                    </button>
                </div>
            </div>
        </div>
    );
};

