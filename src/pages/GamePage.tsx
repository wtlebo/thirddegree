import { useState, useEffect } from 'react';
import '../index.css';
import { fetchDailyPuzzle } from '../data/puzzles';
import { useGameState } from '../hooks/useGameState';
import { useStats } from '../hooks/useStats';
import { Header } from '../components/Header';
import { PuzzleBoard } from '../components/PuzzleBoard';
import { Keyboard } from '../components/Keyboard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { StatsModal } from '../components/StatsModal';
import { HowToPlayModal } from '../components/HowToPlayModal';
import type { DailySet } from '../types';

const GameContainer = ({ dailySet }: { dailySet: DailySet }) => {
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
            setIsStatsOpen(true);
        }
    }, [stats.lastPlayedDate, dailySet.date]);

    // Record game result when finished
    useEffect(() => {
        if (gameState.status !== 'playing' && !hasPlayedToday) {
            recordGame(gameState.status === 'won', gameState.strikes, gameState.guesses, dailySet.date);
            setHasPlayedToday(true);
            setLatestGameSummary({ status: gameState.status, strikes: gameState.strikes });
            setTimeout(() => setIsStatsOpen(true), 1500);
        }
    }, [gameState.status, hasPlayedToday, recordGame, gameState.strikes, gameState.guesses, dailySet.date]);

    // Reset confirmation to ON when level changes
    useEffect(() => {
        setConfirmGuesses(true);
    }, [gameState.currentLevel]);

    const handleLetterSelect = (letter: string) => {
        if (hasPlayedToday) return;

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
                    puzzleAuthor={dailySet.author}
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


        </div>
    );
};

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
