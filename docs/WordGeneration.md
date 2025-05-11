# Word Generation System

This document describes the word generation system in Typaton, including how random words are generated, how word velocity is calculated based on word length, and how the system integrates with the game.

## Overview

The word generation system in Typaton uses an external API to fetch random words of varying lengths. The velocity of each word is determined by its length - shorter words move faster, while longer words move slower. This creates a balanced gameplay experience where players must type quickly for short words and have more time for longer, more complex words.

## Components

### WordGenerator

The `WordGenerator` class is responsible for:

1. Fetching random words from an external API
2. Caching words to reduce API calls
3. Providing words of specific lengths when requested
4. Calculating appropriate velocities based on word length

### WordManager

The `WordManager` class uses the `WordGenerator` to:

1. Spawn words at random positions around the screen edges
2. Apply appropriate velocities based on word length and difficulty
3. Track active words on screen
4. Handle word completion and scoring

## Word Generation Process

1. When the game starts, `WordGenerator.initialize()` is called to pre-fetch 100 random words
2. Words are stored in a cache to minimize API calls
3. When a new word is needed, `WordGenerator.getRandomWord(minLength, maxLength)` is called
4. The word is removed from the cache to prevent repetition
5. When the cache runs low (fewer than 20 words), more words are automatically fetched

## Velocity Calculation

Word velocity is calculated based on:

1. **Word Length**: Shorter words move faster than longer words
   - 3-4 letters: 130% of base speed
   - 5-6 letters: 110% of base speed
   - 7-8 letters: 90% of base speed
   - 9+ letters: 70% of base speed

2. **Difficulty Level**: As the game progresses, the base speed increases
   - Base speed = 40 + (difficultyLevel * 10)

3. **Direction**: All words move toward the center of the screen

## Scoring System

The scoring system rewards players for typing longer, more difficult words:

- Points per word = word length * 10
- For example:
  - "cat" = 30 points
  - "computer" = 80 points
  - "programming" = 110 points

## Difficulty Progression

As the player advances through difficulty levels:

1. The base velocity increases
2. Longer words become more common
3. Words may have additional visual effects (shaking, flipping, rotating)
4. The maximum word length increases (4 + difficultyLevel)

## Fallback System

If the external API fails:

1. The system falls back to a predefined list of common words
2. The game continues to function without interruption
3. A warning is logged to the console

## Technical Implementation

The word generation system uses:

1. The Random Word API (https://random-word-api.herokuapp.com/)
2. Asynchronous fetching to prevent game interruption
3. Word filtering to ensure appropriate length and character set
4. Phaser's vector system for calculating directional movement