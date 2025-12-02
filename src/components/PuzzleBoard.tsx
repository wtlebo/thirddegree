import React from 'react';
import type { Puzzle } from '../types';

interface PuzzleBoardProps {
    puzzles: [Puzzle, Puzzle, Puzzle, Puzzle, Puzzle];
    currentLevel: 0 | 1 | 2 | 3 | 4;
    guessedLetters: Set<string>;
    revealedLetters: Set<string>;
    gameStatus: 'playing' | 'won' | 'lost';
    showAll?: boolean;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
    puzzles,
    currentLevel,
    guessedLetters,
    revealedLetters,
    gameStatus,
    showAll: forceShowAll = false
}) => {

    const renderPuzzleRow = (puzzle: Puzzle, levelIndex: number) => {
        // If showAll is true (game finished), nothing is "current", everything is "completed" (or just dimmed)
        const isCurrent = !forceShowAll && levelIndex === currentLevel;
        const isPast = levelIndex < currentLevel;
        const isFuture = levelIndex > currentLevel;

        // If game is lost, reveal everything? Or just leave as is?
        // User said "if the user gets three strikes... answers are revealed".
        const showAll = forceShowAll || gameStatus === 'lost' || isPast || gameStatus === 'won';

        // "Greyed out like they are before you play them" -> implies default opacity (0.5)
        // But we also want them to be readable. Let's try removing 'current' and adding 'completed' if showAll.
        // Actually, if we want them to look like future rows (0.5), we shouldn't add 'completed' (0.8).
        // But let's stick to 'completed' for now as it implies "done".
        const rowClass = isCurrent ? 'current' : (isPast || showAll ? 'completed' : '');

        return (
            <div key={levelIndex} className={`puzzle-row level-${levelIndex} ${rowClass}`}>
                <div className="puzzle-label">{levelIndex + 1}</div>
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
                {showAll && !isCurrent && <div className="puzzle-clue">{puzzle.clue}</div>}
            </div>
        );
    };

    return (
        <div className="puzzle-board">
            {puzzles.map((puzzle, index) => renderPuzzleRow(puzzle, index))}
        </div>
    );
};
