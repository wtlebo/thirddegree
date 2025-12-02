import React from 'react';

interface HowToPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content how-to-play-modal" onClick={e => e.stopPropagation()} style={{ position: 'relative', paddingTop: '40px' }}>
                <button className="close-btn" onClick={onClose} style={{ position: 'absolute', right: '15px', top: '10px' }}>&times;</button>

                <div className="stats-header" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                    <h2>How to Play</h2>
                </div>

                <div style={{ textAlign: 'left', color: 'var(--color-text)', lineHeight: '1.6' }}>
                    <p style={{ marginBottom: '1rem' }}>
                        <strong>Hang 5</strong> is a daily word puzzle game. Your goal is to solve 5 puzzles with as few strikes as possible.
                    </p>

                    <h3 style={{ color: 'var(--color-secondary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Rules</h3>
                    <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
                        <li>You have <strong>5 strikes</strong> total for the entire daily set.</li>
                        <li>Each wrong guess costs you a strike.</li>
                        <li>If you run out of strikes, you <strong>Wipe Out</strong>!</li>
                    </ul>

                    <h3 style={{ color: 'var(--color-secondary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Momentum Bonus</h3>
                    <p style={{ marginBottom: '0.5rem' }}>
                        Do well to get a head start on the next puzzle!
                    </p>
                    <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
                        <li><strong>0 Strikes</strong> in previous round: Start with <strong>2 letters</strong> revealed.</li>
                        <li><strong>1 Strike</strong> in previous round: Start with <strong>1 letter</strong> revealed.</li>
                        <li><strong>2+ Strikes</strong>: No help!</li>
                    </ul>

                    <h3 style={{ color: 'var(--color-secondary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Scoring</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '10px 20px', alignItems: 'center' }}>
                        {/* Rows */}
                        <span>0 Strikes</span>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>HANG 5</span>
                        <span style={{ fontWeight: 'bold' }}>5 pts</span>

                        <span>1 Strike</span>
                        <span style={{ color: 'var(--color-primary)' }}>TUBULAR</span>
                        <span>4 pts</span>

                        <span>2 Strikes</span>
                        <span style={{ color: 'var(--color-primary)' }}>RADICAL</span>
                        <span>3 pts</span>

                        <span>3 Strikes</span>
                        <span style={{ color: 'var(--color-primary)' }}>GNARLY</span>
                        <span>2 pts</span>

                        <span>4 Strikes</span>
                        <span style={{ color: 'var(--color-primary)' }}>CLOSE CALL</span>
                        <span>1 pt</span>

                        <span>5 Strikes</span>
                        <span style={{ color: 'var(--color-error)' }}>WIPE OUT</span>
                        <span>0 pts</span>
                    </div>

                    <p style={{ marginTop: '1.5rem', fontStyle: 'italic', textAlign: 'center', opacity: 0.8 }}>
                        A new set of puzzles is available every day!
                    </p>
                </div>
            </div>
        </div>
    );
};
