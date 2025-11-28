import React from 'react';
import type { Puzzle } from '../types';

interface PuzzleBoardProps {
    puzzles: [Puzzle, Puzzle, Puzzle];
    currentLevel: 0 | 1 | 2;
    guessedLetters: Set<string>;
    revealedLetters: Set<string>;
    gameStatus: 'playing' | 'won' | 'lost';
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
    puzzles,
    currentLevel,
    guessedLetters,
    revealedLetters,
    gameStatus
}) => {

    const renderPuzzleRow = (puzzle: Puzzle, levelIndex: number) => {
        const isCurrent = levelIndex === currentLevel;
        const isPast = levelIndex < currentLevel;
        const isFuture = levelIndex > currentLevel;

        // If game is lost, reveal everything? Or just leave as is?
        // User said "if the user gets three strikes... answers are revealed".
        const showAll = gameStatus === 'lost' || isPast || gameStatus === 'won';

        return (
            <div key={levelIndex} className={`puzzle-row level-${levelIndex} ${isCurrent ? 'current' : ''} ${isPast ? 'completed' : ''}`}>
                <div className="puzzle-label">Level {levelIndex + 1}</div>
                <div className="puzzle-letters">
                    {puzzle.answer.split(' ').map((word, wordIndex) => (
                        <div key={wordIndex} className="word-wrapper">
                            {word.split('').map((char, charIndex) => {
                                const upperChar = char.toUpperCase();
                                let content = '';
                                let statusClass = '';

                                if (showAll) {
                                    content = upperChar;
                                    statusClass = 'revealed';
                                } else if (isCurrent) {
                                    if (guessedLetters.has(upperChar)) {
                                        content = upperChar;
                                        statusClass = 'guessed';
                                    } else if (revealedLetters.has(upperChar)) {
                                        content = upperChar;
                                        statusClass = 'revealed-start';
                                    }
                                } else if (isFuture) {
                                    // Locked
                                    content = '';
                                    statusClass = 'locked';
                                }

                                return (
                                    <div key={`${wordIndex}-${charIndex}`} className={`letter-box ${statusClass}`}>
                                        {content}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                {isCurrent && <div className="puzzle-clue">{puzzle.clue}</div>}
            </div>
        );
    };

    return (
        <div className="puzzle-board">
            {puzzles.map((puzzle, index) => renderPuzzleRow(puzzle, index))}
        </div>
    );
};
