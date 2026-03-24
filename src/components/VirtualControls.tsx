import React from 'react';
import { useGameState } from '../state/GameStateProvider';

export const VirtualControls = () => {
  const { playerMode, togglePlayerMode } = useGameState();

  const handlePointerDown = (button: string) => {
    window.dispatchEvent(new CustomEvent('vpad-start', { detail: { button } }));
  };

  const handlePointerUp = (button: string) => {
    window.dispatchEvent(new CustomEvent('vpad-end', { detail: { button } }));
  };

  const ControlBtn = ({ id, label, className }: { id: string, label: string, className?: string }) => (
    <button
      className={`bg-neon-panel border-2 border-neon-blue text-neon-blue rounded px-4 py-4 text-xl font-bold uppercase active:bg-neon-blue active:text-black touch-none select-none shadow-[0_0_10px_rgba(0,243,255,0.3)] ${className}`}
      onPointerDown={(e) => { e.preventDefault(); handlePointerDown(id); }}
      onPointerUp={(e) => { e.preventDefault(); handlePointerUp(id); }}
      onPointerLeave={(e) => { e.preventDefault(); handlePointerUp(id); }}
    >
      {label}
    </button>
  );

  return (
    <div className="absolute bottom-0 left-0 w-full p-6 z-40 pointer-events-none flex justify-between items-end">
      {/* Left Pad */}
      <div className="pointer-events-auto flex items-center h-48 w-48 relative">
        {playerMode === 'SPACESHIP' ? (
          <div className="flex flex-col gap-2 items-center w-full">
            <ControlBtn id="up" label="Thrust" className="w-full" />
            <div className="flex gap-2 w-full">
              <ControlBtn id="left" label="Turn L" className="flex-1 text-sm" />
              <ControlBtn id="right" label="Turn R" className="flex-1 text-sm" />
            </div>
            <ControlBtn id="down" label="Brake" className="w-full text-sm py-2" />
          </div>
        ) : (
          <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full h-full">
            <div />
            <ControlBtn id="up" label="W" className="flex items-center justify-center p-0" />
            <div />
            <ControlBtn id="left" label="A" className="flex items-center justify-center p-0" />
            <ControlBtn id="down" label="S" className="flex items-center justify-center p-0" />
            <ControlBtn id="right" label="D" className="flex items-center justify-center p-0" />
            <div />
          </div>
        )}
      </div>

      {/* Debug Switch Button */}
      <div className="pointer-events-auto absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <button
          onClick={togglePlayerMode}
          className="bg-black border border-neon-pink text-neon-pink px-4 py-2 font-orbitron text-sm hover:bg-neon-pink hover:text-black transition-colors rounded shadow-[0_0_8px_rgba(255,0,255,0.4)]"
        >
          DEBUG: {playerMode} MODE
        </button>
      </div>

      {/* Right Action Pad */}
      <div className="pointer-events-auto h-32 w-48 flex justify-end gap-4 items-end">
        {playerMode === 'SPACESHIP' ? (
          <ControlBtn id="action1" label="FIRE" className="h-full w-24 text-neon-pink border-neon-pink shadow-[0_0_10px_rgba(255,0,255,0.3)] active:bg-neon-pink" />
        ) : (
          <>
            <ControlBtn id="action2" label="ROLL" className="h-24 w-20 text-neon-purple border-neon-purple shadow-[0_0_10px_rgba(176,38,255,0.3)] active:bg-neon-purple" />
            <ControlBtn id="action1" label="SWORD" className="h-24 w-20 text-neon-pink border-neon-pink shadow-[0_0_10px_rgba(255,0,255,0.3)] active:bg-neon-pink" />
          </>
        )}
      </div>
    </div>
  );
};
