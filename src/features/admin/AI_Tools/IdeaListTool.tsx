import React, { useState } from 'react';
import { generateIdeaList } from '../../../services/ai';

export const IdeaListTool: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [ideas, setIdeas] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        try {
            const results = await generateIdeaList(topic);
            setIdeas(results);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div style={{ marginBottom: '15px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-secondary)' }}>💡 Idea List Generator</h4>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Topic (e.g. Space, 90s Music)"
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #444', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    style={{
                        background: 'var(--color-accent)', color: 'white', border: 'none',
                        borderRadius: '4px', padding: '0 15px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    {loading ? '...' : 'Go'}
                </button>
            </div>

            {ideas.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {ideas.map((idea, i) => (
                        <span key={i} style={{
                            fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)',
                            padding: '2px 8px', borderRadius: '10px'
                        }}>
                            {idea}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
