import * as Phaser from 'phaser';
import { BaseManager } from './BaseManager';
import { GameEvents } from './types/GameEvents';
import { WordData } from './types/WordData';
import { ScoreData, WordScoreDetail, LevelScoreDetail } from './types/ScoreTypes';

// Score interfaces are now imported from './types/ScoreTypes'

/**
 * ScoreManager class
 * Responsible for calculating and tracking scores
 */
export class ScoreManager extends BaseManager {
  update(time: number, delta: number): void {
    throw new Error('Method not implemented.');
  }
  private totalScore: number = 0;
  private currentLevelScore: number = 0;
  private currentLevel: number = 1;
  private wordScores: WordScoreDetail[] = [];
  private levelScores: LevelScoreDetail[] = [];
  private typingStartTime: number = 0;
  private currentTypingWord: string = '';
  private powerUpsCollected: number = 0;
  private powerUpsUsed: number = 0;
  private wordCount: number = 0;
  private totalTypingTime: number = 0;
  private totalCharactersTyped: number = 0;
  
  // Scoring constants
  private readonly BASE_POINTS_PER_LETTER = 10;
  private readonly LENGTH_BONUS_MULTIPLIER = 0.5; // 50% bonus per letter above 5
  private readonly VELOCITY_BONUS_MULTIPLIER = 0.2; // 20% bonus per velocity unit above base
  private readonly TYPING_SPEED_BONUS_THRESHOLD = 5; // chars per second
  private readonly TYPING_SPEED_BONUS_MULTIPLIER = 0.3; // 30% bonus per char/sec above threshold
  private readonly EFFECT_BONUS_VALUES = {
    'blinking': 0.2, // 20% bonus
    'shaking': 0.3,  // 30% bonus
    'flipped': 0.4,  // 40% bonus
    'rotating': 0.5  // 50% bonus
  };
  
  constructor(scene: Phaser.Scene) {
    super(scene);
    
    // Set up event listeners
    if (this.eventEmitter) {
      this.eventEmitter.on(GameEvents.WORD_COMPLETED, this.handleWordCompleted, this);
      this.eventEmitter.on(GameEvents.LEVEL_COMPLETE, this.handleLevelComplete, this);
      this.eventEmitter.on(GameEvents.POWERUP_COLLECTED, this.handlePowerUpCollected, this);
      this.eventEmitter.on(GameEvents.POWERUP_ACTIVATED, this.handlePowerUpActivated, this);
    }
  }
  
  /**
   * Start tracking typing for a word
   * @param word - The word being typed
   */
  startTyping(word: string): void {
    this.typingStartTime = this.scene.time.now;
    this.currentTypingWord = word;
  }
  
  /**
   * Handle word completion event
   * @param wordData - Data of the completed word
   */
  handleWordCompleted(wordData: WordData): void {
    const now = this.scene.time.now;
    const timeToType = now - this.typingStartTime;
    const typingSpeed = this.calculateTypingSpeed(wordData.text, timeToType);
    
    // Calculate score components
    const basePoints = this.calculateBasePoints(wordData.text);
    const lengthBonus = this.calculateLengthBonus(wordData.text);
    const velocityBonus = this.calculateVelocityBonus(wordData.velocity.length());
    const typingSpeedBonus = this.calculateTypingSpeedBonus(typingSpeed);
    const effectsBonus = this.calculateEffectsBonus(wordData.effects);
    
    // Calculate total word score
    const wordScore = Math.round(
      basePoints * (1 + lengthBonus + velocityBonus + typingSpeedBonus + effectsBonus)
    );
    
    // Update totals
    this.totalScore += wordScore;
    this.currentLevelScore += wordScore;
    this.wordCount++;
    this.totalTypingTime += timeToType;
    this.totalCharactersTyped += wordData.text.length;
    
    // Store detailed word score
    this.wordScores.push({
      word: wordData.text,
      score: wordScore,
      basePoints,
      lengthBonus: Math.round(basePoints * lengthBonus),
      velocityBonus: Math.round(basePoints * velocityBonus),
      typingSpeedBonus: Math.round(basePoints * typingSpeedBonus),
      effectsBonus: Math.round(basePoints * effectsBonus),
      timeToType,
      typingSpeed
    });
    
    // Emit score update event
    this.eventEmitter.emit(GameEvents.SCORE_UPDATED, {
      totalScore: this.totalScore,
      wordScore,
      wordData
    });
    
    // Reset typing tracking
    this.typingStartTime = 0;
    this.currentTypingWord = '';
  }
  
  /**
   * Handle level completion event
   * @param level - The completed level number
   */
  handleLevelComplete(level: number): void {
    // Store level score
    this.levelScores.push({
      level,
      score: this.currentLevelScore,
      wordCount: this.wordCount,
      averageTypingSpeed: this.calculateAverageTypingSpeed()
    });
    
    // Reset level tracking
    this.currentLevelScore = 0;
    this.currentLevel = level + 1;
  }
  
  /**
   * Handle power-up collection event
   */
  handlePowerUpCollected(): void {
    this.powerUpsCollected++;
  }
  
  /**
   * Handle power-up activation event
   */
  handlePowerUpActivated(): void {
    this.powerUpsUsed++;
  }
  
  /**
   * Calculate base points for a word
   * @param word - The word to calculate points for
   * @returns Base points value
   */
  private calculateBasePoints(word: string): number {
    return word.length * this.BASE_POINTS_PER_LETTER;
  }
  
  /**
   * Calculate length bonus for a word
   * @param word - The word to calculate bonus for
   * @returns Length bonus multiplier
   */
  private calculateLengthBonus(word: string): number {
    const extraLetters = Math.max(0, word.length - 5);
    return extraLetters * this.LENGTH_BONUS_MULTIPLIER;
  }
  
  /**
   * Calculate velocity bonus based on word speed
   * @param velocity - The velocity magnitude
   * @returns Velocity bonus multiplier
   */
  private calculateVelocityBonus(velocity: number): number {
    const baseVelocity = 50; // Base velocity for comparison
    const extraVelocity = Math.max(0, velocity - baseVelocity);
    return (extraVelocity / 10) * this.VELOCITY_BONUS_MULTIPLIER;
  }
  
  /**
   * Calculate typing speed in characters per second
   * @param word - The typed word
   * @param timeMs - Time taken to type in milliseconds
   * @returns Typing speed in characters per second
   */
  private calculateTypingSpeed(word: string, timeMs: number): number {
    if (timeMs <= 0) return 0;
    const timeSeconds = timeMs / 1000;
    return word.length / timeSeconds;
  }
  
  /**
   * Calculate typing speed bonus
   * @param typingSpeed - Typing speed in characters per second
   * @returns Typing speed bonus multiplier
   */
  private calculateTypingSpeedBonus(typingSpeed: number): number {
    const extraSpeed = Math.max(0, typingSpeed - this.TYPING_SPEED_BONUS_THRESHOLD);
    return extraSpeed * this.TYPING_SPEED_BONUS_MULTIPLIER;
  }
  
  /**
   * Calculate effects bonus based on word effects
   * @param effects - Array of word effects
   * @returns Effects bonus multiplier
   */
  private calculateEffectsBonus(effects: { type: string }[]): number {
    let totalBonus = 0;
    
    for (const effect of effects) {
      totalBonus += this.EFFECT_BONUS_VALUES[effect.type as keyof typeof this.EFFECT_BONUS_VALUES] || 0;
    }
    
    return totalBonus;
  }
  
  /**
   * Calculate average typing speed across all words
   * @returns Average typing speed in characters per second
   */
  private calculateAverageTypingSpeed(): number {
    if (this.totalTypingTime <= 0) return 0;
    const timeSeconds = this.totalTypingTime / 1000;
    return this.totalCharactersTyped / timeSeconds;
  }
  
  /**
   * Get the current total score
   * @returns Current score
   */
  getTotalScore(): number {
    return this.totalScore;
  }
  
  /**
   * Get the current level score
   * @returns Current level score
   */
  getCurrentLevelScore(): number {
    return this.currentLevelScore;
  }
  
  /**
   * Get complete score data
   * @returns Complete score data object
   */
  getScoreData(): ScoreData {
    return {
      totalScore: this.totalScore,
      wordCount: this.wordCount,
      averageTypingSpeed: this.calculateAverageTypingSpeed(),
      highestWordScore: this.getHighestWordScore(),
      wordScores: [...this.wordScores],
      levelScores: [...this.levelScores],
      powerUpsUsed: this.powerUpsUsed,
      powerUpsCollected: this.powerUpsCollected
    };
  }
  
  /**
   * Get the highest individual word score
   * @returns Highest word score
   */
  private getHighestWordScore(): number {
    if (this.wordScores.length === 0) return 0;
    return Math.max(...this.wordScores.map(ws => ws.score));
  }
  
  /**
   * Reset all scores
   */
  resetScores(): void {
    this.totalScore = 0;
    this.currentLevelScore = 0;
    this.currentLevel = 1;
    this.wordScores = [];
    this.levelScores = [];
    this.wordCount = 0;
    this.totalTypingTime = 0;
    this.totalCharactersTyped = 0;
    this.powerUpsCollected = 0;
    this.powerUpsUsed = 0;
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    // Clean up event listeners
    this.eventEmitter.off(GameEvents.WORD_COMPLETED, this.handleWordCompleted, this);
    this.eventEmitter.off(GameEvents.LEVEL_COMPLETE, this.handleLevelComplete, this);
    this.eventEmitter.off(GameEvents.POWERUP_COLLECTED, this.handlePowerUpCollected, this);
    this.eventEmitter.off(GameEvents.POWERUP_ACTIVATED, this.handlePowerUpActivated, this);
    
    super.destroy();
  }
}