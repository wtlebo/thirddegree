import { useState, useMemo, useEffect } from 'react';
import '../index.css';
import { getDailyPuzzle } from '../data/puzzles';
import { useGameState } from '../hooks/useGameState';
import { useStats } from '../hooks/useStats';
import { Header } from '../components/Header';
import { PuzzleBoard } from '../components/PuzzleBoard';
import { Keyboard } from '../components/Keyboard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { StatsModal } from '../components/StatsModal';
import { HowToPlayModal } from '../components/HowToPlayModal';

export const GamePage = () => {
    const dailySet = useMemo(() => getDailyPuzzle(), []);
    const { gameState, handleGuess } = useGameState(dailySet);
    const { stats, recordGame } = useStats();

    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [confirmGuesses, setConfirmGuesses] = useState<boolean>(true);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
    const [hasPlayedToday, setHasPlayedToday] = useState(false);

    const [latestGameSummary, setLatestGameSummary] = useState<{ status: 'won' | 'lost'; strikes: number } | null>(null);

    // Check if already played today
    useEffect(() => {
        if (stats.lastPlayedDate === dailySet.date) {
            setHasPlayedToday(true);
            setIsStatsOpen(true); // Auto-open stats if already played
        }
    }, [stats.lastPlayedDate, dailySet.date]);

    // Record game result when finished
    useEffect(() => {
        if (gameState.status !== 'playing' && !hasPlayedToday) {
            recordGame(gameState.status === 'won', gameState.strikes, gameState.guesses, dailySet.date);
            setHasPlayedToday(true);
            setLatestGameSummary({ status: gameState.status, strikes: gameState.strikes });
            // Small delay to show the result before opening stats
            setTimeout(() => setIsStatsOpen(true), 1500);
        }
    }, [gameState.status, hasPlayedToday, recordGame, gameState.strikes]);

    // Reset confirmation to ON when level changes
    useEffect(() => {
        setConfirmGuesses(true);
    }, [gameState.currentLevel]);

    const handleLetterSelect = (letter: string) => {
        if (hasPlayedToday) return; // Prevent play if finished

        if (confirmGuesses) {
            setSelectedLetter(letter);
        } else {
            handleGuess(letter);
        }
    };

    const confirmGuess = () => {
        if (selectedLetter) {
            handleGuess(selectedLetter);
            setSelectedLetter(null);
        }
    };

    const cancelGuess = () => {
        setSelectedLetter(null);
    };

    return (
        <div className="app-container">
            <Header
                strikes={gameState.strikes}
                onStatsClick={() => setIsStatsOpen(true)}
                onHowToPlayClick={() => setIsHowToPlayOpen(true)}
            />

            <main>
                <PuzzleBoard
                    puzzles={gameState.dailySet.puzzles}
                    currentLevel={gameState.currentLevel}
                    guessedLetters={gameState.guessedLetters}
                    revealedLetters={gameState.revealedLetters}
                    gameStatus={gameState.status}
                    showAll={hasPlayedToday}
                />
            </main>

            {!hasPlayedToday && gameState.status === 'playing' && (
                <div className="keyboard-container">
                    <Keyboard
                        onLetterSelect={handleLetterSelect}
                        guessedLetters={gameState.guessedLetters}
                        revealedLetters={gameState.revealedLetters}
                        disabled={gameState.status !== 'playing' || hasPlayedToday}
                        confirmGuesses={confirmGuesses}
                        onToggleConfirm={() => setConfirmGuesses(!confirmGuesses)}
                    />
                </div>
            )}

            {selectedLetter && (
                <ConfirmationModal
                    letter={selectedLetter}
                    onConfirm={confirmGuess}
                    onCancel={cancelGuess}
                />
            )}

            <StatsModal
                stats={stats}
                isOpen={isStatsOpen}
                onClose={() => setIsStatsOpen(false)}
                latestGameSummary={latestGameSummary}
            />

            <HowToPlayModal
                isOpen={isHowToPlayOpen}
                onClose={() => setIsHowToPlayOpen(false)}
            />

            {/* Temporary Debug Button */}
            <button
                onClick={async () => {
                    try {
                        const { logGameResult, ensureAuth } = await import('../services/analytics');
                        const user = await ensureAuth();
                        if (!user) { alert('Auth failed: No user'); return; }

                        await logGameResult({
                            date: new Date().toISOString().split('T')[0], // Use UTC for test to see if it lands
                            status: 'lost',
                            strikes: 5,
                            score: 0,
                            guesses: [],
                            userId: user.uid
                        });
                        alert('Log sent! User: ' + user.uid);
                    } catch (e: any) {
                        alert('Error: ' + e.message);
                    }
                }}
                style={{ position: 'fixed', bottom: '10px', left: '10px', opacity: 0.5, zIndex: 9999 }}
            >
                Test Log
            </button>
        </div>
    );
};
