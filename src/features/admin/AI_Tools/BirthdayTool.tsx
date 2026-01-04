import React, { useState, useEffect } from 'react';
import { generateBirthdays } from '../../../services/ai';

interface BirthdayToolProps {
    date: string;
}

export const BirthdayTool: React.FC<BirthdayToolProps> = ({ date }) => {
    const [birthdays, setBirthdays] = useState<{ event: string, link: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setBirthdays([]);
    }, [date]);

    const handleFetch = async () => {
        setLoading(true);
        try {
            const results = await generateBirthdays(date);
            setBirthdays(results);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ color: 'var(--color-secondary)' }}>🎂 Famous Birthdays</strong>
                <button onClick={handleFetch} disabled={loading} style={{ background: 'none', border: '1px solid #666', color: '#ccc', borderRadius: '4px', cursor: 'pointer' }}>
                    {loading ? 'Loading...' : 'Load Birthdays'}
                </button>
            </div>

            {birthdays.length > 0 && (
                <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#ddd' }}>
                    {birthdays.map((evt, i) => (
                        <li key={i} style={{ marginBottom: '5px' }}>
                            {evt.event}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
