import * as Phaser from 'phaser';
import { WordType, WordEffect, WordData, WordConfig } from './WordData';
import { GameEvents } from './GameEvents';

/**
 * Word class representing a word in the game
 * Handles rendering, effects, and movement
 */
export class Word extends Phaser.GameObjects.Container {
  public text: string;
  public type: WordType;
  public effects: WordEffect[] = [];
  public velocity: { x: number, y: number } = { x: 0, y: 0 };
  public spawnTime: number;
  public destroyTime?: number;
  public completed: boolean = false;
  
  private textObject: Phaser.GameObjects.Text;
  private blinkTimer: number = 0;
  private shakeOffset: { x: number, y: number } = { x: 0, y: 0 };
  private flipAngle: number = 0;
  private basePosition: { x: number, y: number };
  private colorTimer: Phaser.Time.TimerEvent | null = null;
  
  constructor(scene: Phaser.Scene, config: WordConfig) {
    super(scene, config.x, config.y);
    
    this.text = config.text;
    this.type = config.type || WordType.NORMAL;
    this.effects = config.effects || [];
    this.spawnTime = scene.time.now;
    this.basePosition = { x: config.x, y: config.y };
    
    // Create text display
    this.textObject = scene.add.text(0, 0, this.text, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '24px',
      color: 'white',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    this.add(this.textObject);
    
    // Apply special effects for power-ups
    if (this.type === WordType.POWERUP) {
      this.applyRainbowEffect();
    }
    
    // Apply initial effects
    this.applyEffects();
    
    // Add to scene
    scene.add.existing(this);
    
    // Emit spawn event with word data
    this.scene.events.emit(GameEvents.WORD_SPAWNED, this.getWordData());
  } 
  
  /**
   * Apply rainbow color cycling effect for power-ups
   */
  private applyRainbowEffect(): void {
    // Rainbow colors
    const colors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3];
    let colorIndex = 0;
    
    // Create a timer for color cycling
    this.colorTimer = this.scene.time.addEvent({
      delay: 50, // Fast color changes for vibrant effect
      callback: () => {
        this.textObject.setTint(colors[colorIndex]);
        colorIndex = (colorIndex + 1) % colors.length;
      },
      loop: true
    });
    
    // Add a scale pulsing effect
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.1 },
      duration: 200,
      yoyo: true,
      repeat: -1
    });
  }
  
  /**
   * Set the velocity of the word
   * @param x - X velocity component
   * @param y - Y velocity component
   */
  setVelocity(x: number, y: number): void {
    this.velocity = { x, y };
    
    // Emit event with word data when velocity is set
    this.scene.events.emit(GameEvents.WORD_VELOCITY_SET, this.getWordData());
  }
  
  /**
   * Get complete word data
   * @returns WordData object with all word information
   */
  getWordData(): WordData {
    return {
      text: this.text,
      type: this.type,
      effects: [...this.effects],
      velocity: new Phaser.Math.Vector2(this.velocity.x, this.velocity.y),
      spawnTime: this.spawnTime,
      destroyTime: this.destroyTime,
      completed: this.completed,
      position: new Phaser.Math.Vector2(this.x, this.y)
    };
  }
  
  /**
   * Add an effect to the word
   * @param effect - The effect to add
   */
  addEffect(effect: WordEffect): void {
    this.effects.push(effect);
    this.applyEffects();
  }
  
  /**
   * Apply all effects to the word
   */
  private applyEffects(): void {
    for (const effect of this.effects) {
      switch (effect.type) {
        case 'blinking':
          // Blinking is handled in update
          break;
        case 'shaking':
          // Shaking is handled in update
          break;
        case 'flipped':
          this.flipAngle = Math.PI; // 180 degrees
          this.textObject.rotation = this.flipAngle;
          this.textObject.setTint(0xffe600);
          break;
        case 'fading':
          this.textObject.setAlpha(0.5);
          break;
        case 'rotating':
          // Rotation is handled in update
          break;
      }
    }
  }
  
  /**
   * Update the word's position and effects
   * @param time - Current time
   * @param delta - Time since last frame in ms
   */
  update(time: number, delta: number): void {
    // Update position based on velocity
    this.basePosition.x += this.velocity.x * (delta / 1000);
    this.basePosition.y += this.velocity.y * (delta / 1000);
    
    // Update effects
    this.updateEffects(time, delta);
    
    // Update actual position
    this.x = this.basePosition.x + this.shakeOffset.x;
    this.y = this.basePosition.y + this.shakeOffset.y;
  }
  
  /**
   * Update all active effects
   * @param time - Current time
   * @param delta - Time since last frame in ms
   */
  private updateEffects(time: number, delta: number): void {
    // Reset shake offset
    this.shakeOffset = { x: 0, y: 0 };
    
    // Apply effects
    for (const effect of this.effects) {
      switch (effect.type) {
        case 'blinking':
          this.updateBlinkingEffect(delta);
          break;
        case 'shaking':
          this.updateShakingEffect();
          break;
        case 'rotating':
          this.updateRotatingEffect(delta, effect.intensity || 1);
          break;
      }
    }
  }
  
  /**
   * Update blinking effect
   * @param delta - Time since last frame in ms
   */
  private updateBlinkingEffect(delta: number): void {
    this.blinkTimer += delta;
    if (this.blinkTimer > 250) { // toggle every 250ms
      this.textObject.visible = !this.textObject.visible;
      this.blinkTimer = 0;
    }
  }
  
  /**
   * Update shaking effect
   */
  private updateShakingEffect(): void {
    const shakeX = Phaser.Math.Between(-8, 8);
    const shakeY = Phaser.Math.Between(-6, 6);
    const shakeRot = Phaser.Math.FloatBetween(-0.05, 0.05);
    
    this.shakeOffset = { x: shakeX, y: shakeY };
    this.textObject.rotation = (this.flipAngle) + shakeRot;
  }
  
  /**
   * Update rotating effect
   * @param delta - Time since last frame in ms
   * @param intensity - Rotation intensity
   */
  private updateRotatingEffect(delta: number, intensity: number): void {
    this.textObject.rotation += (delta / 1000) * intensity;
  }
  
  /**
   * Mark the word as completed (typed correctly)
   * @param score - Optional score to display
   */
  complete(score?: number): void {
    this.completed = true;
    this.destroyTime = this.scene.time.now;
    
    // Emit event with complete word data
    this.scene.events.emit(GameEvents.WORD_COMPLETED, this.getWordData());
    
    // Show score if provided
    if (score !== undefined) {
      this.showScoreAnimation(score);
    }
    
    // Visual feedback for completion
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => this.destroy()
    });
  }
  
  /**
   * Show score animation
   * @param score - Score to display
   */
  private showScoreAnimation(score: number): void {
    // Create score text
    const scoreText = this.scene.add.text(0, -30, `+${score}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '20px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(50);
    
    // Add to container
    this.add(scoreText);
    
    // Animate the score text
    this.scene.tweens.add({
      targets: scoreText,
      y: -80,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 1.5 },
      duration: 1000,
      ease: 'Power2'
    });
  }
  
  /**
   * Destroy the word
   */
  destroy(fromScene?: boolean): void {
    this.destroyTime = this.scene.time.now;
    
    // Clean up timers
    if (this.colorTimer) {
      this.colorTimer.remove();
    }
    
    // Emit event with complete word data
    this.scene.events.emit(GameEvents.WORD_DESTROYED, this.getWordData());
    
    super.destroy(fromScene);
  }
}
