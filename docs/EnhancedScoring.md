# Enhanced Scoring System

This document describes the enhanced scoring system implemented in Typaton, which calculates points based on word length, velocity, typing speed, and word effects.

## Overview

The new scoring system rewards players for:
1. Typing longer words
2. Successfully handling faster-moving words
3. Typing quickly and accurately
4. Dealing with words that have special effects (blinking, shaking, etc.)

## Score Components

### Base Points
- Each letter in a word is worth 10 points
- Example: "cat" = 30 points, "programming" = 110 points

### Length Bonus
- Words longer than 5 letters receive a 50% bonus per extra letter
- Example: "computer" (8 letters) gets a bonus for 3 extra letters = 150% bonus

### Velocity Bonus
- Words moving faster than the base velocity receive a 20% bonus per 10 velocity units
- Faster words are worth more points

### Typing Speed Bonus
- Typing faster than 5 characters per second gives a 30% bonus per extra char/sec
- Rewards quick typists

### Effects Bonus
- Each effect on a word provides a percentage bonus:
  - Blinking: 20% bonus
  - Shaking: 30% bonus
  - Flipped: 40% bonus
  - Rotating: 50% bonus

## Game Over Screen

The enhanced game over screen shows:

### Summary Statistics
- Total score
- Words typed
- Average typing speed
- Power-ups collected and used

### Level Breakdown
- Score per level
- Words typed per level
- Average typing speed per level

### Top Scoring Words
- The 5 highest-scoring words
- Detailed breakdown of each word's score components

## Implementation

The scoring system is implemented through:

1. **ScoreManager**: Tracks typing metrics and calculates scores
2. **GameOverScreen**: Displays detailed score information
3. **Enhanced GameScene**: Integrates scoring with gameplay

## Strategic Tips

- Target longer words for higher base points
- Challenge yourself with faster-moving words
- Practice typing quickly and accurately
- Don't avoid words with special effects - they're worth more points
- Use power-ups strategically to maximize your score