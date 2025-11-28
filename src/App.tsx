import { useState, useMemo, useEffect } from 'react';
import './index.css';
import { getDailyPuzzle } from './data/puzzles';
import { useGameState } from './hooks/useGameState';
import { Header } from './components/Header';
import { PuzzleBoard } from './components/PuzzleBoard';
import { Keyboard } from './components/Keyboard';
import { ConfirmationModal } from './components/ConfirmationModal';

function App() {
  const dailySet = useMemo(() => getDailyPuzzle(), []);
  const { gameState, handleGuess } = useGameState(dailySet);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [confirmGuesses, setConfirmGuesses] = useState<boolean>(true);

  // Reset confirmation to ON when level changes
  useEffect(() => {
    setConfirmGuesses(true);
  }, [gameState.currentLevel]);

  const handleLetterSelect = (letter: string) => {
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
      <Header strikes={gameState.strikes} />

      <main>
        <PuzzleBoard
          puzzles={gameState.dailySet.puzzles}
          currentLevel={gameState.currentLevel}
          guessedLetters={gameState.guessedLetters}
          revealedLetters={gameState.revealedLetters}
          gameStatus={gameState.status}
        />
      </main>

      <div className="keyboard-container">
        <Keyboard
          onLetterSelect={handleLetterSelect}
          guessedLetters={gameState.guessedLetters}
          revealedLetters={gameState.revealedLetters}
          disabled={gameState.status !== 'playing'}
          confirmGuesses={confirmGuesses}
          onToggleConfirm={() => setConfirmGuesses(!confirmGuesses)}
        />
      </div>

      {selectedLetter && (
        <ConfirmationModal
          letter={selectedLetter}
          onConfirm={confirmGuess}
          onCancel={cancelGuess}
        />
      )}

      {gameState.status === 'won' && (
        <div className="modal-overlay">
          <div className="modal-content result-modal">
            <h2>You Won!</h2>
            <p>Great job solving today's puzzles.</p>
            <button className="btn-confirm" onClick={() => window.location.reload()}>Play Again (Dev)</button>
          </div>
        </div>
      )}

      {gameState.status === 'lost' && (
        <div className="modal-overlay">
          <div className="modal-content result-modal">
            <h2>Game Over</h2>
            <p>Better luck next time!</p>
            <button className="btn-confirm" onClick={() => window.location.reload()}>Try Again (Dev)</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
