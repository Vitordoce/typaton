import Phaser from 'phaser';
import { WordManager } from './WordManager';
import { FallingWord } from './FallingWord';

// Game configuration constants
const GAME_CONFIG = {
  INITIAL_WORD_VELOCITY: 50,       // Base falling speed of words (pixels per second)
  VELOCITY_INCREMENT: 5,           // How much velocity increases per level
  WORDS_PER_MINUTE_INITIAL: 20,    // How many words appear per minute initially
  WORDS_PER_MINUTE_MAX: 60,        // Maximum words per minute
  WORDS_INCREMENT: 2,              // How many more words per minute per level
  GAME_DURATION: 60,               // Game duration in seconds
  LIVES: 1                         // Number of lives (keeping it simple with 1)
};

export default class GameScene extends Phaser.Scene {
  // Game state
  private isGameRunning: boolean = false;
  private score: number = 0;
  private timeLeft: number = GAME_CONFIG.GAME_DURATION;
  private lives: number = GAME_CONFIG.LIVES;
  private level: number = 1;
  
  // Word management
  private wordManager: WordManager;
  private fallingWords: FallingWord[] = [];
  private wordSpawnTimer: Phaser.Time.TimerEvent | null = null;
  private gameTimer: Phaser.Time.TimerEvent | null = null;
  private currentWordVelocity: number = GAME_CONFIG.INITIAL_WORD_VELOCITY;
  private wordsPerMinute: number = GAME_CONFIG.WORDS_PER_MINUTE_INITIAL;
  
  // UI elements
  private scoreText: Phaser.GameObjects.Text | null = null;
  private timeText: Phaser.GameObjects.Text | null = null;
  private livesText: Phaser.GameObjects.Text | null = null;
  private inputText: string = '';
  private inputDisplay: Phaser.GameObjects.Text | null = null;
  
  constructor() {
    super({ key: 'GameScene' });
    this.wordManager = new WordManager();
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Create UI elements
    this.createUI();
    
    // Show start screen
    this.showStartScreen();
    
    // Set up keyboard input
    this.input.keyboard.on('keydown', this.handleKeyPress, this);
  }
  
  update(time: number, delta: number) {
    if (!this.isGameRunning) return;
    
    // Update falling words
    for (let i = this.fallingWords.length - 1; i >= 0; i--) {
      const isActive = this.fallingWords[i].update(delta);
      
      // Remove words that are no longer active
      if (!isActive) {
        this.fallingWords.splice(i, 1);
        this.loseLife();
      }
    }
  }
  
  private createUI() {
    const { width, height } = this.scale;
    
    // Score display
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#fff'
    });
    
    // Timer display
    this.timeText = this.add.text(width - 150, 20, `Time: ${this.timeLeft}`, {
      fontSize: '24px',
      color: '#fff'
    });
    
    // Lives display
    this.livesText = this.add.text(width / 2, 20, `Lives: ${this.lives}`, {
      fontSize: '24px',
      color: '#fff'
    }).setOrigin(0.5, 0);
    
    // Input display
    this.inputDisplay = this.add.text(width / 2, height - 50, '', {
      fontSize: '28px',
      color: '#fff'
    }).setOrigin(0.5);
  }
  
  private showStartScreen() {
    const { width, height } = this.scale;
    
    // Create semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    
    // Title
    const title = this.add.text(width / 2, height / 3, 'TYPATON', {
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#fff'
    }).setOrigin(0.5);
    
    // Instructions
    const instructions = this.add.text(width / 2, height / 2, 'Type the falling words before they reach the bottom', {
      fontSize: '24px',
      color: '#fff'
    }).setOrigin(0.5);
    
    // Play button
    const playButton = this.add.rectangle(width / 2, height * 2/3, 200, 60, 0x00aa00)
      .setInteractive();
    
    const playText = this.add.text(width / 2, height * 2/3, 'PLAY', {
      fontSize: '32px',
      color: '#fff'
    }).setOrigin(0.5);
    
    // Start game on button click
    playButton.on('pointerdown', () => {
      // Remove start screen elements
      overlay.destroy();
      title.destroy();
      instructions.destroy();
      playButton.destroy();
      playText.destroy();
      
      // Start the game
      this.startGame();
    });
  }
  
  private startGame() {
    // Reset game state
    this.isGameRunning = true;
    this.score = 0;
    this.timeLeft = GAME_CONFIG.GAME_DURATION;
    this.lives = GAME_CONFIG.LIVES;
    this.level = 1;
    this.currentWordVelocity = GAME_CONFIG.INITIAL_WORD_VELOCITY;
    this.wordsPerMinute = GAME_CONFIG.WORDS_PER_MINUTE_INITIAL;
    this.inputText = '';
    this.fallingWords = [];
    
    // Update UI
    if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);
    if (this.timeText) this.timeText.setText(`Time: ${this.timeLeft}`);
    if (this.livesText) this.livesText.setText(`Lives: ${this.lives}`);
    if (this.inputDisplay) this.inputDisplay.setText('');
    
    // Start word spawn timer
    const spawnInterval = 60000 / this.wordsPerMinute; // Convert words per minute to milliseconds
    this.wordSpawnTimer = this.time.addEvent({
      delay: spawnInterval,
      callback: this.spawnWord,
      callbackScope: this,
      loop: true
    });
    
    // Start game timer
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }
  
  private spawnWord() {
    if (!this.isGameRunning) return;
    
    const { width } = this.scale;
    
    // Get a random word
    const word = this.wordManager.getRandomWord();
    
    // Calculate random x position (keeping away from edges)
    const margin = 100;
    const x = Phaser.Math.Between(margin, width - margin);
    
    // Create falling word
    const fallingWord = new FallingWord(this, word, x, this.currentWordVelocity);
    this.fallingWords.push(fallingWord);
  }
  
  private updateTimer() {
    this.timeLeft--;
    
    if (this.timeText) {
      this.timeText.setText(`Time: ${this.timeLeft}`);
    }
    
    // End game when time runs out
    if (this.timeLeft <= 0) {
      this.endGame();
    }
  }
  
  private handleKeyPress(event: KeyboardEvent) {
    // Ignore if game is not running
    if (!this.isGameRunning) return;
    
    // Handle backspace
    if (event.key === 'Backspace') {
      this.inputText = this.inputText.slice(0, -1);
    }
    // Handle Enter key (submit word)
    else if (event.key === 'Enter') {
      this.checkWord();
    }
    // Add character to input (only letters and numbers)
    else if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
      this.inputText += event.key.toLowerCase();
    }
    
    // Update the input display
    if (this.inputDisplay) {
      this.inputDisplay.setText(this.inputText);
    }
  }
  
  private checkWord() {
    if (this.inputText.length === 0) return;
    
    // Check if the input matches any falling word
    for (let i = 0; i < this.fallingWords.length; i++) {
      if (this.inputText === this.fallingWords[i].getWord().toLowerCase()) {
        // Word matched - add score based on word length
        this.score += this.inputText.length * 10;
        if (this.scoreText) {
          this.scoreText.setText(`Score: ${this.score}`);
        }
        
        // Show correct effect and remove word
        this.fallingWords[i].correctEffect();
        this.fallingWords.splice(i, 1);
        
        // Clear input
        this.inputText = '';
        if (this.inputDisplay) {
          this.inputDisplay.setText('');
        }
        
        return;
      }
    }
    
    // No match found - clear input
    this.inputText = '';
    if (this.inputDisplay) {
      this.inputDisplay.setText('');
    }
  }
  
  private loseLife() {
    this.lives--;
    
    if (this.livesText) {
      this.livesText.setText(`Lives: ${this.lives}`);
    }
    
    // End game if no lives left
    if (this.lives <= 0) {
      this.endGame();
    }
  }
  
  private endGame() {
    // Stop game
    this.isGameRunning = false;
    
    // Clear timers
    if (this.wordSpawnTimer) {
      this.wordSpawnTimer.remove();
      this.wordSpawnTimer = null;
    }
    
    if (this.gameTimer) {
      this.gameTimer.remove();
      this.gameTimer = null;
    }
    
    // Clear all falling words
    for (const word of this.fallingWords) {
      word.destroy();
    }
    this.fallingWords = [];
    
    // Show game over screen
    this.showGameOverScreen();
  }
  
  private showGameOverScreen() {
    const { width, height } = this.scale;
    
    // Create semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    
    // Game over text
    this.add.text(width / 2, height / 3, 'GAME OVER', {
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#ff0000'
    }).setOrigin(0.5);
    
    // Final score
    this.add.text(width / 2, height / 2, `Final Score: ${this.score}`, {
      fontSize: '32px',
      color: '#fff'
    }).setOrigin(0.5);
    
    // Restart button
    const restartButton = this.add.rectangle(width / 2, height * 2/3, 200, 60, 0x00aa00)
      .setInteractive();
    
    this.add.text(width / 2, height * 2/3, 'PLAY AGAIN', {
      fontSize: '28px',
      color: '#fff'
    }).setOrigin(0.5);
    
    // Restart game on button click
    restartButton.on('pointerdown', () => {
      this.scene.restart();
    });
  }
}
