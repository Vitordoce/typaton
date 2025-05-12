'use client';

import Game from '../components/Game';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-black overflow-hidden">
      {/* Optional video background - comment out if not needed */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-30"
      >
        <source src="/video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Game component with proper z-index to display over video */}
      <div className="relative z-10 w-full">
        <Game />
      </div>
    </main>
  );
}
