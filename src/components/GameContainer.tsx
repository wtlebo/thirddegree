import { useState, useEffect } from 'react';
import '../index.css';
import { useGameState } from '../hooks/useGameState';
import { useStats } from '../hooks/useStats';
import { Header } from './Header';
import { PuzzleBoard } from './PuzzleBoard';
import { Keyboard } from './Keyboard';
import { ConfirmationModal } from './ConfirmationModal';
import { StatsModal } from './StatsModal';
import { HowToPlayModal } from './HowToPlayModal';
import type { DailySet } from '../types';

interface GameContainerProps {
    dailySet: DailySet;
    onClose?: () => void; // Optional close handler for Preview Mode
    isPreview?: boolean;
}

export const GameContainer = ({ dailySet, onClose, isPreview = false }: GameContainerProps) => {
    const { gameState, handleGuess } = useGameState(dailySet);
    const { stats, recordGame } = useStats(!isPreview);

    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [confirmGuesses, setConfirmGuesses] = useState<boolean>(true);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
    const [hasPlayedToday, setHasPlayedToday] = useState(false);

    const [latestGameSummary, setLatestGameSummary] = useState<{ status: 'won' | 'lost'; strikes: number } | null>(null);
    const [flashState, setFlashState] = useState<'correct' | 'incorrect' | null>(null);

    // ... existing useEffects ...

    // Trigger flash effect
    const triggerFlash = (isCorrect: boolean) => {
        setFlashState(isCorrect ? 'correct' : 'incorrect');
        setTimeout(() => setFlashState(null), 300);
    };

    // Modified handleGuess to include flash triggering
    const handleGameGuess = (letter: string) => {
        if (!gameState.dailySet) return;

        const currentPuzzle = gameState.dailySet.puzzles[gameState.currentLevel];
        const upperLetter = letter.toUpperCase();

        // Only flash if it's a NEW valid guess
        if (!gameState.guessedLetters.has(upperLetter) && !gameState.revealedLetters.has(upperLetter)) {
            const isCorrect = currentPuzzle.answer.toUpperCase().includes(upperLetter);
            triggerFlash(isCorrect);
        }

        handleGuess(letter);
    };

    // ... existing useEffects (Reset confirmation) ...
    // Check if already played today (SKIP if previewing)
    useEffect(() => {
        if (!isPreview) {
            // Restore from persisted state if available
            if (gameState.status !== 'playing' && !latestGameSummary) {
                setLatestGameSummary({ status: gameState.status, strikes: gameState.strikes });
            }

            if (stats.lastPlayedDate === dailySet.date) {
                setHasPlayedToday(true);
                // If we have a summary, open stats immediately
                if (gameState.status !== 'playing') {
                    setIsStatsOpen(true);
                }
            }
        }
    }, [stats.lastPlayedDate, dailySet.date, isPreview, gameState.status, gameState.strikes, latestGameSummary]);

    // Record game result when finished (SKIP if previewing)
    useEffect(() => {
        if (gameState.status !== 'playing' && !hasPlayedToday) {
            if (!isPreview) {
                recordGame(gameState.status === 'won', gameState.strikes, gameState.guesses, dailySet.date);
                setHasPlayedToday(true);
            }
            setLatestGameSummary({ status: gameState.status, strikes: gameState.strikes });
            setTimeout(() => setIsStatsOpen(true), 1500);
        }
    }, [gameState.status, hasPlayedToday, recordGame, gameState.strikes, gameState.guesses, dailySet.date, isPreview]);

    // Reset confirmation to ON when level changes
    useEffect(() => {
        setConfirmGuesses(true);
    }, [gameState.currentLevel]);

    const handleLetterSelect = (letter: string) => {
        if (hasPlayedToday) return;

        if (confirmGuesses) {
            setSelectedLetter(letter);
        } else {
            handleGameGuess(letter); // Use wrapper
        }
    };

    const confirmGuess = () => {
        if (selectedLetter) {
            handleGameGuess(selectedLetter); // Use wrapper
            setSelectedLetter(null);
        }
    };

    const cancelGuess = () => {
        setSelectedLetter(null);
    };

    return (
        <div className="app-container" style={isPreview ? { position: 'fixed', top: 0, left: 0, zIndex: 2000, background: 'var(--color-bg)' } : {}}>
            <div className={`flash-overlay ${flashState || ''}`} /> {/* Flash Overlay */}

            <Header
                strikes={gameState.strikes}
                onStatsClick={() => setIsStatsOpen(true)}
                onHowToPlayClick={() => setIsHowToPlayOpen(true)}
            />

            {/* ... rest of render ... */}

            {isPreview && (
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        zIndex: 2001,
                        background: 'var(--color-error)',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    EXIT PREVIEW
                </button>
            )}

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
