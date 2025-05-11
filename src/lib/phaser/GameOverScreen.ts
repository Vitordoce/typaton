import * as Phaser from 'phaser';
import { ScoreData, WordScoreDetail } from './types/ScoreTypes';

/**
 * GameOverScreen class
 * Displays detailed score information when the game is over
 */
export class GameOverScreen {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private scoreData: ScoreData;
  private isVisible: boolean = false;
  
  // Style constants
  private readonly TITLE_STYLE = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '32px',
    color: '#ff0000',
    stroke: '#000000',
    strokeThickness: 6
  };
  
  private readonly HEADER_STYLE = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '20px',
    color: '#ffff00',
    stroke: '#000000',
    strokeThickness: 4
  };
  
  private readonly TEXT_STYLE = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '16px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3
  };
  
  private readonly SMALL_TEXT_STYLE = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '12px',
    color: '#cccccc',
    stroke: '#000000',
    strokeThickness: 2
  };
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setVisible(false);
    this.isVisible = false;
    
    // Create a default empty score data
    this.scoreData = {
      totalScore: 0,
      wordCount: 0,
      averageTypingSpeed: 0,
      highestWordScore: 0,
      wordScores: [],
      levelScores: [],
      powerUpsUsed: 0,
      powerUpsCollected: 0
    };
  }
  
  /**
   * Show the game over screen with score data
   * @param scoreData - Complete score data to display
   */
  show(scoreData: ScoreData): void {
    this.scoreData = scoreData;
    this.createContent();
    this.container.setVisible(true);
    this.isVisible = true;
    
    // Add animation
    this.scene.tweens.add({
      targets: this.container,
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Power2'
    });
  }
  
  /**
   * Hide the game over screen
   */
  hide(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.container.setVisible(false);
        this.isVisible = false;
        this.container.removeAll(true);
      }
    });
  }
  
  /**
   * Check if the screen is currently visible
   * @returns True if visible
   */
  isShowing(): boolean {
    return this.isVisible && this.container.visible;
  }
  
  /**
   * Create all content for the game over screen
   */
  private createContent(): void {
    // Clear any existing content
    this.container.removeAll(true);
    
    const { width, height } = this.scene.scale;
    
    // Add semi-transparent background
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.9)
      .setOrigin(0, 0);
    this.container.add(bg);
    
    // Add title
    const title = this.scene.add.text(width / 2, 60, 'GAME OVER', this.TITLE_STYLE)
      .setOrigin(0.5);
    this.container.add(title);
    
    // Add total score
    const totalScore = this.scene.add.text(
      width / 2, 
      120, 
      `FINAL SCORE: ${this.scoreData.totalScore}`, 
      this.HEADER_STYLE
    ).setOrigin(0.5);
    this.container.add(totalScore);
    
    // Add summary statistics
    this.addSummaryStats(width / 2, 180);
    
    // Add level breakdown
    this.addLevelBreakdown(width / 4, 300);
    
    // Add top words
    this.addTopWords(width * 3 / 4, 300);
    
    // Add restart button
    const restartButton = this.createButton(
      width / 2,
      height - 80,
      'PLAY AGAIN',
      () => {
        this.scene.scene.restart();
      }
    );
    this.container.add(restartButton);
  }
  
  /**
   * Add summary statistics section
   * @param x - X position
   * @param y - Y position
   */
  private addSummaryStats(x: number, y: number): void {
    const stats = [
      `Words Typed: ${this.scoreData.wordCount}`,
      `Average Speed: ${this.scoreData.averageTypingSpeed.toFixed(1)} chars/sec`,
      `Power-ups Collected: ${this.scoreData.powerUpsCollected}`,
      `Power-ups Used: ${this.scoreData.powerUpsUsed}`
    ];
    
    const statsContainer = this.scene.add.container(x, y);
    
    stats.forEach((stat, index) => {
      const text = this.scene.add.text(0, index * 30, stat, this.TEXT_STYLE)
        .setOrigin(0.5, 0);
      statsContainer.add(text);
    });
    
    this.container.add(statsContainer);
  }
  
  /**
   * Add level breakdown section
   * @param x - X position
   * @param y - Y position
   */
  private addLevelBreakdown(x: number, y: number): void {
    const levelContainer = this.scene.add.container(x, y);
    
    // Add header
    const header = this.scene.add.text(0, 0, 'LEVEL BREAKDOWN', this.HEADER_STYLE)
      .setOrigin(0.5, 0);
    levelContainer.add(header);
    
    // Add level scores
    this.scoreData.levelScores.forEach((levelScore, index) => {
      const levelText = this.scene.add.text(
        0,
        50 + index * 40,
        `Level ${levelScore.level}: ${levelScore.score} pts`,
        this.TEXT_STYLE
      ).setOrigin(0.5, 0);
      
      const detailText = this.scene.add.text(
        0,
        50 + index * 40 + 20,
        `${levelScore.wordCount} words, ${levelScore.averageTypingSpeed.toFixed(1)} chars/sec`,
        this.SMALL_TEXT_STYLE
      ).setOrigin(0.5, 0);
      
      levelContainer.add([levelText, detailText]);
    });
    
    this.container.add(levelContainer);
  }
  
  /**
   * Add top words section
   * @param x - X position
   * @param y - Y position
   */
  private addTopWords(x: number, y: number): void {
    const wordsContainer = this.scene.add.container(x, y);
    
    // Add header
    const header = this.scene.add.text(0, 0, 'TOP SCORING WORDS', this.HEADER_STYLE)
      .setOrigin(0.5, 0);
    wordsContainer.add(header);
    
    // Get top 5 words by score
    const topWords = [...this.scoreData.wordScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    // Add top words
    topWords.forEach((wordScore, index) => {
      this.addWordScoreDetail(wordsContainer, wordScore, 50 + index * 60);
    });
    
    this.container.add(wordsContainer);
  }
  
  /**
   * Add detailed word score information
   * @param container - Container to add to
   * @param wordScore - Word score details
   * @param y - Y position
   */
  private addWordScoreDetail(
    container: Phaser.GameObjects.Container, 
    wordScore: WordScoreDetail, 
    y: number
  ): void {
    // Word and score
    const wordText = this.scene.add.text(
      0,
      y,
      `"${wordScore.word}": ${wordScore.score} pts`,
      this.TEXT_STYLE
    ).setOrigin(0.5, 0);
    
    // Score breakdown
    const breakdown = [
      `Base: ${wordScore.basePoints}`,
      `Length: +${wordScore.lengthBonus}`,
      `Speed: +${wordScore.typingSpeedBonus}`,
      `Effects: +${wordScore.effectsBonus}`
    ];
    
    const breakdownText = this.scene.add.text(
      0,
      y + 25,
      breakdown.join(' | '),
      this.SMALL_TEXT_STYLE
    ).setOrigin(0.5, 0);
    
    container.add([wordText, breakdownText]);
  }
  
  /**
   * Create a button with text and callback
   * @param x - X position
   * @param y - Y position
   * @param text - Button text
   * @param callback - Click callback
   * @returns Container with button elements
   */
  private createButton(
    x: number, 
    y: number, 
    text: string, 
    callback: () => void
  ): Phaser.GameObjects.Container {
    const buttonContainer = this.scene.add.container(x, y);
    
    // Button background
    const bg = this.scene.add.rectangle(0, 0, 200, 50, 0xff0000)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', callback)
      .on('pointerover', () => {
        bg.setFillStyle(0xff3333);
      })
      .on('pointerout', () => {
        bg.setFillStyle(0xff0000);
      });
    
    // Button text
    const buttonText = this.scene.add.text(0, 0, text, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    buttonContainer.add([bg, buttonText]);
    
    // Add pulsing animation
    this.scene.tweens.add({
      targets: buttonContainer,
      scale: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    return buttonContainer;
  }
}