import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchDailyPuzzle } from '../data/puzzles';
import { getNextBetaPuzzle } from '../services/puzzles';
import { GameContainer } from '../components/GameContainer';
import type { DailySet } from '../types';
import { useUsers } from '../contexts/UsersContext';

export const GamePage = () => {
    const [dailySet, setDailySet] = useState<DailySet | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentUser } = useUsers();

    const dateParam = searchParams.get('date');
    const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'pm';
    // Only allow date override if authorized
    const dateOverride = (dateParam && isAuthorized) ? dateParam : undefined;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            // Fetch puzzle with optional override
            const data = await fetchDailyPuzzle(dateOverride);
            setDailySet(data);
            setLoading(false);
        };
        load();
    }, [dateOverride]); // Reload when date param changes

    const handleNavigate = (delta: number) => {
        // Use dateOverride if set, otherwise today (in local time-ish, but safer to use param)
        // Note: new Date('YYYY-MM-DD') is UTC, new Date('YYYY-MM-DD' + 'T00:00:00') is local
        const baseStr = dateOverride || new Date().toLocaleDateString('en-CA');
        const base = new Date(baseStr + 'T00:00:00');
        const next = new Date(base);
        next.setDate(next.getDate() + delta);

        const yyyy = next.getFullYear();
        const mm = String(next.getMonth() + 1).padStart(2, '0');
        const dd = String(next.getDate()).padStart(2, '0');
        const nextStr = `${yyyy}-${mm}-${dd}`;

        navigate(`/?date=${nextStr}`);
    };

    const handleWorkModeClick = async () => {
        if (dateOverride) {
            // In Work Mode -> Exit (Go to Today)
            navigate('/');
        } else {
            // In Play Mode -> Enter Work Mode (Find Next Beta)
            if (!isAuthorized) return;
            const nextDate = await getNextBetaPuzzle(currentUser?.handle);
            if (nextDate) {
                navigate(`/?date=${nextDate}`);
            } else {
                alert("No beta puzzles found to review!");
                // Optionally navigate to tomorrow anyway?
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                navigate(`/?date=${tomorrow.toLocaleDateString('en-CA')}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading Pattern...</p>
            </div>
        );
    }

    if (!dailySet) return <div>Failed to load puzzle.</div>;

    return (
        <GameContainer
            key={dailySet.date}
            dailySet={dailySet}
            isBeta={!!dateOverride}
            onNavigate={isAuthorized ? handleNavigate : undefined}
            onWorkModeClick={isAuthorized ? handleWorkModeClick : undefined}
        />
    );
};
