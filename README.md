# Typaton

A typing game built with Next.js and Phaser.

## Description

Typaton is a fun typing game where players improve their typing speed and accuracy through interactive gameplay.

## Technologies Used

- Next.js
- TypeScript
- Phaser (Game Framework)
- Tailwind CSS

## Prerequisites

- Node.js (v14 or later)
- npm or yarn

## Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd typaton
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Game Features

- Typing challenges with increasing difficulty
- Score tracking and performance metrics
- Multiple game modes
- Power-up system including:
  - Freeze: Temporarily stops all falling words
  - Slow: Reduces word falling speed
  - Bomb: Destroys all current words
  - Shield: Blocks one hit
- Enhanced scoring system based on:
  - Word length
  - Typing speed
  - Special effects
- Progressive difficulty levels
- Real-time performance tracking

## How to Play

- Type the falling words before they reach the center
- Collect power-ups by typing rainbow-colored words
- Activate power-ups by typing their names (freeze, slow, bomb, shield)
- Power-ups carry between levels
- Game ends if any word reaches the center (unless blocked by shield)

## License

MIT