import * as Phaser from 'phaser';
import { BaseManager } from './BaseManager';
import { Word } from './Word';
import { WordType, WordEffect, WordData, WordConfig } from './WordData';
import { GameEvents } from './GameEvents';

// Word lists of varying difficulty
export const WORD_LISTS = {
  EASY: [
    'cat', 'dog', 'run', 'jump', 'play', 'fast', 'slow', 'big', 'small', 'red',
    'blue', 'green', 'walk', 'talk', 'eat', 'sleep', 'work', 'game', 'code', 'type'
  ],
  MEDIUM: [
    'computer', 'keyboard', 'monitor', 'program', 'function', 'variable', 'constant',
    'developer', 'software', 'hardware', 'network', 'internet', 'browser', 'server',
    'client', 'database', 'algorithm', 'interface', 'library', 'framework'
  ],
  HARD: [
    'javascript', 'typescript', 'programming', 'development', 'application', 'responsive',
    'architecture', 'optimization', 'performance', 'experience', 'accessibility',
    'authentication', 'authorization', 'implementation', 'documentation', 'configuration',
    'integration', 'deployment', 'maintenance', 'refactoring'
  ],
  EXPERT: [
    'asynchronous', 'serialization', 'internationalization', 'authentication',
    'authorization', 'microservices', 'infrastructure', 'containerization',
    'virtualization', 'orchestration', 'parallelization', 'encapsulation',
    'polymorphism', 'inheritance', 'abstraction', 'implementation', 'functionality',
    'compatibility', 'interoperability', 'sustainability'
  ],
  // Power-up words
  POWERUPS: ['freeze', 'slow', 'bomb', 'shield']
};

/**
 * WordManager class
 * Responsible for spawning, tracking, and updating words
 */
export class WordManager extends BaseManager {
  private words: Word[] = [];
  private difficultyLevel: number = 1;
  private score: number = 0;
  private wordPool: string[] = [];
  private powerUpChance: number = 0.5; // 50% chance for power-up
  
  constructor(scene: Phaser.Scene) {
    super(scene);
    
    // Initialize word pool
    this.refreshWordPool();
    
    // Add debugging to check if eventEmitter is defined
    console.log('WordManager constructor - scene:', scene);
    console.log('WordManager constructor - this.scene:', this.scene);
    console.log('WordManager constructor - this.eventEmitter:', this.eventEmitter);
    
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
    
    // Set velocity and emit event with word data
    const velocity = this.calculateVelocityForDifficulty();
    word.setVelocity(velocity.x, velocity.y);
    
    return word;
  }
  
  /**
   * Spawn a random word at a random position
   * @returns The created Word object
   */
  spawnRandomWord(): Word {
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate spawn position on edge of screen
    const spawnPosition = this.getRandomEdgePosition();
    
    // Determine if it's a special word
    let type = WordType.NORMAL;
    let wordText = '';
    let effects: WordEffect[] = [];
    
    // 50% chance for power-up
    if (Math.random() < this.powerUpChance) {
      type = WordType.POWERUP;
      const powerUps = WordManager.getPowerUpWords();
      wordText = powerUps[Math.floor(Math.random() * powerUps.length)];
      effects.push({ type: 'blinking' });
    }
    // Normal word
    else {
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
   * Calculate velocity based on current difficulty
   * @returns Velocity vector pointing toward center
   */
  private calculateVelocityForDifficulty(): Phaser.Math.Vector2 {
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Base speed increases with difficulty
    const baseSpeed = 50 + (this.difficultyLevel * 10);
    
    // Get random edge position
    const edgePosition = this.getRandomEdgePosition();
    
    // Calculate direction vector to center
    const dirX = centerX - edgePosition.x;
    const dirY = centerY - edgePosition.y;
    
    // Normalize and scale by speed
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    return new Phaser.Math.Vector2(
      (dirX / length) * baseSpeed,
      (dirY / length) * baseSpeed
    );
  }
  
  /**
   * Get a random position on the edge of the screen
   * @returns Position vector
   */
  private getRandomEdgePosition(): Phaser.Math.Vector2 {
    const { width, height } = this.scene.scale;
    
    // Random position on edge
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x: number, y: number;
    
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
    // Simple scoring: one point per word
    this.score++;
    
    // Emit score update event with word data
    this.eventEmitter.emit(GameEvents.SCORE_UPDATED, {
      score: this.score,
      wordData: wordData
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
   * Apply global effect to all words
   * @param effect - Effect name
   * @param params - Effect parameters
   */
  applyGlobalEffect(effect: string, params: any): void {
    // Apply effects to all words (for power-ups)
    this.words.forEach(word => {
      switch (effect) {
        case 'freeze':
          word.setVelocity(0, 0);
          break;
        case 'slow':
          word.setVelocity(word.velocity.x * params.factor, word.velocity.y * params.factor);
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
   * Get a random word based on current difficulty level
   * @returns Random word string
   */
  getRandomWord(): string {
    if (this.wordPool.length === 0) {
      this.refreshWordPool();
    }
    
    // Get a random word from the pool and remove it
    const randomIndex = Math.floor(Math.random() * this.wordPool.length);
    const word = this.wordPool[randomIndex];
    this.wordPool.splice(randomIndex, 1);
    
    return word;
  }
  
  /**
   * Increase difficulty level
   */
  increaseLevel(): void {
    if (this.difficultyLevel < 4) {
      this.difficultyLevel++;
      this.refreshWordPool();
    }
  }
  
  /**
   * Reset to initial level
   */
  resetLevel(): void {
    this.difficultyLevel = 1;
    this.score = 0;
    this.refreshWordPool();
    
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
   * Refresh the word pool based on current level
   */
  private refreshWordPool(): void {
    this.wordPool = [];
    
    // Add words based on current level
    if (this.difficultyLevel >= 1) {
      this.wordPool = this.wordPool.concat(WORD_LISTS.EASY);
    }
    
    if (this.difficultyLevel >= 2) {
      this.wordPool = this.wordPool.concat(WORD_LISTS.MEDIUM);
    }
    
    if (this.difficultyLevel >= 3) {
      this.wordPool = this.wordPool.concat(WORD_LISTS.HARD);
    }
    
    if (this.difficultyLevel >= 4) {
      this.wordPool = this.wordPool.concat(WORD_LISTS.EXPERT);
    }
    
    // Shuffle the word pool
    this.shuffleArray(this.wordPool);
  }
  
  /**
   * Fisher-Yates shuffle algorithm
   * @param array - Array to shuffle
   */
  private shuffleArray(array: string[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  /**
   * Get all power-up words
   * @returns Array of power-up words
   */
  static getPowerUpWords(): string[] {
    return WORD_LISTS.POWERUPS;
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
