'use client';

import { useEffect, useRef, useState } from 'react';

export default function Game() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<{destroy: () => void} | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate dimensions and handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      // Set a larger fixed height of 800px
      const maxHeight = 800;
      
      // Calculate width based on available viewport width while maintaining aspect ratio
      // Use a 16:9 aspect ratio (common for games)
      const aspectRatio = 16/9;
      
      // Calculate width based on height and aspect ratio, but limit to viewport width
      const calculatedWidth = maxHeight * aspectRatio;
      const width = Math.min(calculatedWidth, window.innerWidth * 0.95);
      
      // If width is constrained by viewport, adjust height accordingly
      const height = width < calculatedWidth ? width / aspectRatio : maxHeight;
      
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
      
      <h1 className="arcade-text text-5xl font-bold text-white mb-4">TYPATON</h1>
      
      {/* Game Instructions */}
      <div className="mb-4 p-4 bg-gray-800 rounded-lg max-w-3xl text-center">
        <h2 className="arcade-text text-lg text-yellow-400 mb-2">How To Play</h2>
        
        <p className="arcade-text mb-2 text-sm text-white">Type the falling words before they reach the bottom!</p>
        <p className="arcade-text text-xs text-white">Just type the word - no need to press Enter.</p>
        <p className="arcade-text mt-2 text-yellow-300 text-xs">Game Over if any word reaches the center!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="text-left">
            <h3 className="arcade-text text-sm text-green-400 mb-1">Power-Ups</h3>
            <ul className="text-xs text-white space-y-1 pl-4">
              <li className="arcade-text"><span className="text-cyan-400">freeze</span> - Stops all words</li>
              <li className="arcade-text"><span className="text-green-400">slow</span> - Reduces word speed</li>
              <li className="arcade-text"><span className="text-red-400">bomb</span> - Destroys all words</li>
              <li className="arcade-text"><span className="text-yellow-400">shield</span> - Blocks one hit</li>
            </ul>
          </div>
          
          <div className="text-left">
            <h3 className="arcade-text text-sm text-cyan-400 mb-1">How to Use</h3>
            <p className="arcade-text text-xs text-white">1. Type rainbow words to collect</p>
            <p className="arcade-text text-xs text-white">2. Type power-up name to use it</p>
            <p className="arcade-text text-xs text-yellow-300 mt-1">Power-ups carry between levels!</p>
          </div>
        </div>
      </div>
      
      <div 
        id="game-container" 
        ref={gameContainerRef}
        style={{ 
          width: `${dimensions.width}px`, 
          height: `${dimensions.height}px`,
          maxWidth: '100%',
          margin: '0 auto',
          position: 'relative'
        }}
        className="border-4 border-indigo-500 rounded-lg overflow-hidden bg-gray-900"
      />
      
      <h2 className="arcade-text text-3xl font-bold text-white mt-6">TYPATON</h2>
    </div>
  );
}
