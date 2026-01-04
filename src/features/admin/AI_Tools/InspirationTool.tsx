import React, { useState } from 'react';
import { generatePuzzles } from '../../../services/ai';
import type { Puzzle } from '../../../lib/schemas';

interface InspirationToolProps {
    onPuzzlesGenerated: (puzzles: [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle]) => void;
    theme: string;
    onThemeChange: (theme: string) => void;
}

export const InspirationTool: React.FC<InspirationToolProps> = ({ onPuzzlesGenerated, theme, onThemeChange }) => {
    // Local loading/error state remains here as it's specific to this generator action
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleMagicFill = async () => {
        if (!theme.trim()) {
            alert("Please enter a theme first");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const generated = await generatePuzzles(theme);
            // Cast to ensure it matches the tuple type (runtime check handled by service usually, or we trust AI)
            onPuzzlesGenerated(generated as [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle]);
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    return (
        <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--color-bg-secondary)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-secondary)' }}>✨ Magic Generator</h4>
            <div className="form-group">
                <label style={{ fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Theme (e.g. "80s Movies", "Beach Day")</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        value={theme}
                        onChange={e => onThemeChange(e.target.value)}
                        placeholder="Enter a theme..."
                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #444', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                    <button
                        onClick={handleMagicFill}
                        disabled={loading}
                        style={{
                            background: 'var(--color-primary)',
                            color: 'black',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0 15px',
                            fontWeight: 'bold',
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Generating...' : 'Magic Fill'}
                    </button>
                </div>
                {error && <div style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '5px' }}>{error}</div>}
            </div>
        </div>
    );
};
