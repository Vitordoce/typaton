import * as Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  private inputText: string = '';
  private inputDisplay: Phaser.GameObjects.Text | null = null;
  private words: { text: Phaser.GameObjects.Text, value: string }[] = [];
  private gameOver: boolean = false;
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private wordList: string[] = [
    'code', 'type', 'fast', 'game', 'text', 
    'word', 'play', 'keys', 'next', 'good',
    'time', 'work', 'flow', 'easy', 'hard'
  ];
  private spawnTimer: number = 0;
  
  constructor() {
    super('GameScene');
  }
  
  create() {
    console.log('GameScene created');
    const { width, height } = this.scale;
    
    // Add a background
    this.add.rectangle(width/2, height/2, width, height, 0x222222);
    
    // Input display
    this.inputDisplay = this.add.text(width / 2, height - 50, '', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    
    // Game over text (hidden initially)
    this.gameOverText = this.add.text(width / 2, height / 2, 'GAME OVER\nClick to restart', {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#ff0000',
      align: 'center'
    }).setOrigin(0.5).setVisible(false);
    
    // Set up keyboard input
    this.input.keyboard?.on('keydown', this.handleKeyPress, this);
    
    // Set up click to restart
    this.input.on('pointerdown', () => {
      if (this.gameOver) {
        this.scene.restart();
      }
    });
  }
  
  update(time: number, delta: number) {
    if (this.gameOver) return;
    
    // Spawn new words
    this.spawnTimer += delta;
    if (this.spawnTimer > 2000) { // Spawn every 2 seconds
      this.spawnWord();
      this.spawnTimer = 0;
    }
    
    // Move words down
    for (let i = this.words.length - 1; i >= 0; i--) {
      const wordObj = this.words[i];
      wordObj.text.y += 1; // Speed of falling
      
      // Check if word hit the bottom
      if (wordObj.text.y > this.scale.height - 80) {
        // Game over
        this.gameOver = true;
        if (this.gameOverText) {
          this.gameOverText.setVisible(true);
        }
        break;
      }
    }
  }
  
  spawnWord() {
    const { width } = this.scale;
    // Random word from list
    const randomIndex = Math.floor(Math.random() * this.wordList.length);
    const wordValue = this.wordList[randomIndex];
    
    // Random position
    const x = Phaser.Math.Between(100, width - 100);
    
    const wordText = this.add.text(x, 50, wordValue, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.words.push({ text: wordText, value: wordValue });
  }
  
  handleKeyPress = (event: KeyboardEvent) => {
    if (this.gameOver) return;
    
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
    for (let i = 0; i < this.words.length; i++) {
      if (this.inputText === this.words[i].value) {
        // Remove the word
        this.words[i].text.destroy();
        this.words.splice(i, 1);
        
        // Clear input
        this.inputText = '';
        if (this.inputDisplay) {
          this.inputDisplay.setText('');
        }
        break;
      }
    }
  }
}
