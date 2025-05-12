import * as Phaser from 'phaser';
import { ScoreData } from '../types/ScoreTypes';

/**
 * Victory screen displayed when the player completes all levels
 * Includes score display, statistics, and celebration effects
 */
export class WinScene extends Phaser.Scene {
  private scoreData!: ScoreData;
  private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  
  constructor() {
    super('WinScene');
  }
  
  init(data: { scoreData: ScoreData }) {
    // Use fallback data if none is provided
    this.scoreData = data.scoreData || {
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
  
  create() {
    const { width, height } = this.scale;
    
    // Create a vibrant background with gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000066, 0x000066, 0x000033, 0x000033, 1);
    bg.fillRect(0, 0, width, height);
    
    // Add decorative frame
    this.add.rectangle(width/2, height/2, width - 100, height - 100, 0x000066)
      .setStrokeStyle(8, 0x4444ff);
    
    // Create star particle system
    this.createStarParticles();
    
    // Victory text with enhanced animation
    const victoryText = this.add.text(width/2, height/5, 'VICTORY!', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '64px',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 8
    }).setOrigin(0.5).setShadow(0, 4, '#ff8800', 5, true, true);
    
    // Enhance the victory text animation with both scale and glow
    this.tweens.add({
      targets: victoryText,
      scale: { from: 0.8, to: 1.2 },
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Add a rotating glow effect
    this.tweens.add({
      targets: victoryText,
      angle: { from: -3, to: 3 },
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Final score with more visual impact
    const scoreTextBg = this.add.rectangle(width/2, height/3 + 30, 440, 60, 0x220066)
      .setStrokeStyle(4, 0x8866ff);
      
    this.add.text(width/2, height/3 + 30, `FINAL SCORE: ${this.scoreData?.totalScore || 0}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Animate the score counter
    this.tweens.add({
      targets: scoreTextBg,
      scaleX: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    // Statistics panel with improved styling
    const statsPanel = this.add.rectangle(width/2, height/2 + 40, 500, 220, 0x000033, 0.7)
      .setStrokeStyle(3, 0x6666ff);
    
    // Game statistics with better formatting
    const stats = [
      `LEVELS COMPLETED: ${this.scoreData?.levelScores?.length || 0}`,
      `WORDS TYPED: ${this.scoreData?.wordCount || 0}`,
      `POWER-UPS USED: ${this.scoreData?.powerUpsUsed || 0}`,
      `HIGHEST WORD SCORE: ${this.scoreData?.highestWordScore || 0}`
    ];
    
    // Animate stats appearance
    this.tweens.add({
      targets: statsPanel,
      scaleY: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    // Add stats with staggered appearance
    stats.forEach((text, index) => {
      const statText = this.add.text(width/2, height/2 - 40 + index * 40, text, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '22px',
        color: '#aaffaa',
        stroke: '#000',
        strokeThickness: 2
      }).setOrigin(0.5).setAlpha(0);
      
      // Staggered animation for each stat
      this.tweens.add({
        targets: statText,
        alpha: 1,
        x: { from: width/2 - 30, to: width/2 },
        duration: 400,
        delay: 500 + index * 150,
        ease: 'Power2'
      });
    });
    
    // Play Again button with enhanced interaction
    const buttonBg = this.add.rectangle(width/2, height * 0.78, 300, 70, 0x880000)
      .setStrokeStyle(4, 0xff2222);
    
    const playAgainButton = this.add.text(width/2, height * 0.78, 'PLAY AGAIN', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '28px',
      color: '#ffffff',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
      
    // Button hover and click effects
    playAgainButton.on('pointerover', () => {
      buttonBg.setFillStyle(0xaa0000);
      // Try to play sound, but catch errors if sound system isn't ready
      try {
        this.sound.play('click', { volume: 0.5 });
      } catch {
        console.log('Sound not available');
      }
    });
    
    playAgainButton.on('pointerout', () => {
      buttonBg.setFillStyle(0x880000);
    });
    
    playAgainButton.on('pointerdown', () => {
      buttonBg.setFillStyle(0x660000);
      
      // Clean up particles before switching scenes
      this.emitters.forEach(emitter => emitter.stop());
      
      // Return to title screen
      this.scene.start('TitleScene');
    });
    
    // Subtle pulsing animation for the button
    this.tweens.add({
      targets: [buttonBg, playAgainButton],
      scale: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  /**
   * Creates a particle system with star effects
   * Uses a fallback system if particle creation fails
   */
  private createStarParticles() {
    // Create a simple star shape graphic
    const graphics = this.make.graphics({ x: 0, y: 0 });
    
    // Draw a star shape
    graphics.fillStyle(0xffffff, 1);
    graphics.beginPath();
    
    // Simple star shape
    const starPoints = 5;
    const outerRadius = 5;
    const innerRadius = 2;
    
    for (let i = 0; i < starPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / starPoints;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    
    graphics.closePath();
    graphics.fillPath();
    
    // Generate a texture from the graphics object
    graphics.generateTexture('star', 10, 10);
    
    // Create particle emitters at different positions
    const { width, height } = this.scale;
    const emitterPositions = [
      { x: width * 0.25, y: height * 0.2 },
      { x: width * 0.75, y: height * 0.2 },
      { x: width * 0.5, y: height * 0.1 }
    ];
    
    // Create particle manager and handle potential type issues
    try {
      // Create multiple emitters
      const colors = [0xffff00, 0x00ffff, 0xff00ff, 0xffffff, 0xff8800];
      
      emitterPositions.forEach((pos) => {
        // Handle potential type issues with proper parameter types
        const emitter = this.add.particles(pos.x, pos.y, 'star', {
          speed: { min: 100, max: 200 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.8, end: 0 },
          lifespan: 4000,
          blendMode: 'ADD',
          frequency: 50,
          tint: colors
        });
        
        this.emitters.push(emitter);
      });
      
      // Add a central firework-like emitter for special effects
      const burstEmitter = this.add.particles(width * 0.5, height * 0.5, 'star', {
        speed: { min: 100, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        lifespan: 3000,
        blendMode: 'ADD',
        frequency: 500,
        quantity: 20,
        tint: 0xffff00
      });
      
      this.emitters.push(burstEmitter);
    } catch (err) {
      console.error('Error creating particles:', err);
      // Fallback animation if particles fail
      this.createFallbackStars();
    }
  }
  
  /**
   * Fallback animation if particle system has issues
   * Creates simple star sprites that fall down instead of using the particle system
   */
  private createFallbackStars() {
    const { width, height } = this.scale;
    const colors = [0xffff00, 0x00ffff, 0xff00ff, 0xffffff, 0xff8800];
    
    // Create simple star sprites that fall down
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(-200, -50);
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      
      const star = this.add.image(x, y, 'star')
        .setTint(color)
        .setAlpha(Phaser.Math.FloatBetween(0.5, 1))
        .setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      
      this.tweens.add({
        targets: star,
        y: height + 50,
        x: x + Phaser.Math.Between(-100, 100),
        angle: 360,
        duration: Phaser.Math.Between(3000, 8000),
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Linear',
        onComplete: () => star.destroy()
      });
    }
  }
  
  update() {
    // Any continuous updates can be added here
  }
} 