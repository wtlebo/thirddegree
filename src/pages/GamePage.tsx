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

    const handleNextBeta = async () => {
        if (!isAuthorized) return;
        const nextDate = await getNextBetaPuzzle(currentUser?.handle, dateOverride);
        if (nextDate) {
            navigate(`/?date=${nextDate}`);
        } else {
            alert("Administrative Task Complete! No more beta puzzles to review.");
            navigate('/');
        }
    };

    const handleExitBeta = () => {
        navigate('/');
    };

    const handleWorkModeClick = () => {
        if (dateOverride) {
            // In Work Mode -> Exit
            handleExitBeta();
        } else {
            // In Play Mode -> Enter Work Mode (Next Beta)
            handleNextBeta();
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
            onNextBeta={handleNextBeta}
            onExitBeta={handleExitBeta}
            onWorkModeClick={isAuthorized ? handleWorkModeClick : undefined}
        />
    );
};
