import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Typaton - Typing Game',
  description: 'A fun typing game built with Next.js and Phaser',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
