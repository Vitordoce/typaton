import * as Phaser from 'phaser';
import { WordManager } from './WordManager';

export default class GameScene extends Phaser.Scene {
  private inputText: string = '';
  private inputDisplay: Phaser.GameObjects.Text | null = null;
  private words: { text: Phaser.GameObjects.Text, value: string, vx: number, vy: number, duration: number, startTime: number, startX: number, startY: number }[] = [];
  private gameOver: boolean = false;
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private level: number = 1;
  private maxLevel: number = 5;
  private wordsCleared: number = 0;
  private wordsToClear: number = 10;
  private levelText: Phaser.GameObjects.Text | null = null;
  private levelCompleteText: Phaser.GameObjects.Text | null = null;
  private campaignComplete: boolean = false;
  private wordManager: WordManager;
  private arcadeFontStyle = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '24px', // larger for falling words
    color: '#ffe600', // yellow fill
    stroke: '#000', // black border
    strokeThickness: 6
    // No shadow for clarity
  };
  private lastSpawnTime: number = 0;
  private score: number = 0;
  private scoreText: Phaser.GameObjects.Text | null = null;

  // Level settings
  private getLevelSettings() {
    return {
      minDuration: 5, // seconds (slowest word)
      maxDuration: 10, // seconds (slowest word stays longest)
      wordsToClear: 10 + (this.level - 1) * 3
    };
  }

  constructor() {
    super('GameScene');
    this.wordManager = new WordManager();
  }

  create() {
    const { width, height } = this.scale;
    this.level = 1;
    this.campaignComplete = false;
    this.wordsCleared = 0;
    this.words = [];
    this.gameOver = false;
    this.wordsToClear = this.getLevelSettings().wordsToClear;
    this.inputText = '';
    this.lastSpawnTime = 0;
    this.score = 0;

    // Reset WordManager
    this.wordManager.resetLevel();

    // Add a background
    this.add.rectangle(width/2, height/2, width, height, 0x222222);

    // Score display (top left)
    this.scoreText = this.add.text(30, 30, `SCORE: 0`, {
      ...this.arcadeFontStyle,
      fontSize: '18px',
      color: '#00ffcc',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);

    // Input display
    this.inputDisplay = this.add.text(width / 2, height - 50, '', {
      ...this.arcadeFontStyle,
      fontSize: '20px',
      backgroundColor: '#333333',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);

    // Level display
    this.levelText = this.add.text(width / 2, 30, `LEVEL: ${this.level} / ${this.maxLevel}`, {
      ...this.arcadeFontStyle,
      fontSize: '14px',
      color: '#00ffcc',
      backgroundColor: '#222222',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);

    // Game over text (hidden initially)
    this.gameOverText = this.add.text(width / 2, height / 2, 'GAME OVER\nClick to restart', {
      ...this.arcadeFontStyle,
      fontSize: '28px',
      color: '#ff0000',
      align: 'center',
      lineSpacing: 20
    }).setOrigin(0.5).setVisible(false);

    // Level complete text (hidden initially)
    this.levelCompleteText = this.add.text(width / 2, height / 2, '', {
      ...this.arcadeFontStyle,
      fontSize: '24px',
      color: '#00ff00',
      align: 'center',
      backgroundColor: '#222222',
      padding: { x: 20, y: 10 },
      lineSpacing: 20
    }).setOrigin(0.5).setVisible(false);

    // Set up keyboard input
    this.input.keyboard?.on('keydown', this.handleKeyPress, this);

    // Set up click to restart or continue
    this.input.on('pointerdown', () => {
      if (this.gameOver) {
        this.scene.restart();
      } else if (this.levelCompleteText && this.levelCompleteText.visible) {
        this.nextLevel();
      } else if (this.campaignComplete) {
        this.scene.restart();
      }
    });
  }

  update(time: number, delta: number) {
    if (this.gameOver || this.campaignComplete) return;
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height - 40; // bottom center, above input
    const now = this.time.now;

    // Only 3 words on screen at a time
    if (this.words.length < 3 && (now - this.lastSpawnTime > 500 || this.words.length === 0)) {
      this.spawnWord(now, centerX, centerY);
      this.lastSpawnTime = now;
    }

    // Move words toward the center
    for (let i = this.words.length - 1; i >= 0; i--) {
      const wordObj = this.words[i];
      wordObj.text.x += wordObj.vx * (delta / 1000);
      wordObj.text.y += wordObj.vy * (delta / 1000);
      // If the word is close enough to the center, trigger game over
      const dx = wordObj.text.x - centerX;
      const dy = wordObj.text.y - centerY;
      if (Math.sqrt(dx*dx + dy*dy) < 30) {
        this.gameOver = true;
        if (this.gameOverText) {
          this.gameOverText.setVisible(true);
        }
        break;
      }
    }
  }

  spawnWord(now: number, centerX: number, centerY: number) {
    const { width, height } = this.scale;
    const { minDuration, maxDuration } = this.getLevelSettings();
    // Pick a random angle in a 120-degree arc above the player (120° to 240°)
    const angleDeg = Phaser.Math.Between(30, 150);
    const angleRad = Phaser.Math.DegToRad(angleDeg);
    // Use diagonal for spawn radius, so words start well off-screen
    const diagonal = Math.sqrt(width * width + height * height);
    const spawnRadius = diagonal * 0.8;
    let spawnX = centerX + Math.cos(angleRad) * spawnRadius;
    let spawnY = centerY - Math.sin(angleRad) * spawnRadius;
    // Clamp to a bit outside the screen, but not too far
    spawnX = Phaser.Math.Clamp(spawnX, -200, width + 200);
    spawnY = Phaser.Math.Clamp(spawnY, -200, height + 200);
    // Assign a random duration (how long to reach the center)
    const duration = Phaser.Math.FloatBetween(minDuration, maxDuration);
    // Calculate velocity vector
    const dx = centerX - spawnX;
    const dy = centerY - spawnY;
    const vx = dx / duration;
    const vy = dy / duration;
    // Use WordManager for word selection
    const wordValue = this.wordManager.getRandomWord();
    // Create text with arcade font (bigger, more legible)
    const wordText = this.add.text(spawnX, spawnY, wordValue, {
      ...this.arcadeFontStyle
    }).setOrigin(0.5);
    this.words.push({ text: wordText, value: wordValue, vx, vy, duration, startTime: now, startX: spawnX, startY: spawnY });
  }

  handleKeyPress = (event: KeyboardEvent) => {
    if (this.gameOver || this.campaignComplete) return;
    // Handle backspace
    if (event.key === 'Backspace') {
      this.inputText = this.inputText.slice(0, -1);
    }
    // Add character to input
    else if (event.key.length === 1) {
      this.inputText += event.key.toLowerCase();
    }
    // Update the input display
    if (this.inputDisplay) {
      this.inputDisplay.setText(this.inputText || '');
    }
    // Check if input matches any word
    this.checkWordMatch();
  }

  checkWordMatch() {
    // Remove spaces from input for matching
    const normalizedInput = this.inputText.replace(/\s+/g, '');
    for (let i = 0; i < this.words.length; i++) {
      // Remove spaces from word value for matching
      const normalizedWord = this.words[i].value.replace(/\s+/g, '');
      if (normalizedInput === normalizedWord) {
        // Remove the word
        this.words[i].text.destroy();
        this.words.splice(i, 1);
        // Clear input
        this.inputText = '';
        if (this.inputDisplay) {
          this.inputDisplay.setText('');
        }
        // Track cleared words
        this.wordsCleared++;
        // Increment score
        this.score++;
        if (this.scoreText) {
          this.scoreText.setText(`SCORE: ${this.score}`);
        }
        if (this.wordsCleared >= this.getLevelSettings().wordsToClear) {
          this.levelComplete();
        }
        break;
      }
    }
  }

  levelComplete() {
    if (this.levelCompleteText) {
      if (this.level < this.maxLevel) {
        this.levelCompleteText.setText(`LEVEL ${this.level} COMPLETE!\nCLICK TO CONTINUE`);
      } else {
        this.levelCompleteText.setText('CAMPAIGN COMPLETE!\nCLICK TO RESTART');
        this.campaignComplete = true;
      }
      this.levelCompleteText.setVisible(true);
    }
  }

  nextLevel() {
    if (this.levelCompleteText) {
      this.levelCompleteText.setVisible(false);
    }
    if (this.level < this.maxLevel) {
      this.level++;
      this.wordsCleared = 0;
      this.wordsToClear = this.getLevelSettings().wordsToClear;
      if (this.levelText) {
        this.levelText.setText(`LEVEL: ${this.level} / ${this.maxLevel}`);
      }
      // Remove all words from screen
      for (const word of this.words) {
        word.text.destroy();
      }
      this.words = [];
      // Increase WordManager difficulty
      this.wordManager.increaseLevel();
    } else {
      // Campaign complete, handled in levelComplete
    }
  }
}
