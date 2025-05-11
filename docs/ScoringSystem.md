# Scoring System Documentation

This document describes the enhanced scoring system in Typaton, including how points are calculated based on word length, velocity, typing speed, and word effects.

## Overview

The scoring system in Typaton rewards players for typing longer words, handling faster-moving words, typing quickly, and successfully dealing with words that have special effects. This creates a dynamic gameplay experience where players must balance speed and accuracy while prioritizing high-value targets.

## Score Components

Each word's score is calculated using the following components:

### 1. Base Points

- **Formula**: `word.length * 10`
- **Example**: The word "computer" (8 letters) has a base score of 80 points

### 2. Length Bonus

- **Formula**: `basePoints * (extraLetters * 0.5)`
- **Description**: Words longer than 5 letters receive a bonus of 50% per extra letter
- **Example**: "computer" (8 letters) gets a length bonus of 3 extra letters * 0.5 = 150% bonus

### 3. Velocity Bonus

- **Formula**: `basePoints * ((velocity - baseVelocity) / 10 * 0.2)`
- **Description**: Words moving faster than the base velocity receive a bonus of 20% per 10 velocity units
- **Example**: A word moving at velocity 80 (30 above base) gets a velocity bonus of 60%

### 4. Typing Speed Bonus

- **Formula**: `basePoints * ((typingSpeed - 5) * 0.3)`
- **Description**: Typing faster than 5 characters per second gives a bonus of 30% per extra char/sec
- **Example**: Typing at 8 chars/sec gives a typing speed bonus of 90%

### 5. Effects Bonus

- **Description**: Each effect on a word provides a percentage bonus:
  - Blinking: 20% bonus
  - Shaking: 30% bonus
  - Flipped: 40% bonus
  - Rotating: 50% bonus
- **Example**: A word with both blinking and shaking effects gets a 50% bonus

## Total Score Calculation

The final score for a word is calculated as:

```
wordScore = basePoints * (1 + lengthBonus + velocityBonus + typingSpeedBonus + effectsBonus)
```

All bonuses are additive, creating the potential for very high scores on difficult words.

## Game Over Screen

When the game ends, a detailed score breakdown is displayed showing:

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

## Implementation Details

The scoring system is implemented through the `ScoreManager` class, which:

1. Tracks typing start and end times for each word
2. Calculates typing speed in characters per second
3. Computes all score components when a word is completed
4. Maintains detailed statistics for the game over screen
5. Emits score update events for real-time UI updates

## Strategic Implications

The scoring system encourages players to:

1. Target longer words for higher base points and length bonuses
2. Prioritize faster-moving words for velocity bonuses
3. Type quickly and accurately for typing speed bonuses
4. Challenge themselves with words that have special effects
5. Use power-ups strategically to maximize their score

This creates a risk-reward dynamic where players must decide whether to go for "easy" words or challenge themselves with more difficult but higher-scoring words.