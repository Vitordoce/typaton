import * as Phaser from 'phaser';
import { ScoreData } from '../types/ScoreTypes';

/**
 * Game Over screen to display when the player loses
 * Shows score information and restart options
 */
export class GameOverScreen extends Phaser.Scene {
  private scoreData: ScoreData = {
    totalScore: 0,
    wordCount: 0,
    averageTypingSpeed: 0,
    highestWordScore: 0,
    wordScores: [],
    levelScores: [],
    powerUpsUsed: 0,
    powerUpsCollected: 0
  };
  private gameElements: Phaser.GameObjects.GameObject[] = [];
  
  constructor() {
    super('GameOverScreen');
  }
  
  init(data: { scoreData: ScoreData }) {
    // Use provided data or keep default values
    if (data && data.scoreData) {
      this.scoreData = data.scoreData;
    }
    console.log("GameOverScreen iniciada com score:", this.scoreData.totalScore);
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Create background with dramatic effect
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x330000, 0x330000, 0x110000, 0x110000, 1);
    bg.fillRect(0, 0, width, height);
    
    // Add decorative frame
    this.add.rectangle(width/2, height/2, width, height, 0x220000)
      .setStrokeStyle(6, 0x660000);
    
    // Game Over title with animation
    const gameOverText = this.add.text(width/2, height/4, 'GAME OVER', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '64px',
      color: '#ff0000',
      stroke: '#000',
      strokeThickness: 8
    }).setOrigin(0.5).setShadow(0, 4, '#ff0000', 10, false, true);
    
    this.gameElements.push(gameOverText);
    
    // Add dramatic flicker effect to the title
    this.tweens.add({
      targets: gameOverText,
      alpha: { from: 1, to: 0.7 },
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        // After initial flicker, add subtle continuous effect
        this.tweens.add({
          targets: gameOverText,
          alpha: { from: 1, to: 0.85 },
          duration: 800,
          yoyo: true,
          repeat: -1
        });
      }
    });
    
    // Add score display
    const finalScore = this.add.text(width/2, height/2 - 40, `FINAL SCORE: ${this.scoreData.totalScore}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    this.gameElements.push(finalScore);
    
    // Add statistics
    const stats = [
      `WORDS TYPED: ${this.scoreData.wordCount}`,
      `HIGHEST WORD SCORE: ${this.scoreData.highestWordScore}`,
      `LEVELS COMPLETED: ${this.scoreData.levelScores.length}`
    ];
    
    stats.forEach((text, index) => {
      const statText = this.add.text(width/2, height/2 + 20 + index * 40, text, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '16px',
        color: '#cccccc',
        stroke: '#000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      this.gameElements.push(statText);
    });
    
    // Create Play Again button
    const buttonBg = this.add.rectangle(width/2, height * 0.75, 280, 60, 0x660000)
      .setStrokeStyle(4, 0xff2222);
    
    const playAgainButton = this.add.text(width/2, height * 0.75, 'PLAY AGAIN', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '24px',
      color: '#ffffff',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    
    this.gameElements.push(buttonBg, playAgainButton);
    
    // Button hover and click effects
    playAgainButton.on('pointerover', () => {
      buttonBg.setFillStyle(0xaa0000);
      // Try to play sound if available
      try {
        this.sound.play('click', { volume: 0.5 });
      } catch {
        console.log('Sound not available');
      }
    });
    
    playAgainButton.on('pointerout', () => {
      buttonBg.setFillStyle(0x660000);
    });
    
    playAgainButton.on('pointerdown', () => {
      this.restartGame();
    });
    
    // Add button animation
    this.tweens.add({
      targets: [buttonBg, playAgainButton],
      scale: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add keyboard handling para ENTER e ESPAÇO
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.restartGame();
    });
    
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.restartGame();
    });
    
    // Add instruction text com mais destaque
    const instructionText = this.add.text(width/2, height * 0.85, 'PRESS ENTER OR SPACE TO RESTART', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    this.gameElements.push(instructionText);
    
    // Make instruction text blink mais visível
    this.tweens.add({
      targets: instructionText,
      alpha: { from: 1, to: 0.4 },
      scale: { from: 1, to: 1.05 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });
  }
  
  // Método para reiniciar o jogo com efeitos
  private restartGame(): void {
    // Adicionar efeito de flash na transição
    this.cameras.main.flash(500, 255, 0, 0, false, (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        // Garantir que todos os event listeners sejam removidos
        this.input.keyboard?.removeAllListeners();
        this.scene.start('TitleScene');
      }
    });
  }
} 