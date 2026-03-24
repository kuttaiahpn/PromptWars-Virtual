import React from 'react';
import { useGameState } from '../state/GameStateProvider';

export const UIOverlay = () => {
  const { health, timeLeft, level, isGameOver, resetGame } = useGameState();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-30 flex flex-col justify-between p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-start w-full">
        {/* Health */}
        <div className="flex flex-col gap-1">
          <span className="text-neon-pink font-orbitron text-xl font-bold tracking-widest text-glow">Health: {health}%</span>
          <div className="w-48 h-4 bg-gray-800 rounded border border-neon-pink overflow-hidden">
            <div 
              className="h-full bg-neon-pink transition-all duration-300" 
              style={{ width: `${health}%` }}
            ></div>
          </div>
        </div>

        {/* Level */}
        <div className="text-center text-glow box-glow bg-black bg-opacity-50 px-6 py-2 rounded-full border border-neon-blue">
          <span className="text-neon-blue font-orbitron text-xl font-bold">
            Level {level}: {level === 1 ? 'The Outskirts' : level === 2 ? 'Core Diagnostics' : 'Orbital Command'}
          </span>
        </div>

        {/* Time */}
        <div className="flex flex-col gap-1 text-right">
          <span className="text-neon-green font-orbitron text-xl font-bold tracking-widest text-glow">
            Time: {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 pointer-events-auto z-50">
          <div className="text-center border-t-4 border-b-4 border-neon-pink py-10 w-full bg-neon-panel bg-opacity-50 shadow-[0_0_50px_rgba(255,0,255,0.3)]">
            <h1 className="text-6xl text-neon-pink font-orbitron font-black mb-4 uppercase tracking-widest text-glow">Permadeath</h1>
            <p className="text-xl text-gray-300 font-inter mb-8">
              {health <= 0 ? "You have been destroyed." : "Time has expired."}
            </p>
            <button 
              onClick={resetGame}
              className="px-8 py-3 bg-transparent border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black font-bold uppercase tracking-widest transition-all duration-300 rounded shadow-[0_0_15px_rgba(0,243,255,0.5)]"
            >
              Reboot System
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
