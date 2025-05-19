import * as Phaser from 'phaser';

/**
 * Title screen scene that displays the game title, start button, and instructions
 * with animated falling words to illustrate the game concept.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.scale;
    
    // Create background with gradient for attractive visuals
    this.add.rectangle(width/2, height/2, width , height, 0x111133)
      .setStrokeStyle(4, 0x3333ff);
    
    // Create large title with pulsing effect
    const titleText = this.add.text(width/2, height/3, 'TYPATON', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '64px',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Add pulsing animation to the title
    this.tweens.add({
      targets: titleText,
      scale: { from: 1, to: 1.05 },
      duration: 1200,
      yoyo: true,
      repeat: -1
    });
    
    // Create start button with visual effect
    const startButton = this.add.text(width/2, height/2, 'START GAME', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 4,
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.startGame())
      .on('pointerover', () => startButton.setTint(0x66ff66))
      .on('pointerout', () => startButton.clearTint());
    
    // Add pulsing animation to the button
    this.tweens.add({
      targets: startButton,
      scale: { from: 1, to: 1.1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    // Add instructions below
    const instructions = [
      'TYPE THE FALLING WORDS',
      'COLLECT POWER-UPS',
      'SURVIVE ALL LEVELS'
    ];
    
    instructions.forEach((text, index) => {
      this.add.text(width/2, height * 0.65 + index * 40, text, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '20px',
        color: '#aaaaaa',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5);
    });

    // Add "Press ENTER to start" text
    const spaceText = this.add.text(width/2, height * 0.85, 'PRESS SPACE TO START', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Add blinking animation to the ENTER text
    this.tweens.add({
      targets: spaceText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    // Set up keyboard input for Space key
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.startGame();
    });

    // Add animation of falling words to show the game concept
    this.createFallingWords();
  }
  
  // Method to start the game
  private startGame() {
    
    // Add a brief flash effect before starting
    this.cameras.main.flash(500, 255, 255, 255, true, (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        this.scene.start('GameScene');
      }
    });
  }

  /**
   * Creates animated falling words to illustrate the game
   */
  private createFallingWords() {
    const { width, height } = this.scale;
    const words = ['type', 'fast', 'game', 'score', 'win', 'power', 'freeze', 'shield', 'bomb','letter'];
    
    words.forEach((word, index) => {
      const x = Phaser.Math.Between(100, width - 100);
      const y = -50 - (index * 30);
      const delay = index * 300;
      
      const wordText = this.add.text(x, y, word, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '24px',
        color: index % 3 === 0 ? '#ffff00' : (index % 3 === 1 ? '#00ffff' : '#ff00ff'),
        stroke: '#000',
        strokeThickness: 3
      }).setAlpha(0.6);
      
      this.tweens.add({
        targets: wordText,
        y: height + 50,
        delay: delay,
        duration: Phaser.Math.Between(5000, 8000),
        ease: 'Linear',
        onComplete: () => {
          wordText.destroy();
          // Recreate the word at the top with random position
          const newX = Phaser.Math.Between(100, width - 100);
          const newWord = this.add.text(newX, -50, words[Phaser.Math.Between(0, words.length - 1)], {
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '24px',
            color: Phaser.Math.Between(0, 2) === 0 ? '#ffff00' : (Phaser.Math.Between(0, 1) === 0 ? '#00ffff' : '#ff00ff'),
            stroke: '#000',
            strokeThickness: 3
          }).setAlpha(0.6);
          
          this.tweens.add({
            targets: newWord,
            y: height + 50,
            duration: Phaser.Math.Between(5000, 8000),
            ease: 'Linear',
            onComplete: () => newWord.destroy()
          });
        }
      });
    });
  }
} 