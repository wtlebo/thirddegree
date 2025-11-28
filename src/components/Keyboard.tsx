import React from 'react';

const KEYS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

interface KeyboardProps {
    onLetterSelect: (letter: string) => void;
    guessedLetters: Set<string>;
    revealedLetters: Set<string>;
    disabled: boolean;
    confirmGuesses: boolean;
    onToggleConfirm: () => void;
}

export const Keyboard: React.FC<KeyboardProps> = ({
    onLetterSelect,
    guessedLetters,
    revealedLetters,
    disabled,
    confirmGuesses,
    onToggleConfirm
}) => {
    return (
        <div className="keyboard">
            {KEYS.map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                    {row.map((letter) => {
                        const isUsed = guessedLetters.has(letter) || revealedLetters.has(letter);
                        return (
                            <button
                                key={letter}
                                className={`key ${isUsed ? 'used' : ''}`}
                                onClick={() => onLetterSelect(letter)}
                                disabled={disabled || isUsed}
                            >
                                {letter}
                            </button>
                        );
                    })}
                    {/* Add Toggle Button to the last row (next to M) */}
                    {rowIndex === KEYS.length - 1 && (
                        <button
                            className={`key key-toggle ${confirmGuesses ? 'active' : ''}`}
                            onClick={onToggleConfirm}
                            title="Toggle Confirmation"
                        >
                            {confirmGuesses ? '✓' : '⚡'}
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};
