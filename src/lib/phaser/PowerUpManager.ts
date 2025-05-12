import * as Phaser from 'phaser';
import { BaseManager } from './BaseManager';
import { PowerUpType, PowerUpConfig } from './types/PowerUpTypes';

// Power-up configurations
export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  [PowerUpType.FREEZE]: {
    type: PowerUpType.FREEZE,
    duration: 3000, // 3 seconds
    color: 0x00ffff, // Cyan
    description: 'Freeze all words for 3 seconds'
  },
  [PowerUpType.BOMB]: {
    type: PowerUpType.BOMB,
    duration: 0, // Instant effect
    color: 0xff0000, // Red
    description: 'Destroy all words on screen'
  },
  [PowerUpType.SHIELD]: {
    type: PowerUpType.SHIELD,
    duration: 2000, // 2 seconds of invincibility
    color: 0x00ff00, // Green
    description: 'Invincible for 2 seconds'
  }
};

export class PowerUpManager extends BaseManager {
  private activePowerUps: Map<PowerUpType, boolean> = new Map();
  private collectedPowerUps: Map<PowerUpType, number> = new Map();
  private powerUpIndicators: Map<PowerUpType, Phaser.GameObjects.Text> = new Map();
  private freezeTimer: number = 0;
  private shieldTimer: number = 0;
  private hasShield: boolean = false;
  private shieldEndTime: number = 0;
  private powerUpChance: number = 0.1;
  private collectedPowerUpsContainer: Phaser.GameObjects.Container | null = null;
  private shieldGraphics: Phaser.GameObjects.Graphics | null = null;
  private shieldAnimation: Phaser.Tweens.Tween | null = null;
  private shieldTimerText: Phaser.GameObjects.Text | null = null;
  
  constructor(scene: Phaser.Scene) {
    super(scene);
    this.initializePowerUps();
  }
  
  private initializePowerUps(): void {
    Object.values(PowerUpType).forEach(type => {
      this.activePowerUps.set(type, false);
      this.collectedPowerUps.set(type, 0);
    });
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
      const countText = this.scene.add.text(180, yOffset, `x${this.collectedPowerUps.get(type) || 0}`, {
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
    if (this.scene.children && this.collectedPowerUpsContainer) {
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
    (textObject as Phaser.GameObjects.Text & { colorTimer: Phaser.Time.TimerEvent }).colorTimer = colorTimer;
    
    // Create a blinking effect
    const blinkTimer = this.scene.time.addEvent({
      delay: 200,
      callback: () => {
        textObject.visible = !textObject.visible;
      },
      loop: true
    });
    
    // Store the blink timer on the text object
    (textObject as Phaser.GameObjects.Text & { blinkTimer: Phaser.Time.TimerEvent }).blinkTimer = blinkTimer;
  }
  
  /**
   * Collect a power-up when a power-up word is typed correctly
   * @param powerUpType - The type of power-up to collect
   */
  collectPowerUp(powerUpType: PowerUpType): void {
    const currentCount = this.collectedPowerUps.get(powerUpType) || 0;
    this.collectedPowerUps.set(powerUpType, currentCount + 1);
    this.updateCollectedPowerUpDisplay(powerUpType);
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
    if ((this.collectedPowerUps.get(powerUpType) || 0) <= 0) {
      // Don't activate if we don't have any
      return false;
    }
    
    // Decrement the count
    this.collectedPowerUps.set(powerUpType, (this.collectedPowerUps.get(powerUpType) || 0) - 1);
    this.updateCollectedPowerUpDisplay(powerUpType);
    
    // Handle different power-up types
    switch (powerUpType) {
      case PowerUpType.FREEZE:
        this.activePowerUps.set(PowerUpType.FREEZE, true);
        this.showPowerUpEffect('FREEZE!', config.color);
        this.updatePowerUpIndicator(PowerUpType.FREEZE, config.duration);
        this.freezeTimer = now + config.duration;
        break;
        
      case PowerUpType.BOMB:
        // Bomb is handled by the game scene directly
        this.showPowerUpEffect('BOMB!', config.color);
        // Signal to the game scene to destroy all words
        (this.scene as Phaser.Scene & { triggerBombEffect: () => void }).triggerBombEffect();
        break;
        
      case PowerUpType.SHIELD:
        this.hasShield = true;
        this.shieldEndTime = now + config.duration; // Set shield end time
        this.showPowerUpEffect('SHIELD!', config.color);
        this.updatePowerUpIndicator(PowerUpType.SHIELD, config.duration);
        this.createShieldAnimation();
        this.shieldTimer = config.duration;
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
    if (this.scene.add && this.scene.add.particles) {
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
   * @param powerUpType - The type of power-up
   * @param remainingTime - Duration of the power-up (optional)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private updatePowerUpIndicator(powerUpType: PowerUpType, remainingTime?: number): void {
    // We're not using the top-right indicators anymore
  }
  
  /**
   * Remove a power-up indicator from the UI
   * @param powerUpType - The type of power-up to remove
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private removePowerUpIndicator(powerUpType: PowerUpType): void {
    // We're not using the top-right indicators anymore
  }
  
  /**
   * Check if the shield is active
   * @returns boolean - True if shield is active
   */
  hasActiveShield(): boolean {
    return this.hasShield;
  }
  
  /**
   * Use the shield to block a hit - agora o escudo só bloqueia um hit e então desaparece
   */
  useShield(): void {
    // Mostrar animação de impacto do escudo
    this.showShieldHitAnimation();
    
    // Remover o escudo após bloquear um hit
    this.hasShield = false;
    
    // Mostrar efeito de quebra do escudo
    this.showShieldBreakAnimation();
  }
  
  /**
   * Reset power-ups when advancing to the next level
   * Limpa o shield se estiver ativo
   */
  resetLevelPowerUps(): void {
    // Se o escudo estiver ativo, desativá-lo ao mudar de nível
    if (this.hasShield) {
      this.hasShield = false;
      
      // Remover animação e gráficos do escudo
      if (this.shieldAnimation) {
        this.shieldAnimation.stop();
        this.shieldAnimation = null;
      }
      
      if (this.shieldGraphics) {
        this.shieldGraphics.destroy();
        this.shieldGraphics = null;
      }
      
      if (this.shieldTimerText) {
        this.shieldTimerText.destroy();
        this.shieldTimerText = null;
      }
    }
    
    // Resetar temporizadores e estados mas manter os power-ups coletados
    this.activePowerUps.set(PowerUpType.FREEZE, false);
    this.activePowerUps.set(PowerUpType.SHIELD, false);
    this.freezeTimer = 0;
  }
  
  /**
   * Show an animation when the shield is hit but not destroyed
   */
  private showShieldHitAnimation(): void {
    if (!this.shieldGraphics) return;
    
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height - 40; // Same position as in GameScene
    
    // Create a flash effect
    const flash = this.scene.add.circle(centerX, centerY, 60, 0x00ff00, 0.7);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.3,
      duration: 200,
      onComplete: () => {
        flash.destroy();
      }
    });
    
    // Add a brief pulse to the shield
    if (this.shieldGraphics) {
      this.scene.tweens.add({
        targets: this.shieldGraphics,
        scale: { from: 1.2, to: 1 },
        alpha: { from: 1, to: 0.8 },
        duration: 300,
        ease: 'Bounce.Out'
      });
    }
    
    // Show "IMPACTO BLOQUEADO" text
    const hitText = this.scene.add.text(centerX, centerY - 80, 'IMPACTO BLOQUEADO', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '14px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);
    
    // Animate the hit text
    this.scene.tweens.add({
      targets: hitText,
      alpha: { from: 0, to: 1 },
      y: { from: centerY - 60, to: centerY - 90 },
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.scene.tweens.add({
          targets: hitText,
          alpha: 0,
          delay: 300,
          duration: 300,
          onComplete: () => {
            hitText.destroy();
          }
        });
      }
    });
  }
  
  /**
   * Show an animation when the shield breaks (when it expires or is hit)
   */
  private showShieldBreakAnimation(): void {
    // Exit early if no shield graphics exist
    if (!this.shieldGraphics) return;
    
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height - 40; // Same position as in GameScene
    
    // Stop any existing animation
    if (this.shieldAnimation) {
      this.shieldAnimation.stop();
      this.shieldAnimation = null;
    }
    
    // Safely get the shield info text before tweening
    let shieldInfoText: Phaser.GameObjects.Text | undefined;
    try {
      // Cast with safe type checking
      const shieldGraphicsWithInfo = this.shieldGraphics as Phaser.GameObjects.Graphics & { 
        shieldInfoText?: Phaser.GameObjects.Text 
      };
      shieldInfoText = shieldGraphicsWithInfo.shieldInfoText;
      
      // Fade out the info text separately if it exists
      if (shieldInfoText && shieldInfoText.active) {
        this.scene.tweens.add({
          targets: shieldInfoText,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            if (shieldInfoText && shieldInfoText.active) {
              shieldInfoText.destroy();
            }
          }
        });
      }
    } catch (e) {
      console.warn("Error accessing shield info text:", e);
    }
    
    // Clean up any attached particles immediately to avoid errors
    try {
      if (this.shieldGraphics && 'particles' in this.shieldGraphics) {
        const graphicsWithParticles = this.shieldGraphics as Phaser.GameObjects.Graphics & { 
          particles?: Phaser.GameObjects.Particles.ParticleEmitter 
        };
        if (graphicsWithParticles.particles) {
          graphicsWithParticles.particles.destroy();
          delete graphicsWithParticles.particles;
        }
      }
    } catch (e) {
      console.warn("Error cleaning up shield particles:", e);
    }
    
    // Create a simple fade-out effect for the shield
    this.scene.tweens.add({
      targets: this.shieldGraphics,
      alpha: 0,
      scale: 1.2,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // Clean up the shield graphics
        if (this.shieldGraphics && this.shieldGraphics.active) {
          this.shieldGraphics.destroy();
          this.shieldGraphics = null;
        }
      }
    });
    
    // Show "PROTEÇÃO REMOVIDA" text
    const brokenText = this.scene.add.text(centerX, centerY - 80, 'PROTEÇÃO REMOVIDA', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '18px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);
    
    // Animate the broken text
    this.scene.tweens.add({
      targets: brokenText,
      alpha: { from: 0, to: 1 },
      y: { from: centerY - 60, to: centerY - 100 },
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.scene.tweens.add({
          targets: brokenText,
          alpha: 0,
          delay: 600,
          duration: 500,
          onComplete: () => {
            if (brokenText && brokenText.active) {
              brokenText.destroy();
            }
          }
        });
      }
    });
    
    // Clean up timer text
    if (this.shieldTimerText) {
      this.shieldTimerText.destroy();
      this.shieldTimerText = null;
    }
  }
  
  /**
   * Check if the freeze power-up is active
   * @returns boolean - True if freeze is active
   */
  isFreezeActive(): boolean {
    return this.activePowerUps.get(PowerUpType.FREEZE) || false;
  }
  
  /**
   * Update power-up timers and states
   * @param time - Current time
   */
  update(time: number): void {
    try {
      // Update active power-ups
      for (const [type, isActive] of this.activePowerUps.entries()) {
        if (!isActive) continue;
        
        // Check if power-up has expired
        if (type === PowerUpType.FREEZE && time >= this.freezeTimer) {
          this.activePowerUps.set(PowerUpType.FREEZE, false);
        } else if (type === PowerUpType.SHIELD && time >= this.shieldEndTime) {
          this.hasShield = false;
          this.activePowerUps.set(PowerUpType.SHIELD, false);
          this.showShieldBreakAnimation();
        }
        
        // Update timer display
        if (type === PowerUpType.FREEZE && this.freezeTimer > time) {
          this.updatePowerUpIndicator(PowerUpType.FREEZE, (this.freezeTimer - time));
        } else if (type === PowerUpType.SHIELD && this.shieldEndTime > time) {
          this.updatePowerUpIndicator(PowerUpType.SHIELD, (this.shieldEndTime - time));
          
          // Update shield timer text if it exists
          if (this.shieldTimerText && this.shieldTimerText.active) {
            const remainingSeconds = ((this.shieldEndTime - time) / 1000).toFixed(1);
            this.shieldTimerText.setText(remainingSeconds);
            
            // Make the text pulse as time runs out
            if ((this.shieldEndTime - time) < 500) {
              this.shieldTimerText.setAlpha(Math.sin(time * 0.02) * 0.5 + 0.5);
            }
          }
        }
      }
      
      // Update shield graphics if needed
      if (this.hasShield && !this.shieldGraphics) {
        this.createShieldAnimation();
      } else if (!this.hasShield && this.shieldGraphics) {
        this.cleanupShieldResources();
      }
      
      // Ensure shield has no rotation
      if (this.shieldGraphics && this.shieldGraphics.active) {
        // Reset rotation to keep shield fixed
        this.shieldGraphics.rotation = 0;
      }
    } catch (e) {
      console.warn("Error in PowerUpManager update:", e);
    }
  }
  
  /**
   * Helper method to clean up shield resources
   */
  private cleanupShieldResources(): void {
    try {
      // Stop animation if exists
      if (this.shieldAnimation) {
        this.shieldAnimation.stop();
        this.shieldAnimation = null;
      }
      
      // Clean up particles
      if (this.shieldGraphics && this.shieldGraphics.active) {
        try {
          const graphicsWithInfo = this.shieldGraphics as Phaser.GameObjects.Graphics & { 
            particles?: Phaser.GameObjects.Particles.ParticleEmitter;
            shieldInfoText?: Phaser.GameObjects.Text;
          };
          
          // Destroy particles
          if (graphicsWithInfo.particles && graphicsWithInfo.particles.active) {
            graphicsWithInfo.particles.destroy();
          }
          
          // Destroy info text
          if (graphicsWithInfo.shieldInfoText && graphicsWithInfo.shieldInfoText.active) {
            graphicsWithInfo.shieldInfoText.destroy();
          }
        } catch (err) {
          console.warn("Error cleaning shield attachments:", err);
        }
        
        // Destroy graphics
        this.shieldGraphics.destroy();
        this.shieldGraphics = null;
      }
      
      // Clean up timer text
      if (this.shieldTimerText && this.shieldTimerText.active) {
        this.shieldTimerText.destroy();
        this.shieldTimerText = null;
      }
    } catch (e) {
      console.warn("Error cleaning up shield resources:", e);
      
      // Force nullify resources to prevent further errors
      this.shieldAnimation = null;
      this.shieldGraphics = null;
      this.shieldTimerText = null;
    }
  }
  
  /**
   * Clean up resources when the manager is destroyed
   */
  destroy(): void {
    if (this.powerUpIndicators) {
      this.powerUpIndicators.forEach((indicator) => {
        indicator.destroy();
      });
    }
    if (this.collectedPowerUpsContainer) {
      this.collectedPowerUpsContainer.destroy();
    }
    if (this.shieldAnimation) {
      this.shieldAnimation.stop();
      this.shieldAnimation = null;
    }
    if (this.shieldGraphics) {
      this.shieldGraphics.destroy();
      this.shieldGraphics = null;
    }
    if (this.shieldTimerText) {
      this.shieldTimerText.destroy();
      this.shieldTimerText = null;
    }
    this.activePowerUps.clear();
  }
  
  /**
   * Get the count of a specific power-up
   * @param type - The type of power-up to check
   * @returns number - The count of the power-up
   */
  getCollectedCount(type: PowerUpType): number {
    return this.collectedPowerUps.get(type) || 0;
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
   * Update the display of a collected power-up
   * @param type - The type of power-up to update
   */
  private updateCollectedPowerUpDisplay(type: PowerUpType): void {
    if (!this.collectedPowerUpsContainer) return;
    
    const countText = this.collectedPowerUpsContainer.getByName(`count-${type}`) as Phaser.GameObjects.Text;
    if (countText) {
      countText.setText(`x${this.collectedPowerUps.get(type) || 0}`);
      
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
    this.collectedPowerUps.set(type, count);
    this.updateCollectedPowerUpDisplay(type);
  }

  /**
   * Create the shield animation
   * Modificado para criar a animação ao redor do alvo (centro da tela)
   */
  private createShieldAnimation(): void {
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height - 40; // Posição do alvo na parte inferior da tela
    
    // Remove any existing shield graphics
    if (this.shieldGraphics) {
      try {
        this.shieldGraphics.destroy();
      } catch (e) {
        console.warn("Error destroying existing shield:", e);
      }
      this.shieldGraphics = null;
    }
    
    // Remove any existing timer text
    if (this.shieldTimerText) {
      this.shieldTimerText.destroy();
      this.shieldTimerText = null;
    }
    
    // Create a new graphics object for the shield
    this.shieldGraphics = this.scene.add.graphics();
    
    // Set the initial position and orientation
    this.shieldGraphics.x = 0;
    this.shieldGraphics.y = 0;
    this.shieldGraphics.rotation = 0; // Ensure shield has no rotation
    this.shieldGraphics.setScale(1);
    
    // Initial shield drawing - circular green shield
    this.shieldGraphics.clear();
    
    // Add a fill with low alpha for a glow effect
    this.shieldGraphics.fillStyle(0x00ff00, 0.15);
    this.shieldGraphics.fillCircle(centerX, centerY, 60);
    
    // Add inner circle
    this.shieldGraphics.lineStyle(4, 0x00ff00, 0.8); // Green color with some transparency
    this.shieldGraphics.strokeCircle(centerX, centerY, 50);
    
    // Add outer circle
    this.shieldGraphics.lineStyle(2, 0x00ff00, 0.6);
    this.shieldGraphics.strokeCircle(centerX, centerY, 65);
    
    // Add decorative elements - small arcs around the shield
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      this.shieldGraphics.lineStyle(3, 0x00ff00, 0.7);
      this.shieldGraphics.beginPath();
      this.shieldGraphics.arc(centerX, centerY, 72, angle, angle + 0.4, false);
      this.shieldGraphics.strokePath();
    }
    
    // Adicionar texto indicando que o escudo protege um hit
    let shieldInfoText: Phaser.GameObjects.Text | null = null;
    try {
      shieldInfoText = this.scene.add.text(centerX, centerY - 80, "PROTEGIDO", {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '16px',
        color: '#00ff00',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5);
      
      // Adicionar o texto de informação ao grupo do escudo para remover junto
      (this.shieldGraphics as Phaser.GameObjects.Graphics & { 
        shieldInfoText: Phaser.GameObjects.Text 
      }).shieldInfoText = shieldInfoText;
      
      // Animar o texto de informação
      this.scene.tweens.add({
        targets: shieldInfoText,
        alpha: { from: 1, to: 0.7 },
        scale: { from: 1, to: 1.05 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    } catch (e) {
      console.warn("Error adding shield info text:", e);
    }
    
    // Create a subtle pulsing animation for the shield (no rotation)
    try {
      this.shieldAnimation = this.scene.tweens.add({
        targets: this.shieldGraphics,
        alpha: { from: 0.95, to: 0.8 },
        scale: { from: 1, to: 1.05 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } catch (e) {
      console.warn("Error creating shield animation:", e);
    }
    
    // Add particle effect around the shield
    if (this.scene.add && this.scene.add.particles) {
      try {
        const particles = this.scene.add.particles(0, 0, 'particle', {
          x: centerX,
          y: centerY,
          speed: { min: 20, max: 40 },
          scale: { start: 0.3, end: 0 },
          lifespan: 1000,
          blendMode: 'ADD',
          tint: 0x00ff00, // Green color
          frequency: 150, // Emit a particle every 150ms
          emitting: true
        });
        
        // Store the particles on the shield graphics for cleanup
        (this.shieldGraphics as Phaser.GameObjects.Graphics & { 
          particles: Phaser.GameObjects.Particles.ParticleEmitter 
        }).particles = particles;
      } catch (e) {
        console.warn("Não foi possível criar partículas para o escudo", e);
      }
    }
    
    // Make sure the shield is on top of other game elements
    if (this.scene.children && this.shieldGraphics) {
      this.scene.children.bringToTop(this.shieldGraphics);
      if (shieldInfoText) {
        this.scene.children.bringToTop(shieldInfoText);
      }
    }
  }
  
  /**
   * Bring the power-up displays to the front
   */
  bringToFront(): void {
    // Bring collected power-ups display to front
    if (this.collectedPowerUpsContainer && this.scene.children) {
      this.scene.children.bringToTop(this.collectedPowerUpsContainer);
    }
    
    // Also bring shield graphics to front if it exists
    if (this.shieldGraphics && this.scene.children) {
      this.scene.children.bringToTop(this.shieldGraphics);
    }
  }
}