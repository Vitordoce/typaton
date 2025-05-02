import Phaser from 'phaser';

export default class PhaserGame {
  private game: Phaser.Game | null = null;

  constructor(containerId: string, width: number, height: number) {
    // We need to check if we're in the browser before creating the game
    if (typeof window !== 'undefined') {
      // Configuration for our Phaser game
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width,
        height,
        parent: containerId,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        scene: [BootScene, MainMenuScene, GameScene]
      };

      // Create the game instance
      this.game = new Phaser.Game(config);
    }
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load assets here
    this.load.image('background', '/assets/background.png');
    this.load.image('logo', '/assets/logo.png');
    this.load.image('button', '/assets/button.png');
  }

  create() {
    this.scene.start('MainMenuScene');
  }
}

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Add background
    this.add.image(width / 2, height / 2, 'background');

    // Add logo
    this.add.image(width / 2, height / 3, 'logo').setScale(0.5);

    // Add start button
    const startButton = this.add.image(width / 2, height / 2 + 100, 'button')
      .setInteractive()
      .setScale(0.5);

    // Add text to button
    this.add.text(width / 2, height / 2 + 100, 'Start Game', {
      fontSize: '32px',
      color: '#fff'
    }).setOrigin(0.5);

    // Start game on button click
    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

class GameScene extends Phaser.Scene {
  private words: string[] = [
    'typescript', 'javascript', 'phaser', 'nextjs', 'react',
    'game', 'development', 'coding', 'programming', 'typaton'
  ];
  private currentWord: Phaser.GameObjects.Text | null = null;
  private wordText: string = '';
  private score: number = 0;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private timeLeft: number = 60;
  private timeText: Phaser.GameObjects.Text | null = null;
  private timer: Phaser.Time.TimerEvent | null = null;
  private inputText: string = '';
  private inputDisplay: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Add background
    this.add.image(width / 2, height / 2, 'background');

    // Score display
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#fff'
    });

    // Timer display
    this.timeText = this.add.text(width - 150, 20, 'Time: 60', {
      fontSize: '24px',
      color: '#fff'
    });

    // Input display
    this.inputDisplay = this.add.text(width / 2, height - 50, '', {
      fontSize: '28px',
      color: '#fff'
    }).setOrigin(0.5);

    // Start the timer
    this.timer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });

    // Display a new word
    this.displayWord();

    // Set up keyboard input
    this.input.keyboard.on('keydown', this.handleKeyPress, this);
  }

  displayWord() {
    // Choose a random word
    const randomIndex = Math.floor(Math.random() * this.words.length);
    this.wordText = this.words[randomIndex];

    // Remove previous word if it exists
    if (this.currentWord) {
      this.currentWord.destroy();
    }

    // Display the new word
    const { width, height } = this.scale;
    this.currentWord = this.add.text(width / 2, height / 2, this.wordText, {
      fontSize: '48px',
      color: '#fff'
    }).setOrigin(0.5);
  }

  handleKeyPress(event: KeyboardEvent) {
    // Ignore if game is over
    if (this.timeLeft <= 0) return;

    // Handle backspace
    if (event.key === 'Backspace') {
      this.inputText = this.inputText.slice(0, -1);
    }
    // Handle Enter key (submit word)
    else if (event.key === 'Enter') {
      this.checkWord();
    }
    // Add character to input
    else if (event.key.length === 1) {
      this.inputText += event.key;
    }

    // Update the input display
    if (this.inputDisplay) {
      this.inputDisplay.setText(this.inputText);
    }
  }

  checkWord() {
    // Check if the input matches the current word
    if (this.inputText.toLowerCase() === this.wordText.toLowerCase()) {
      // Increase score
      this.score += this.wordText.length;
      if (this.scoreText) {
        this.scoreText.setText(`Score: ${this.score}`);
      }

      // Display a new word
      this.displayWord();
    }

    // Clear the input
    this.inputText = '';
    if (this.inputDisplay) {
      this.inputDisplay.setText('');
    }
  }

  updateTimer() {
    this.timeLeft--;
    
    if (this.timeText) {
      this.timeText.setText(`Time: ${this.timeLeft}`);
    }

    // End game when time runs out
    if (this.timeLeft <= 0) {
      if (this.timer) {
        this.timer.remove();
      }
      this.gameOver();
    }
  }

  gameOver() {
    const { width, height } = this.scale;

    // Display game over message
    this.add.rectangle(width / 2, height / 2, width, height / 2, 0x000000, 0.7);
    
    this.add.text(width / 2, height / 2 - 50, 'Game Over!', {
      fontSize: '48px',
      color: '#fff'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, `Final Score: ${this.score}`, {
      fontSize: '32px',
      color: '#fff'
    }).setOrigin(0.5);

    // Add restart button
    const restartButton = this.add.rectangle(width / 2, height / 2 + 100, 200, 50, 0x00aa00)
      .setInteractive();
    
    this.add.text(width / 2, height / 2 + 100, 'Play Again', {
      fontSize: '24px',
      color: '#fff'
    }).setOrigin(0.5);

    restartButton.on('pointerdown', () => {
      this.scene.restart();
    });
  }
}
