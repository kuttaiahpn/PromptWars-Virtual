import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type GameStateContextType = {
  health: number;
  timeLeft: number;
  level: number;
  isGameOver: boolean;
  playerMode: 'SPACESHIP' | 'PRINCE';
  takeDamage: (amount: number) => void;
  advanceLevel: () => void;
  resetGame: () => void;
  togglePlayerMode: () => void;
};

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [health, setHealth] = useState(100);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds
  const [level, setLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerMode, setPlayerMode] = useState<'SPACESHIP' | 'PRINCE'>('SPACESHIP');

  useEffect(() => {
    if (health <= 0 || timeLeft <= 0) {
      setIsGameOver(true);
    }
  }, [health, timeLeft]);

  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver]);

  const takeDamage = (amount: number) => {
    if (isGameOver) return;
    setHealth((prev) => Math.max(0, prev - amount));
  };

  const advanceLevel = () => {
    if (isGameOver || level >= 3) return;
    setLevel((prev) => prev + 1);
  };

  const resetGame = () => {
    setHealth(100);
    setTimeLeft(3600);
    setLevel(1);
    setIsGameOver(false);
    setPlayerMode('SPACESHIP');
  };

  const togglePlayerMode = () => {
    setPlayerMode(prev => prev === 'SPACESHIP' ? 'PRINCE' : 'SPACESHIP');
  };

  return (
    <GameStateContext.Provider value={{ health, timeLeft, level, isGameOver, playerMode, takeDamage, advanceLevel, resetGame, togglePlayerMode }}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};
