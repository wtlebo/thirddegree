import { useState, useEffect } from 'react';
import '../index.css';
import { fetchDailyPuzzle } from '../data/puzzles';
import type { DailySet } from '../types';
import { GameContainer } from '../components/GameContainer';

export const GamePage = () => {
    const [dailySet, setDailySet] = useState<DailySet | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await fetchDailyPuzzle();
            setDailySet(data);
            setLoading(false);
        };
        load();
    }, []);

    if (loading || !dailySet) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading Puzzle...</div>;
    }

    return <GameContainer dailySet={dailySet} />;
};
