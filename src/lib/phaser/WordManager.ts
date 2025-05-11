import * as Phaser from 'phaser';
import { BaseManager } from './BaseManager';
import { Word } from './Word';
import { WordType, WordEffect, WordData, WordConfig } from './types/WordData';
import { GameEvents } from './types/GameEvents';

// Power-up words remain the same
export const POWER_UP_WORDS = ['freeze', 'slow', 'bomb', 'shield'];

/**
 * WordManager class
 * Responsible for spawning, tracking, and updating words
 */
export class WordManager extends BaseManager {
  private words: Word[] = [];
  private difficultyLevel: number = 1;
  private score: number = 0;
  private powerUpChance: number = 0.05; // 5% chance for power-up
  private wordPool: string[] = [];
  private powerUpChance: number = 0.5; // 50% chance for power-up
  
  constructor(scene: Phaser.Scene) {
    super(scene);
    
    // Only set up event listener if eventEmitter exists
    if (this.eventEmitter) {
      // Bind the method to preserve context
      this.handleWordCompleted = this.handleWordCompleted.bind(this);
      
      // Listen for word completion events
      this.eventEmitter.on(GameEvents.WORD_COMPLETED, this.handleWordCompleted, this);
    } else {
      console.error('WordManager: eventEmitter is undefined in constructor');
    }
  }
  
  /**
   * Spawn a new word with the given configuration
   * @param config - Word configuration
   * @returns The created Word object
   */
  spawnWord(config: WordConfig): Word {
    const word = new Word(this.scene, config);
    this.words.push(word);
    
    // Calculate velocity based on word length and difficulty
    const baseVelocity = this.calculateVelocityForWordLength(
      config.text.length, 
      this.difficultyLevel
    );
    
    // Calculate direction vector to center
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const dirX = centerX - config.x;
    const dirY = centerY - config.y;
    
    // Normalize and scale by calculated velocity
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    const velocityX = (dirX / length) * baseVelocity;
    const velocityY = (dirY / length) * baseVelocity;
    
    // Set velocity and emit event with word data
    word.setVelocity(velocityX, velocityY);
    
    return word;
  }
  
  /**
   * Calculate velocity based on word length
   * @param wordLength - Length of the word
   * @param baseDifficulty - Base difficulty level (1-4)
   * @returns Velocity value
   */
  calculateVelocityForWordLength(wordLength: number, baseDifficulty: number = 1): number {
    // Shorter words move faster, longer words move slower
    // Base speed is affected by difficulty level
    const baseSpeed = 40 + (baseDifficulty * 10);
    
    // Adjust speed based on word length (shorter = faster)
    // Words of length 3-4 will be fastest, 10+ will be slowest
    let speedFactor = 1.0;
    
    if (wordLength <= 4) {
      speedFactor = 1.3; // Fastest
    } else if (wordLength <= 6) {
      speedFactor = 1.1; // Fast
    } else if (wordLength <= 8) {
      speedFactor = 0.9; // Medium
    } else {
      speedFactor = 0.7; // Slow
    }
    
    return baseSpeed * speedFactor;
  }
  
  /**
   * Get a random word based on current difficulty level
   * @returns Random word string
   */
  getRandomWord(): string {
    // Word lists of varying difficulty
    const WORD_LISTS = {
      EASY: [
        'cat', 'dog', 'run', 'jump', 'play', 'fast', 'slow', 'big', 'small', 'red',
        'blue', 'green', 'walk', 'talk', 'eat', 'sleep', 'work', 'game', 'code', 'type'
      ],
      MEDIUM: [
        'computer', 'keyboard', 'monitor', 'program', 'function', 'variable', 'constant',
        'developer', 'software', 'hardware', 'network', 'internet', 'browser', 'server'
      ],
      HARD: [
        'javascript', 'typescript', 'programming', 'development', 'application', 'responsive',
        'architecture', 'optimization', 'performance', 'experience', 'accessibility'
      ],
      EXPERT: [
        'asynchronous', 'serialization', 'internationalization', 'authentication',
        'authorization', 'microservices', 'infrastructure', 'containerization'
      ]
    };
    
    // Create a pool of words based on difficulty level
    let wordPool: string[] = [];
    
    // Add words based on current level
    if (this.difficultyLevel >= 1) {
      wordPool = wordPool.concat(WORD_LISTS.EASY);
    }
    
    if (this.difficultyLevel >= 2) {
      wordPool = wordPool.concat(WORD_LISTS.MEDIUM);
    }
    
    if (this.difficultyLevel >= 3) {
      wordPool = wordPool.concat(WORD_LISTS.HARD);
    }
    
    if (this.difficultyLevel >= 4) {
      wordPool = wordPool.concat(WORD_LISTS.EXPERT);
    }
    
    // Get a random word from the pool
    const randomIndex = Math.floor(Math.random() * wordPool.length);
    return wordPool[randomIndex];
  }
  
  /**
   * Spawn a random word at a random position
   * @returns The created Word object
   */
  spawnRandomWord(): Word {
    // Calculate spawn position on edge of screen
    const spawnPosition = this.getRandomEdgePosition();
    
    // Determine if it's a special word
    let type = WordType.NORMAL;
    let wordText = '';
    const effects: WordEffect[] = [];
    
    // 50% chance for power-up
    if (Math.random() < this.powerUpChance) {
      type = WordType.POWERUP;
      wordText = POWER_UP_WORDS[Math.floor(Math.random() * POWER_UP_WORDS.length)];
      effects.push({ type: 'blinking' });
    }
    // Normal word - get a random word with length based on difficulty
    else {
      // Get a random word from our word lists
      wordText = this.getRandomWord();
      
      // Add random effects based on difficulty
      if (Math.random() < 0.2) {
        effects.push({ type: 'blinking' });
      }
      
      if (this.difficultyLevel >= 2 && Math.random() < 0.3) {
        effects.push({ type: 'shaking' });
      }
      
      if (this.difficultyLevel >= 3 && Math.random() < 0.3) {
        effects.push({ type: 'flipped' });
      }
      
      if (this.difficultyLevel >= 4 && Math.random() < 0.2) {
        effects.push({ type: 'rotating' });
      }
    }
    
    // Spawn the word
    return this.spawnWord({
      text: wordText,
      type: type,
      effects: effects,
      x: spawnPosition.x,
      y: spawnPosition.y
    });
  }
  
  /**
   * Get a random position on the edge of the screen
   * @returns Position vector
   */
  private getRandomEdgePosition(): Phaser.Math.Vector2 {
    const { width, height } = this.scene.scale;
    
    // Random position on edge
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x = 0;
    let y = 0;
    
    switch (edge) {
      case 0: // top
        x = Math.random() * width;
        y = -50;
        break;
      case 1: // right
        x = width + 50;
        y = Math.random() * height;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + 50;
        break;
      case 3: // left
        x = -50;
        y = Math.random() * height;
        break;
    }
    
    return new Phaser.Math.Vector2(x, y);
  }
  
  /**
   * Handle word completion event
   * @param wordData - Data of the completed word
   */
  handleWordCompleted(wordData: WordData): void {
    // Score based on word length - longer words give more points
    const wordLength = wordData.text.length;
    const pointsPerLetter = 10;
    const points = wordLength * pointsPerLetter;
    
    this.score += points;
    
    // Emit score update event with word data
    this.eventEmitter.emit(GameEvents.SCORE_UPDATED, {
      score: this.score,
      wordData: wordData,
      pointsEarned: points
    });
  }
  
  /**
   * Get the current score
   * @returns Current score
   */
  getScore(): number {
    return this.score;
  }
  
  /**
   * Update all words
   * @param time - Current time
   * @param delta - Time since last frame
   */
  update(time: number, delta: number): void {
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Update all words
    for (let i = this.words.length - 1; i >= 0; i--) {
      const word = this.words[i];
      
      // Remove destroyed words from array
      if (!word.active) {
        this.words.splice(i, 1);
        continue;
      }
      
      word.update(time, delta);
      
      // Check for collision with center
      if (this.hasReachedCenter(word, centerX, centerY)) {
        this.handleWordReachedCenter(word);
      }
    }
  }
  
  /**
   * Check if a word has reached the center
   * @param word - Word to check
   * @param centerX - X coordinate of center
   * @param centerY - Y coordinate of center
   * @returns True if word has reached center
   */
  private hasReachedCenter(word: Word, centerX: number, centerY: number): boolean {
    const distance = Phaser.Math.Distance.Between(word.x, word.y, centerX, centerY);
    return distance < 50; // Adjust radius as needed
  }
  
  /**
   * Handle word reaching center (game over condition)
   * @param word - Word that reached center
   */
  private handleWordReachedCenter(word: Word): void {
    // Emit event with word data
    this.eventEmitter.emit(GameEvents.WORD_REACHED_CENTER, word.getWordData());
    
    // Remove the word
    word.destroy();
  }
  
  /**
   * Apply a global effect to all words
   * @param effect - The effect to apply
   * @param params - Parameters for the effect
   */
  applyGlobalEffect(effect: string, params: Record<string, unknown>): void {
    // Apply effect to all words
    this.words.forEach(word => {
      switch (effect) {
        case 'freeze':
          word.setVelocity(0, 0);
          break;
        case 'slow':
          word.setVelocity(
            word.velocity.x * (params.factor as number), 
            word.velocity.y * (params.factor as number)
          );
          break;
      }
    });
  }
  
  /**
   * Destroy all words on screen (bomb effect)
   */
  destroyAllWords(): void {
    // Create a copy of the array to avoid modification during iteration
    const wordsCopy = [...this.words];
    
    // Destroy all words with a slight delay for visual effect
    wordsCopy.forEach((word, index) => {
      this.scene.time.delayedCall(index * 50, () => {
        word.complete();
      });
    });
  }
  
  /**
   * Increase difficulty level
   */
  increaseLevel(): void {
    if (this.difficultyLevel < 4) {
      this.difficultyLevel++;
    }
  }
  
  /**
   * Reset to initial level
   */
  resetLevel(): void {
    this.difficultyLevel = 1;
    this.score = 0;
    
    // Clear all words
    this.words.forEach(word => word.destroy());
    this.words = [];
  }
  
  /**
   * Get current difficulty level
   * @returns Current level
   */
  getLevel(): number {
    return this.difficultyLevel;
  }
  
  /**
   * Get all power-up words
   * @returns Array of power-up words
   */
  static getPowerUpWords(): string[] {
    return POWER_UP_WORDS;
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    // Clean up event listeners
    this.eventEmitter.off(GameEvents.WORD_COMPLETED, this.handleWordCompleted, this);
    
    // Destroy all words
    this.words.forEach(word => word.destroy());
    this.words = [];
    
    super.destroy();
  }
}
