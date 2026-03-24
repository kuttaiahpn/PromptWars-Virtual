import React, { useState, useEffect } from 'react';
import { useGameState } from '../state/GameStateProvider';
import { getPortalMessage } from '../utils/gemini-api';

export const Portal = () => {
  const { level, advanceLevel, timeLeft } = useGameState();
  const [instructions, setInstructions] = useState('Establishing neural link...');
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let isMounted = true;
    setDisplayedText('');

    const fetchInstructions = async () => {
      setInstructions('Awaiting structural alignment...');
      const message = await getPortalMessage(level, timeLeft);
      if (isMounted) {
        setInstructions(message);
      }
    };
    
    fetchInstructions();

    return () => { isMounted = false; };
  }, [level]); // Omit timeLeft to avoid refetching every second

  // Typing effect
  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < instructions.length) {
        // We use functional state update or directly depend on instructions to slice
        setDisplayedText(instructions.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 40); // 40ms per character for dark aesthetic

    return () => clearInterval(typingInterval);
  }, [instructions]);

  if (level > 3) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
        <div className="text-center">
          <h2 className="text-6xl text-neon-green font-orbitron text-glow mb-4">VICTORY</h2>
          <p className="text-xl text-white font-inter">Earth is saved. The Prince is victorious.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 p-6 box-glow bg-neon-panel bg-opacity-80 rounded-lg max-w-lg w-full z-40">
      <h2 className="text-3xl text-neon-pink font-orbitron mb-2">Transmission from Lord Ravun</h2>
      <p className="text-lg text-neon-blue font-orbitron mb-6 min-h-[4rem]">{displayedText}<span className="animate-pulse">_</span></p>
      <button 
        onClick={advanceLevel}
        className="w-full py-3 bg-transparent border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black font-bold uppercase tracking-widest transition-all duration-300 rounded"
      >
        Enter Sector
      </button>
    </div>
  );
};
