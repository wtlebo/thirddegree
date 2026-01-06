import React from 'react';

interface StyleGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const StyleGuideModal: React.FC<StyleGuideModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'left' }}>
                <h2 style={{ color: 'var(--color-primary)', textAlign: 'center', marginBottom: '20px' }}>
                    🎨 Style Guide & Rules
                </h2>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: 'var(--color-secondary)', marginBottom: '10px' }}>📝 Clues</h3>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li><strong>Max Length:</strong> 100 characters per clue.</li>
                        <li><strong>Punctuation:</strong> Suggest no punctuation unless relevant to clue tone (i.e. ?)</li>
                        <li><strong>Emojis:</strong> Allowed (e.g. "Movie about 🦁👑").</li>
                        <li><strong>Tone:</strong> Witty, punny, or slightly tricky.</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: 'var(--color-secondary)', marginBottom: '10px' }}>🔤 Answers</h3>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li><strong>Max Length:</strong> 100 chars total (Max 15 per word).</li>
                        <li><strong>Allowed:</strong> A-Z, spaces, hyphens (<code>-</code>), standard quotes (<code>" '</code>), commas (<code>,</code>), ampersands (<code>&</code>).</li>
                        <li><strong>Long Words:</strong> Words 10+ chars will shrink automatically.</li>
                    </ul>
                </div>

                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button
                        onClick={onClose}
                        className="btn-confirm"
                        style={{ padding: '10px 30px', background: 'var(--color-primary)', color: 'black' }}
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};
