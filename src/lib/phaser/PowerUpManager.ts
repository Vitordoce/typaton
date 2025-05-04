import * as Phaser from 'phaser';

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
  duration: number; // Duration in milliseconds (not used for BOMB and SHIELD)
  icon: string; // Icon key for display
  color: number; // Color for the power-up text/icon
  description: string; // Short description of what the power-up does
}

// Power-up configurations
export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  [PowerUpType.FREEZE]: {
    type: PowerUpType.FREEZE,
    duration: 3000, // 3 seconds
    icon: '❄️',
    color: 0x00ffff, // Cyan
    description: 'Freeze all words for 3 seconds'
  },
  [PowerUpType.SLOW]: {
    type: PowerUpType.SLOW,
    duration: 5000, // 5 seconds
    icon: '🐢',
    color: 0x00ff00, // Green
    description: 'Slow all words by 50% for 5 seconds'
  },
  [PowerUpType.BOMB]: {
    type: PowerUpType.BOMB,
    duration: 0, // Instant effect
    icon: '💣',
    color: 0xff0000, // Red
    description: 'Destroy all words on screen'
  },
  [PowerUpType.SHIELD]: {
    type: PowerUpType.SHIELD,
    duration: 0, // Until hit
    icon: '🛡️',
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

export class PowerUpManager {
  private scene: Phaser.Scene;
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
    this.scene = scene;
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
    
    const { width } = this.scene.scale;
    this.powerUpIndicators = this.scene.add.container(width - 150, 30);
    
    // Add a background for the power-up area
    const bg = this.scene.add.rectangle(0, 0, 130, 40, 0x000000, 0.5)
      .setOrigin(0, 0);
    this.powerUpIndicators.add(bg);
    
    // Add a title
    const title = this.scene.add.text(5, 5, 'POWER-UPS', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: '#ffffff'
    });
    this.powerUpIndicators.add(title);
    
    // Setup collected power-ups display in bottom left
    this.setupCollectedPowerUpsDisplay();
  }
  
  /**
   * Set up the display for collected power-ups in the bottom left corner
   */
  private setupCollectedPowerUpsDisplay(): void {
    if (!this.scene || !this.scene.scale) {
      return;
    }
    
    const { width, height } = this.scene.scale;
    
    // Create container for collected power-ups
    this.collectedPowerUpsContainer = this.scene.add.container(30, height - 80);
    
    // Add background
    const bg = this.scene.add.rectangle(0, 0, 200, 60, 0x000000, 0.5)
      .setOrigin(0, 0);
    this.collectedPowerUpsContainer.add(bg);
    
    // Add title
    const title = this.scene.add.text(10, 5, 'POWER-UPS', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: '#ffffff'
    });
    this.collectedPowerUpsContainer.add(title);
    
    // Add initial power-up counts (all zero)
    let yOffset = 25;
    Object.values(PowerUpType).forEach((type, index) => {
      const config = POWER_UP_CONFIGS[type];
      const xOffset = (index % 2) * 100;
      
      // Create power-up name and count text
      const nameText = this.scene.add.text(10 + xOffset, yOffset, type, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '10px',
        color: '#ffffff'
      }).setTint(config.color);
      
      const countText = this.scene.add.text(10 + xOffset, yOffset + 15, `x${this.collectedPowerUps[type]}`, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '10px',
        color: '#ffffff'
      });
      countText.name = `count-${type}`;
      
      this.collectedPowerUpsContainer.add([nameText, countText]);
      
      // Adjust y offset for next row if needed
      if (index % 2 === 1) {
        yOffset += 35;
      }
    });
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
    (textObject as any).powerUpType = powerUpType;
    
    // Mark as a power-up
    (textObject as any).isPowerUp = true;
    
    // Create rainbow color cycling effect
    const colors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3];
    let colorIndex = 0;
    
    // Create a timer for color cycling
    const colorTimer = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        textObject.setTint(colors[colorIndex]);
        colorIndex = (colorIndex + 1) % colors.length;
      },
      loop: true
    });
    
    // Store the timer on the text object so we can destroy it later
    (textObject as any).colorTimer = colorTimer;
    
    // Create a blinking effect
    const blinkTimer = this.scene.time.addEvent({
      delay: 200,
      callback: () => {
        textObject.visible = !textObject.visible;
      },
      loop: true
    });
    
    // Store the blink timer on the text object
    (textObject as any).blinkTimer = blinkTimer;
  }
  
  /**
   * Activate a power-up when a power-up word is typed correctly
   * @param powerUpType - The type of power-up to activate
   */
  activatePowerUp(powerUpType: PowerUpType): void {
    const config = POWER_UP_CONFIGS[powerUpType];
    const now = this.scene.time.now;
    
    // Check if we have this power-up available
    if (this.collectedPowerUps[powerUpType] <= 0 && powerUpType !== PowerUpType.SHIELD) {
      // Don't activate if we don't have any (except for shield which can be collected)
      return;
    }
    
    // Decrement the count if we're using a collected power-up
    if (powerUpType !== PowerUpType.SHIELD || !this.hasShield) {
      // Only decrement if it's not a shield or if shield isn't already active
      this.collectedPowerUps[powerUpType]--;
      this.updateCollectedPowerUpDisplay(powerUpType);
    }
    
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
        this.updatePowerUpIndicator(PowerUpType.FREEZE, config.duration);
        break;
        
      case PowerUpType.SLOW:
        this.activePowerUps.push({
          type: PowerUpType.SLOW,
          startTime: now,
          endTime: now + config.duration,
          isActive: true
        });
        this.showPowerUpEffect('SLOW!', config.color);
        this.updatePowerUpIndicator(PowerUpType.SLOW, config.duration);
        break;
        
      case PowerUpType.BOMB:
        // Bomb is handled by the game scene directly
        this.showPowerUpEffect('BOMB!', config.color);
        // Signal to the game scene to destroy all words
        (this.scene as any).triggerBombEffect();
        break;
        
      case PowerUpType.SHIELD:
        this.hasShield = true;
        this.showPowerUpEffect('SHIELD!', config.color);
        this.updatePowerUpIndicator(PowerUpType.SHIELD);
        break;
    }
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
    if (this.scene.particles) {
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
   * Update the power-up indicator UI
   * @param type - The type of power-up
   * @param duration - Duration of the power-up (optional)
   */
  private updatePowerUpIndicator(type: PowerUpType, duration?: number): void {
    if (!this.powerUpIndicators) return;
    
    const config = POWER_UP_CONFIGS[type];
    const existingIndicator = this.powerUpIndicators.getByName(`indicator-${type}`);
    
    if (existingIndicator) {
      // Update existing indicator
      if (duration) {
        // Update timer text
        const timerText = existingIndicator.getByName('timer') as Phaser.GameObjects.Text;
        if (timerText) {
          timerText.setText(`${Math.ceil(duration / 1000)}s`);
        }
      }
    } else {
      // Create new indicator
      const container = this.scene.add.container(5, 20);
      container.name = `indicator-${type}`;
      
      // Add icon
      const icon = this.scene.add.text(0, 0, config.icon, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '16px'
      });
      container.add(icon);
      
      // Add timer text if applicable
      if (duration) {
        const timerText = this.scene.add.text(25, 2, `${Math.ceil(duration / 1000)}s`, {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '10px',
          color: '#ffffff'
        });
        timerText.name = 'timer';
        container.add(timerText);
      }
      
      this.powerUpIndicators.add(container);
    }
  }
  
  /**
   * Remove a power-up indicator from the UI
   * @param type - The type of power-up to remove
   */
  private removePowerUpIndicator(type: PowerUpType): void {
    if (!this.powerUpIndicators) return;
    
    const indicator = this.powerUpIndicators.getByName(`indicator-${type}`);
    if (indicator) {
      indicator.destroy();
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
      
      // Add a nice animation effect when count increases
      this.scene.tweens.add({
        targets: countText,
        scale: { from: 1.5, to: 1 },
        duration: 300,
        ease: 'Bounce.Out'
      });
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
    this.removePowerUpIndicator(PowerUpType.SHIELD);
    
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
   * @param time - Current game time
   */
  update(time: number): void {
    // Update active power-ups
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const powerUp = this.activePowerUps[i];
      
      // Check if power-up has expired
      if (time >= powerUp.endTime) {
        powerUp.isActive = false;
        this.removePowerUpIndicator(powerUp.type);
        this.activePowerUps.splice(i, 1);
      } else if (powerUp.isActive) {
        // Update timer display
        const remaining = Math.ceil((powerUp.endTime - time) / 1000);
        this.updatePowerUpIndicator(powerUp.type, (powerUp.endTime - time));
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
   * Get the collected power-ups count
   * @returns Record of power-up counts by type
   */
  getCollectedPowerUps(): Record<PowerUpType, number> {
    return { ...this.collectedPowerUps };
  }
  
  /**
   * Preserve power-ups when moving to the next level
   * This should be called when transitioning between levels
   */
  preservePowerUps(): void {
    // We don't need to do anything special here since the counts are already preserved
    // But we'll keep this method for clarity and potential future enhancements
  }
}
