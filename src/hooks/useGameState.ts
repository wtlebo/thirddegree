import { useState, useCallback } from 'react';
import type { DailySet, GameState } from '../types';
import { getRevealedLetters, isPuzzleSolved } from '../utils/gameUtils';

export const useGameState = (dailySet: DailySet) => {
    const [gameState, setGameState] = useState<GameState>(() => {
        // Initial state setup
        const initialLevel = 0;
        const initialRevealed = getRevealedLetters(dailySet.puzzles[0], 2);

        return {
            dailySet,
            currentLevel: initialLevel,
            strikes: 0,
            strikesPerLevel: [0, 0, 0, 0, 0],
            guessedLetters: new Set(),
            revealedLetters: initialRevealed,
            status: 'playing'
        };
    });

    const handleGuess = useCallback((letter: string) => {
        if (gameState.status !== 'playing') return;

        const currentPuzzle = gameState.dailySet.puzzles[gameState.currentLevel];
        const upperLetter = letter.toUpperCase();

        if (gameState.guessedLetters.has(upperLetter) || gameState.revealedLetters.has(upperLetter)) {
            return; // Already guessed or revealed
        }

        const isCorrect = currentPuzzle.answer.toUpperCase().includes(upperLetter);

        setGameState(prev => {
            const newGuessed = new Set(prev.guessedLetters).add(upperLetter);
            let newStrikes = prev.strikes;
            const newStrikesPerLevel = [...prev.strikesPerLevel] as [number, number, number, number, number];

            if (!isCorrect) {
                newStrikes += 1;
                newStrikesPerLevel[prev.currentLevel] += 1;
            }

            // Check Game Over
            if (newStrikes >= 5) {
                return {
                    ...prev,
                    strikes: newStrikes,
                    strikesPerLevel: newStrikesPerLevel,
                    guessedLetters: newGuessed,
                    status: 'lost'
                };
            }

            // Check Level Win
            const solved = isPuzzleSolved(currentPuzzle, newGuessed, prev.revealedLetters);

            if (solved) {
                // Prepare for next level or win
                if (prev.currentLevel === 4) {
                    return {
                        ...prev,
                        strikes: newStrikes,
                        strikesPerLevel: newStrikesPerLevel,
                        guessedLetters: newGuessed,
                        status: 'won'
                    };
                } else {
                    // Advance to next level
                    const nextLevel = (prev.currentLevel + 1) as 0 | 1 | 2 | 3 | 4;

                    // Calculate reveals for next level
                    // L1 -> L2: 2 - strikesInL1
                    // L2 -> L3: 2 - strikesInL2
                    // Note: prev.currentLevel is the level we just finished (L1=0, L2=1)
                    // So if we finished L1 (0), we look at strikesPerLevel[0]

                    const strikesInJustFinishedLevel = newStrikesPerLevel[prev.currentLevel];
                    const revealCount = Math.max(0, 2 - strikesInJustFinishedLevel);
                    const nextRevealed = getRevealedLetters(prev.dailySet.puzzles[nextLevel], revealCount);

                    return {
                        ...prev,
                        strikes: newStrikes,
                        strikesPerLevel: newStrikesPerLevel,
                        guessedLetters: new Set(), // Reset guesses for new level
                        revealedLetters: nextRevealed,
                        currentLevel: nextLevel
                    };
                }
            }

            return {
                ...prev,
                strikes: newStrikes,
                strikesPerLevel: newStrikesPerLevel,
                guessedLetters: newGuessed
            };
        });
    }, [gameState.status, gameState.currentLevel, gameState.dailySet, gameState.guessedLetters, gameState.revealedLetters]);

    return {
        gameState,
        handleGuess
    };
};
