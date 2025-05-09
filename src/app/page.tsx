'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-900 to-black">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-black via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <div className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0">
            <span className="text-white">Powered by</span>
            <span className="text-indigo-500 font-bold">Next.js & Phaser</span>
          </div>
        </div>
      </div>

      <div className="relative flex place-items-center mb-16 mt-16">
        <h1 className="text-6xl font-bold text-white">
          <span className="text-indigo-500">Typa</span>ton
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-2 lg:text-left gap-8">
        <Link
          href="/game"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-indigo-500 hover:bg-gray-800"
        >
          <h2 className="mb-3 text-2xl font-semibold text-white">
            Play Game{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50 text-white">
            Start playing Typaton and improve your typing skills!
          </p>
        </Link>

        <Link
          href="/about"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-indigo-500 hover:bg-gray-800"
        >
          <h2 className="mb-3 text-2xl font-semibold text-white">
            About{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50 text-white">
            Learn more about Typaton and how it helps improve typing skills.
          </p>
        </Link>
      </div>
    </main>
  );
}
