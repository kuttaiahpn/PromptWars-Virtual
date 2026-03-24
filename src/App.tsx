import React from 'react';
import { GameStateProvider } from './state/GameStateProvider';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { Portal } from './components/Portal';
import { VirtualControls } from './components/VirtualControls';

function App() {
  return (
    <GameStateProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-inter select-none">
        <GameCanvas />
        <UIOverlay />
        <VirtualControls />
        <Portal />
      </div>
    </GameStateProvider>
  );
}

export default App;
