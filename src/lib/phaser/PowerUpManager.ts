import * as Phaser from 'phaser';
import { BaseManager } from './BaseManager';

// Define the types of power-ups available in the game
export enum PowerUpType {
  FREEZE = 'freeze',
  SLOW = 'slow',
  BOMB = 'bomb',
  SHIELD = 'shield'
}

// Interface for power-up configuration
export interface PowerUpConfig {
  type: PowerUpType;
  duration: number; 
  color: number; 
  description: string;
}

// Power-up configurations
export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  [PowerUpType.FREEZE]: {
    type: PowerUpType.FREEZE,
    duration: 3000,
    color: 0x00ffff, // Cyan
    description: 'Freeze all words for 3 seconds'
  },
  [PowerUpType.SLOW]: {
    type: PowerUpType.SLOW,
    duration: 5000, // 5 seconds
    color: 0x00ff00, // Green
    description: 'Slow all words by 50% for 5 seconds'
  },
  [PowerUpType.BOMB]: {
    type: PowerUpType.BOMB,
    duration: 0, // Instant effect
    color: 0xff0000, // Red
    description: 'Destroy all words on screen'
  },
  [PowerUpType.SHIELD]: {
    type: PowerUpType.SHIELD,
    duration: 0, // Until hit
    color: 0xffff00, // Yellow
    description: 'Protect from one hit'
  }
};

// Active power-up state interface
export interface ActivePowerUp {
  type: PowerUpType;
  startTime: number;
  endTime: number;
  isActive: boolean;
}

export class PowerUpManager extends BaseManager {
  private activePowerUps: ActivePowerUp[] = [];
  private hasShield: boolean = false;
  private powerUpChance: number = 0.05; // 5% chance for a word to be a power-up
  private powerUpIndicators: Phaser.GameObjects.Container | null = null;
  private collectedPowerUps: Record<PowerUpType, number> = {
    [PowerUpType.FREEZE]: 0,
    [PowerUpType.SLOW]: 0,
    [PowerUpType.BOMB]: 0,
    [PowerUpType.SHIELD]: 0
  };
  private collectedPowerUpsContainer: Phaser.GameObjects.Container | null = null;
  
  constructor(scene: Phaser.Scene) {
    super(scene);
    // We'll call setupPowerUpIndicators in the scene's create method instead
  }
  
  /**
   * Set up the UI container for showing active power-ups
   * This should be called from the scene's create method, not from the constructor
   */
  setupPowerUpIndicators(): void {
    if (!this.scene || !this.scene.scale) {
      console.error('Scene or scene.scale is not available');
      return;
    }
    
    // We're removing the top-right power-up indicators
    // Just set up the collected power-ups display in bottom left
    this.setupCollectedPowerUpsDisplay();
  }
  
  /**
   * Set up the display for collected power-ups in the bottom left corner
   */
  private setupCollectedPowerUpsDisplay(): void {
    if (!this.scene || !this.scene.scale) {
      return;
    }
    
    const { height } = this.scene.scale;
    
    // Create container for collected power-ups - position in bottom left
    this.collectedPowerUpsContainer = this.scene.add.container(20, height - 100);
    
    // Add background with higher alpha for better visibility
    const bg = this.scene.add.rectangle(0, 0, 240, 90, 0x000000, 0.8)
      .setOrigin(0, 0);
    this.collectedPowerUpsContainer.add(bg);
    
    // Add power-up counts with names only (no icons or title)
    let yOffset = 10;
    Object.values(PowerUpType).forEach((type) => {
      const config = POWER_UP_CONFIGS[type];
      
      // Create power-up name
      const nameText = this.scene.add.text(20, yOffset, type, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '14px',
        color: '#ffffff'
      }).setTint(config.color);
      
      // Create count with x prefix
      const countText = this.scene.add.text(180, yOffset, `x${this.collectedPowerUps[type]}`, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '16px',
        color: '#ffffff'
      });
      countText.name = `count-${type}`;
      
      if (this.collectedPowerUpsContainer) {
        this.collectedPowerUpsContainer.add([nameText, countText]);
      }
      
      // Move to next row
      yOffset += 22;
    });
    
    // Ensure the container is at the front
    if (this.scene.children) {
      this.scene.children.bringToTop(this.collectedPowerUpsContainer);
    }
  }
  
  /**
   * Check if a word should be a power-up
   * @returns boolean - True if the word should be a power-up
   */
  shouldBePowerUp(): boolean {
    return Math.random() < this.powerUpChance;
  }
  
  /**
   * Get a random power-up type
   * @returns PowerUpType - A randomly selected power-up type
   */
  getRandomPowerUpType(): PowerUpType {
    const types = Object.values(PowerUpType);
    const randomIndex = Math.floor(Math.random() * types.length);
    return types[randomIndex];
  }
  
  /**
   * Apply rainbow blinking effect to a text object to indicate it's a power-up
   * @param textObject - The Phaser Text object to apply the effect to
   * @param powerUpType - The type of power-up
   */
  applyPowerUpEffect(textObject: Phaser.GameObjects.Text, powerUpType: PowerUpType): void {
    // Store the power-up type on the text object for reference
    (textObject as Phaser.GameObjects.Text & { powerUpType: PowerUpType }).powerUpType = powerUpType;
    
    // Mark as a power-up
    (textObject as Phaser.GameObjects.Text & { isPowerUp: boolean }).isPowerUp = true;
    
    // Create rainbow color cycling effect
    const colors = [ 0xff7f00, 0x9400d3, 0xffff00,0xff0000, 0x00ff00, 0x0000ff];
    let colorIndex = 0;
    
    // Create a timer for color cycling
    const colorTimer = this.scene.time.addEvent({
      delay: 400,
      callback: () => {
        textObject.setTint(colors[colorIndex]);
        colorIndex = (colorIndex + 1) % colors.length;
      },
      loop: true
    });
    
    // Store the timer on the text object so we can destroy it later
    (textObject as Phaser.GameObjects.Text & { colorTimer: Phaser.Time.TimerEvent }).colorTimer = colorTimer;
  }
  
  /**
   * Collect a power-up when a power-up word is typed correctly
   * @param powerUpType - The type of power-up to collect
   */
  collectPowerUp(powerUpType: PowerUpType): void {
    // Increment the count for this power-up type
    this.collectedPowerUps[powerUpType]++;
    
    // Update the display
    this.updateCollectedPowerUpDisplay(powerUpType);
    
    // Show collection effect
    this.showPowerUpCollectedEffect(powerUpType);
  }
  
  /**
   * Show a visual effect when a power-up is collected
   * @param powerUpType - The type of power-up collected
   */
  private showPowerUpCollectedEffect(powerUpType: PowerUpType): void {
    const config = POWER_UP_CONFIGS[powerUpType];
    const { width, height } = this.scene.scale;
    
    // Create a text object in the center of the screen
    const effectText = this.scene.add.text(width / 2, height / 2, `${powerUpType.toUpperCase()} COLLECTED!`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setTint(config.color);
    
    // Create a fade in/out animation
    this.scene.tweens.add({
      targets: effectText,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1.2 },
      y: { from: height / 2, to: height / 2 - 50 },
      duration: 500,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        effectText.destroy();
      }
    });
  }
  
  /**
   * Activate a power-up from the collected inventory
   * @param powerUpType - The type of power-up to activate
   * @returns boolean - True if activation was successful
   */
  activatePowerUp(powerUpType: PowerUpType): boolean {
    const config = POWER_UP_CONFIGS[powerUpType];
    const now = this.scene.time.now;
    
    // Check if we have this power-up available
    if (this.collectedPowerUps[powerUpType] <= 0) {
      // Don't activate if we don't have any
      return false;
    }
    
    // Decrement the count
    this.collectedPowerUps[powerUpType]--;
    this.updateCollectedPowerUpDisplay(powerUpType);
    
    // Handle different power-up types
    switch (powerUpType) {
      case PowerUpType.FREEZE:
        this.activePowerUps.push({
          type: PowerUpType.FREEZE,
          startTime: now,
          endTime: now + config.duration,
          isActive: true
        });
        this.showPowerUpEffect('FREEZE!', config.color);
        break;
        
      case PowerUpType.SLOW:
        this.activePowerUps.push({
          type: PowerUpType.SLOW,
          startTime: now,
          endTime: now + config.duration,
          isActive: true
        });
        this.showPowerUpEffect('SLOW!', config.color);
        break;
        
      case PowerUpType.BOMB:
        // Bomb is handled by the game scene directly
        this.showPowerUpEffect('BOMB!', config.color);
        // Signal to the game scene to destroy all words
        if ('triggerBombEffect' in this.scene) {
          (this.scene as { triggerBombEffect: () => void }).triggerBombEffect();
        }
        break;
        
      case PowerUpType.SHIELD:
        this.hasShield = true;
        this.showPowerUpEffect('SHIELD!', config.color);
        break;
    }
    
    return true;
  }
  
  /**
   * Show a visual effect when a power-up is activated
   * @param text - Text to display
   * @param color - Color of the text
   */
  private showPowerUpEffect(text: string, color: number): void {
    const { width, height } = this.scene.scale;
    
    // Create a text object in the center of the screen
    const effectText = this.scene.add.text(width / 2, height / 2, text, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setTint(color);
    
    // Create a fade in/out animation with more dramatic effects
    this.scene.tweens.add({
      targets: effectText,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1.5 },
      angle: { from: -5, to: 5 },
      duration: 500,
      yoyo: true,
      hold: 300,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        effectText.destroy();
      }
    });
    
    // Add particle effect around the text
    if ('particles' in this.scene && this.scene.textures.exists('particle')) {
      const particles = this.scene.add.particles(0, 0, 'particle', {
        x: width / 2,
        y: height / 2,
        speed: { min: 100, max: 200 },
        scale: { start: 0.5, end: 0 },
        lifespan: 800,
        blendMode: 'ADD',
        tint: color,
        quantity: 20,
        emitting: false
      });
      
      // Emit particles once
      particles.explode(30, width / 2, height / 2);
      
      // Clean up particles after animation
      this.scene.time.delayedCall(1000, () => {
        particles.destroy();
      });
    }
  }
  
  /**
   * Check if the shield is active
   * @returns boolean - True if shield is active
   */
  hasActiveShield(): boolean {
    return this.hasShield;
  }
  
  /**
   * Update the display of a collected power-up
   * @param type - The type of power-up to update
   */
  private updateCollectedPowerUpDisplay(type: PowerUpType): void {
    if (!this.collectedPowerUpsContainer) return;
    
    const countText = this.collectedPowerUpsContainer.getByName(`count-${type}`) as Phaser.GameObjects.Text;
    if (countText) {
      countText.setText(`x${this.collectedPowerUps[type]}`);
      
      // Add a nice animation effect when count changes
      this.scene.tweens.add({
        targets: countText,
        scale: { from: 1.5, to: 1 },
        duration: 300,
        ease: 'Bounce.Out'
      });
      
      // Ensure the container is at the front
      if (this.scene.children) {
        this.scene.children.bringToTop(this.collectedPowerUpsContainer);
      }
    }
  }
  
  /**
   * Update a specific power-up count (called from GameScene)
   * @param type - The type of power-up to update
   * @param count - The new count value
   */
  updateCollectedPowerUpCount(type: PowerUpType, count: number): void {
    this.collectedPowerUps[type] = count;
    this.updateCollectedPowerUpDisplay(type);
  }
  
  /**
   * Use the shield to block a hit
   */
  useShield(): void {
    this.hasShield = false;
    
    // Decrement the shield count if we have any
    if (this.collectedPowerUps[PowerUpType.SHIELD] > 0) {
      this.collectedPowerUps[PowerUpType.SHIELD]--;
      this.updateCollectedPowerUpDisplay(PowerUpType.SHIELD);
    }
  }
  
  /**
   * Check if the freeze power-up is active
   * @returns boolean - True if freeze is active
   */
  isFreezeActive(): boolean {
    return this.activePowerUps.some(p => p.type === PowerUpType.FREEZE && p.isActive);
  }
  
  /**
   * Get the current slow factor (0.5 if slow is active, 1.0 otherwise)
   * @returns number - The slow factor to apply to word velocities
   */
  getSlowFactor(): number {
    return this.activePowerUps.some(p => p.type === PowerUpType.SLOW && p.isActive) ? 0.5 : 1.0;
  }
  
  /**
   * Update power-up timers and states
   * @param time - Current time
   */
  update(time: number): void {
    // Update active power-ups
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const powerUp = this.activePowerUps[i];
      
      // Check if power-up has expired
      if (time >= powerUp.endTime) {
        powerUp.isActive = false;
        this.activePowerUps.splice(i, 1);
      }
    }
  }
  
  /**
   * Clean up resources when the manager is destroyed
   */
  destroy(): void {
    if (this.powerUpIndicators) {
      this.powerUpIndicators.destroy();
    }
    if (this.collectedPowerUpsContainer) {
      this.collectedPowerUpsContainer.destroy();
    }
    this.activePowerUps = [];
  }
  
  /**
   * Get the count of a specific power-up
   * @param type - The type of power-up to check
   * @returns number - The count of the power-up
   */
  getCollectedCount(type: PowerUpType): number {
    return this.collectedPowerUps[type];
  }
  
  /**
   * Check if a text matches a power-up name
   * @param text - The text to check
   * @returns PowerUpType | null - The matching power-up type or null if no match
   */
  getPowerUpTypeFromText(text: string): PowerUpType | null {
    const lowerText = text.toLowerCase();
    for (const type of Object.values(PowerUpType)) {
      if (lowerText === type.toLowerCase()) {
        return type;
      }
    }
    return null;
  }
  
  /**
   * Bring the power-up displays to the front
   */
  bringToFront(): void {
    // Bring collected power-ups display to front
    if (this.collectedPowerUpsContainer && this.scene.children) {
      this.scene.children.bringToTop(this.collectedPowerUpsContainer);
    }
  }
}
