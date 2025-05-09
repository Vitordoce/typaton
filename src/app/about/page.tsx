import Link from 'next/link';

export default function About() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gradient-to-b from-gray-900 to-black">
      <h1 className="text-4xl font-bold text-white mb-8">
        About <span className="text-indigo-500">Typaton</span>
      </h1>
      
      <div className="max-w-2xl text-white">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Typaton?</h2>
          <p className="mb-4">
            Typaton is an interactive typing game designed to help you improve your typing speed and accuracy
            while having fun. The game presents words that you need to type correctly as quickly as possible
            to earn points.
          </p>
          <p>
            Whether you&apos;re a beginner looking to improve your typing skills or an experienced typist wanting
            to challenge yourself, Typaton offers an engaging way to practice.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How to Play</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Words will appear and move toward the center of the screen</li>
            <li>Type the exact word to eliminate it before it reaches the center</li>
            <li>Collect power-ups by typing the power-up words</li>
            <li>Use power-ups by typing their name (freeze, slow, bomb, shield)</li>
            <li>Complete each level by clearing the required number of words</li>
          </ol>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Technologies Used</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Next.js - React framework</li>
            <li>TypeScript - Type-safe JavaScript</li>
            <li>Phaser - HTML5 game framework</li>
            <li>Tailwind CSS - Utility-first CSS framework</li>
          </ul>
        </section>
        
        <div className="mt-8 text-center">
          <Link 
            href="/game" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Start Playing Now
          </Link>
        </div>
      </div>
      
      <div className="mt-12">
        <Link 
          href="/" 
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
