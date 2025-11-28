import { useState, useMemo, useEffect } from 'react';
import './index.css';
import { getDailyPuzzle } from './data/puzzles';
import { useGameState } from './hooks/useGameState';
import { useStats } from './hooks/useStats';
import { Header } from './components/Header';
import { PuzzleBoard } from './components/PuzzleBoard';
import { Keyboard } from './components/Keyboard';
import { ConfirmationModal } from './components/ConfirmationModal';
import { StatsModal } from './components/StatsModal';

function App() {
  const dailySet = useMemo(() => getDailyPuzzle(), []);
  const { gameState, handleGuess } = useGameState(dailySet);
  const { stats, recordGame } = useStats();

  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [confirmGuesses, setConfirmGuesses] = useState<boolean>(true);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);

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
      recordGame(gameState.status === 'won', gameState.strikes);
      setHasPlayedToday(true);
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
      <Header strikes={gameState.strikes} onStatsClick={() => setIsStatsOpen(true)} />

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
      />

      {/* Game Over / Win Messages are now handled by the Stats Modal mostly, 
          but we can keep a subtle indicator or let the board state show it. 
          The stats modal auto-opens on finish. */}
    </div>
  );
}

export default App;
