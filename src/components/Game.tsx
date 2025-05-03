'use client';

import { useEffect, useRef } from 'react';

export default function Game() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  // Use more specific type for the game instance
  const gameInstanceRef = useRef<{destroy: () => void} | null>(null);

  // Initialize game
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server
    
    console.log('Game component mounted');
    
    // Small timeout to ensure DOM is ready
    const timer = setTimeout(async () => {
      if (gameContainerRef.current) {
        console.log('Creating game instance');
        try {
          // Dynamically import the PhaserGame module
          const { default: PhaserGame } = await import('@/lib/phaser/PhaserGame');
          gameInstanceRef.current = new PhaserGame('game-container', 800, 600);
        } catch (error) {
          console.error('Error loading Phaser game:', error);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-4xl font-bold text-white mb-6">Typaton</h1>
      
      <div 
        id="game-container" 
        ref={gameContainerRef}
        className="border-4 border-indigo-500 rounded-lg overflow-hidden w-[800px] h-[600px] bg-gray-800"
      />
      
      <div className="mt-6 text-white text-center">
        <p className="mb-2">Type the falling words before they reach the bottom!</p>
        <p>Just type the word - no need to press Enter. The word will disappear when matched!</p>
        <p className="mt-2 text-yellow-300">Game Over if any word reaches the bottom!</p>
      </div>
    </div>
  );
}
