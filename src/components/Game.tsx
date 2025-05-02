'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(() => import('@/lib/phaser/PhaserGame'), {
  ssr: false
});

export default function Game() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Make sure we're in the browser and the ref is available
    if (typeof window !== 'undefined' && gameContainerRef.current) {
      // Create a new game instance
      gameInstanceRef.current = new PhaserGame(
        'game-container',
        800,
        600
      );
    }

    // Cleanup function to destroy the game when component unmounts
    return () => {
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
        className="border-4 border-indigo-500 rounded-lg overflow-hidden"
      />
      <div className="mt-6 text-white text-center">
        <p className="mb-2">Type the words as they appear to score points!</p>
        <p>Press <span className="bg-gray-700 px-2 py-1 rounded">Enter</span> to submit your answer.</p>
      </div>
    </div>
  );
}
