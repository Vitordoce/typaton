'use client';

import { useEffect, useRef, useState } from 'react';

export default function Game() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<{destroy: () => void} | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate dimensions and handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      // Make the game take up most of the viewport (90% width, 80% height)
      const width = Math.floor(window.innerWidth * 0.9);
      const height = Math.floor(window.innerHeight * 0.8);
      setDimensions({ width, height });
    };

    // Set initial dimensions
    updateDimensions();

    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize game
  useEffect(() => {
    if (typeof window === 'undefined' || dimensions.width === 0) return; // Skip on server or if dimensions not calculated
    
    console.log('Game component mounted with dimensions:', dimensions);
    
    // Small timeout to ensure DOM is ready
    const timer = setTimeout(async () => {
      if (gameContainerRef.current) {
        console.log('Creating game instance');
        try {
          // Dynamically import the PhaserGame module
          const { default: PhaserGame } = await import('@/lib/phaser/PhaserGame');
          gameInstanceRef.current = new PhaserGame('game-container', dimensions.width, dimensions.height);
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
  }, [dimensions]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      {/* Add arcade font styling */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .arcade-text {
          font-family: 'Press Start 2P', cursive;
          text-transform: uppercase;
          line-height: 1.5;
          letter-spacing: 1px;
        }
      `}</style>
      
      <h1 className="arcade-text text-4xl font-bold text-white mb-6">Typaton</h1>
      
      <div 
        id="game-container" 
        ref={gameContainerRef}
        style={{ 
          width: `${dimensions.width}px`, 
          height: `${dimensions.height}px`,
          maxWidth: '100%'
        }}
        className="border-4 border-indigo-500 rounded-lg overflow-hidden bg-gray-900"
      />
      
      <div className="mt-6 text-white text-center max-w-2xl">
        <p className="arcade-text mb-2 text-sm">Type the falling words before they reach the bottom!</p>
        <p className="arcade-text text-xs">Just type the word - no need to press Enter.</p>
        <p className="arcade-text mt-2 text-yellow-300 text-xs">Game Over if any word reaches the bottom!</p>
      </div>
    </div>
  );
}
