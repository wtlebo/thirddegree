import React, { useState, useEffect } from 'react';
import { generateNationalDays } from '../../../services/ai';

interface NationalDayToolProps {
    date: string;
}

export const NationalDayTool: React.FC<NationalDayToolProps> = ({ date }) => {
    const [days, setDays] = useState<{ event: string, link: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setDays([]);
    }, [date]);

    const handleFetch = async () => {
        setLoading(true);
        try {
            const results = await generateNationalDays(date);
            setDays(results);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ color: 'var(--color-secondary)' }}>🎊 National Days</strong>
                <button onClick={handleFetch} disabled={loading} style={{ background: 'none', border: '1px solid #666', color: '#ccc', borderRadius: '4px', cursor: 'pointer' }}>
                    {loading ? 'Loading...' : 'Load Days'}
                </button>
            </div>

            {days.length > 0 && (
                <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#ddd' }}>
                    {days.map((evt, i) => (
                        <li key={i} style={{ marginBottom: '5px' }}>
                            {evt.event}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
