'use client';

import Game from '../components/Game';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-900 overflow-hidden">
      {/* Game component */}
      <div className="relative w-full">
        <Game />
      </div>
    </main>
  );
}
