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
import { BetaFeedbackControls } from './BetaFeedbackControls';
import type { DailySet } from '../types';

interface GameContainerProps {
    dailySet: DailySet;
    onClose?: () => void; // Optional close handler for Preview Mode
    isPreview?: boolean;
    isBeta?: boolean;
    onNavigate?: (delta: number) => void;
    onWorkModeClick?: () => void;
}

export const GameContainer = ({ dailySet, onClose, isPreview = false, isBeta = false, onNavigate, onWorkModeClick }: GameContainerProps) => {
    const { gameState, handleGuess } = useGameState(dailySet);
    const { stats, recordGame, isLoading: statsLoading } = useStats(!isPreview);

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
        if (!isPreview && !statsLoading) {
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
    }, [stats.lastPlayedDate, dailySet.date, isPreview, gameState.status, gameState.strikes, latestGameSummary, statsLoading]);

    // Record game result when finished (SKIP if previewing)
    useEffect(() => {
        if (gameState.status !== 'playing' && !hasPlayedToday && !statsLoading) {
            // DOUBLE CHECK: Avoid race condition where hook fires before hasPlayedToday updates
            if (stats.lastPlayedDate === dailySet.date) {
                setHasPlayedToday(true);
                return;
            }

            if (!isPreview && !isBeta) {
                recordGame(gameState.status === 'won', gameState.strikes, gameState.guesses, dailySet.date);
                setHasPlayedToday(true);
            }
            if (isBeta) {
                // In beta, we don't record stats, but we do mark as "played" locally so the board reveals
                setHasPlayedToday(true);
            }

            setLatestGameSummary({ status: gameState.status, strikes: gameState.strikes });
            if (!isBeta) {
                setTimeout(() => setIsStatsOpen(true), 1500);
            }
        }
    }, [gameState.status, hasPlayedToday, recordGame, gameState.strikes, gameState.guesses, dailySet.date, isPreview, isBeta, stats.lastPlayedDate, statsLoading]);

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
        <div className={`app-container ${isBeta ? 'beta-mode' : ''}`} style={{
            ...(isPreview ? { position: 'fixed', top: 0, left: 0, zIndex: 2000, background: 'var(--color-bg)' } : {}),
            ...(isBeta ? { background: '#1a1a2e' } : {}) // Slight purple/dark tint for beta
        }}>
            <Header
                strikes={gameState.strikes}
                flashState={flashState} // Pass flash state for logo glow
                onStatsClick={() => setIsStatsOpen(true)}
                onHowToPlayClick={() => setIsHowToPlayOpen(true)}
                isWorkMode={isBeta}
                onWorkModeClick={onWorkModeClick}
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

                {/* Beta Controls: Placed INSIDE main so it scrolls with the content */}
                {isBeta && (
                    <div className="beta-wrapper" style={{
                        padding: '20px 10px',
                        marginTop: '20px',
                        marginBottom: '40px', // Extra space at bottom
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px'
                    }}>
                        <h3 style={{ marginTop: 0, color: '#9c27b0' }}>🚧 Puzzle Testing Mode</h3>
                        <BetaFeedbackControls
                            date={dailySet.date}
                            onNavigate={onNavigate}
                        />
                    </div>
                )}
            </main>

            {/* Beta Controls moved to bottom via CSS order or placement below main content */}
            {/* We will place it after the keyboard/main content normally, but let's check structure. */}
            {/* The user said "below the puzzle so you only see it after you scroll down". */}
            {/* Placing it here is effectively below the board. But wait, Keyboard is usually below board. */}

            {/* ... rest of render ... */}

            {/* Actually, let's just keep it here but strictly AFTER everything else. */}
            {/* Moving it to the very bottom of the container */}

            {/* Keyboard / Input */}
            {!hasPlayedToday && gameState.status === 'playing' && (
                <div className="keyboard-area">
                    {/* ... keyboard ... */}
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

            {/* Beta Controls at very bottom */}


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
