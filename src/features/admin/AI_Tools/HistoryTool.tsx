import React, { useState, useEffect } from 'react';
import { generateHistoryEvents } from '../../../services/ai';

interface HistoryToolProps {
    date: string; // YYYY-MM-DD
}

export const HistoryTool: React.FC<HistoryToolProps> = ({ date }) => {
    const [events, setEvents] = useState<{ event: string, link: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Clear events when date changes so we don't show wrong history
        setEvents([]);
    }, [date]);

    const handleFetch = async () => {
        setLoading(true);
        try {
            const results = await generateHistoryEvents(date);
            setEvents(results);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ color: 'var(--color-secondary)' }}>📜 On This Day in History</strong>
                <button onClick={handleFetch} disabled={loading} style={{ background: 'none', border: '1px solid #666', color: '#ccc', borderRadius: '4px', cursor: 'pointer' }}>
                    {loading ? 'Loading...' : 'Load Events'}
                </button>
            </div>

            {events.length > 0 && (
                <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#ddd' }}>
                    {events.map((evt, i) => (
                        <li key={i} style={{ marginBottom: '5px' }}>
                            {evt.event}
                            {evt.link && <a href={evt.link} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', marginLeft: '5px', textDecoration: 'none', borderBottom: '1px dotted' }}>Wikipedia</a>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
