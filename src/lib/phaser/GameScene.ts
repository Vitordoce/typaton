import * as Phaser from 'phaser';
import { WordManager } from './WordManager';
import { PowerUpManager, PowerUpType } from './PowerUpManager';

// Define a proper type for word objects 
interface WordObject {
  text: Phaser.GameObjects.Text;
  value: string;
  vx: number;
  vy: number;
  duration: number;
  startTime: number;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  // Bad condition properties
  blinking: boolean;
  blinkTimer: number;
  shaking: boolean;
  flipped: boolean;
  flipAngle: number;
  shakeOffset: { x: number, y: number };
  shakeRot: number;
  // Power-up properties
  isPowerUp?: boolean;
  powerUpType?: PowerUpType | null;
  // Extensible: Add new bad condition properties here
  // Example: spinning?: boolean;
  // Example: colorShifting?: boolean;
}

export default class GameScene extends Phaser.Scene {
  private inputText: string = '';
  private inputDisplay: Phaser.GameObjects.Text | null = null;
  private words: WordObject[] = [];
  private gameOver: boolean = false;
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private level: number = 1;
  private maxLevel: number = 5;
  private wordsCleared: number = 0;
  private wordsToClear: number = 10;
  private levelText: Phaser.GameObjects.Text | null = null;
  private levelCompleteText: Phaser.GameObjects.Text | null = null;
  private campaignComplete: boolean = false;
  private wordManager: WordManager = null!;
  private powerUpManager: PowerUpManager = null!;
  private arcadeFontStyle = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '24px', // larger for falling words
    color: '#ffe600', // yellow fill
    stroke: '#000', // black border
    strokeThickness: 6
    // No shadow for clarity
  };
  private lastSpawnTime: number = 0;
  private score: number = 0;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private isLevelTransitioning: boolean = false;
  
  // Method to trigger bomb effect (added in create)
  public triggerBombEffect: () => void;

  // Level settings
  private getLevelSettings() {
    return {
      minDuration: 5, // seconds (slowest word)
      maxDuration: 10, // seconds (slowest word stays longest)
      wordsToClear: 10 + (this.level - 1) * 3
    };
  }

  constructor() {
    super('GameScene');
    console.log('GameScene constructor - this:', this);
    console.log('GameScene constructor - this.events:', this.events);
    
    // Initialize managers after the scene is fully initialized
    this.triggerBombEffect = () => {}; // Default empty implementation
  }
  
  init() {
    console.log('GameScene init - this:', this);
    console.log('GameScene init - this.events:', this.events);
  }

  create() {
    console.log('GameScene create - this:', this);
    console.log('GameScene create - this.events:', this.events);
    
    // Initialize managers here instead of in constructor
    this.wordManager = new WordManager(this);
    this.powerUpManager = new PowerUpManager(this);
    
    const { width, height } = this.scale;
    this.level = 1;
    this.campaignComplete = false;
    this.wordsCleared = 0;
    this.words = [];
    this.gameOver = false;
    this.wordsToClear = this.getLevelSettings().wordsToClear;
    this.inputText = '';
    this.lastSpawnTime = 0;
    this.score = 0;

    // Reset WordManager
    this.wordManager.resetLevel();
    
    // Initialize PowerUpManager
    this.powerUpManager.setupPowerUpIndicators();

    // Add a background
    this.add.rectangle(width/2, height/2, width, height, 0x222222);

    // Score display (top left)
    this.scoreText = this.add.text(30, 30, `SCORE: 0`, {
      ...this.arcadeFontStyle,
      fontSize: '18px',
      color: '#00ffcc',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);

    // Input display
    this.inputDisplay = this.add.text(width / 2, height - 50, '', {
      ...this.arcadeFontStyle,
      fontSize: '20px',
      backgroundColor: '#333333',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);

    // Level display
    this.levelText = this.add.text(width / 2, 30, `LEVEL: ${this.level} / ${this.maxLevel}`, {
      ...this.arcadeFontStyle,
      fontSize: '14px',
      color: '#00ffcc',
      backgroundColor: '#222222',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);

    // Game over text (hidden initially)
    this.gameOverText = this.add.text(width / 2, height / 2, 'GAME OVER\nClick to restart', {
      ...this.arcadeFontStyle,
      fontSize: '28px',
      color: '#ff0000',
      align: 'center',
      lineSpacing: 20
    }).setOrigin(0.5).setVisible(false);

    // Level complete text (hidden initially)
    this.levelCompleteText = this.add.text(width / 2, height / 2, '', {
      ...this.arcadeFontStyle,
      fontSize: '24px',
      color: '#00ff00',
      align: 'center',
      backgroundColor: '#222222',
      padding: { x: 10, y: 5 },
      lineSpacing: 20
    }).setOrigin(0.5).setVisible(false);

    // Set up keyboard input
    this.input.keyboard?.on('keydown', this.handleKeyPress, this);

    // Set up click to restart or continue
    this.input.on('pointerdown', () => {
      if (this.gameOver) {
        this.scene.restart();
      } else if (this.levelCompleteText && this.levelCompleteText.visible) {
        this.nextLevel();
      } else if (this.campaignComplete) {
        this.scene.restart();
      }
    });
    
    // Add method to trigger bomb effect
    this.triggerBombEffect = () => {
      // Create explosion effect
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Create particle effect if we have the particle texture
      if (this.textures.exists('particle')) {
        const particles = this.add.particles(0, 0, 'particle', {
          x: centerX,
          y: centerY,
          speed: { min: 100, max: 200 },
          scale: { start: 0.5, end: 0 },
          lifespan: 800,
          blendMode: 'ADD',
          tint: 0xff0000,
          quantity: 20,
          emitting: false
        });
        
        // Emit particles once
        particles.explode(50, centerX, centerY);
        
        // Clean up particles after animation
        this.time.delayedCall(1000, () => {
          particles.destroy();
        });
      }
      
      // Destroy all words
      for (const word of this.words) {
        word.text.destroy();
      }
      this.words = [];
    };
    
    // Make sure power-up display is on top
    this.time.delayedCall(500, () => {
      this.bringPowerUpsToFront();
    });
  }

  /**
   * Check if the game is actively playing (not in game over, completion, or transition states)
   * This method provides a single place to check if gameplay mechanics should be active
   */
  private isActivePlaying(): boolean {
    return !this.gameOver && !this.campaignComplete && !this.isLevelTransitioning;
  }

  update(time: number, delta: number) {
    if (this.gameOver || this.campaignComplete) return;
    
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height - 40;
    const now = this.time.now;

    // Update power-up manager
    this.powerUpManager.update(time, delta);
    
    // Only spawn new words during active gameplay
    if (this.isActivePlaying() && this.words.length < 5 && (now - this.lastSpawnTime > 500 || this.words.length === 0)) {
      this.spawnWord(now, centerX, centerY);
      this.lastSpawnTime = now;
    }

    for (let i = this.words.length - 1; i >= 0; i--) {
      const wordObj = this.words[i];
      
      // Only update positions during active gameplay
      if (this.isActivePlaying()) {
        // Update base position with velocity
        wordObj.baseX = wordObj.baseX + wordObj.vx * (delta / 1000);
        wordObj.baseY = wordObj.baseY + wordObj.vy * (delta / 1000);
      }
      
      // Apply bad condition effects (these are always active)
      this.applyBadConditionEffects(wordObj, delta);

      // Check for game over only during active gameplay
      if (this.isActivePlaying()) {
        const dx = wordObj.text.x - centerX;
        const dy = wordObj.text.y - centerY;
        if (Math.sqrt(dx*dx + dy*dy) < 30) {
          // Check if shield is active
          if (this.powerUpManager.hasActiveShield()) {
            // Use shield instead of game over
            this.powerUpManager.useShield();
            
            // Remove the word
            wordObj.text.destroy();
            this.words.splice(i, 1);
          } else {
            this.gameOver = true;
            if (this.gameOverText) {
              this.gameOverText.setVisible(true);
            }
          }
          break;
        }
      }
    }
    
    // Periodically ensure power-up displays are on top
    if (time % 5000 < 100) { // Every ~5 seconds
      this.bringPowerUpsToFront();
    }
  }

  /**
   * Apply the effects of bad conditions to a word
   * 
   * @param wordObj - The word object to apply effects to
   * @param delta - Time since last frame in milliseconds
   * 
   * HOW THE BAD CONDITIONS SYSTEM WORKS:
   * --------------------------------------------------
   * 1. Each word can have one or more "bad conditions" assigned to it
   *    when spawned (in setupBadConditions)
   * 
   * 2. Each bad condition has:
   *    - A property in the WordObject interface (e.g., blinking: boolean)
   *    - Logic to apply the effect in update (in this method)
   *    - Often a dedicated method to handle its specific logic
   * 
   * 3. To add a new bad condition:
   *    a. Add its properties to the WordObject interface
   *    b. Add initialization logic in setupBadConditions()
   *    c. Add application logic in this method or a dedicated method
   *    d. Update applyBadConditionEffects to call your logic
   */
  private applyBadConditionEffects(wordObj: WordObject, delta: number) {
    // Apply blinking effect
    if (wordObj.blinking) {
      this.applyBlinkingEffect(wordObj, delta);
    }
    
    // Apply shaking effect
    if (wordObj.shaking) {
      this.applyShakingEffect(wordObj);
    } else {
      // Not shaking, just use base position
      wordObj.text.x = wordObj.baseX;
      wordObj.text.y = wordObj.baseY;
      wordObj.text.rotation = wordObj.flipped ? wordObj.flipAngle : 0;
    }

    // EXTENSIBILITY POINT: Add more condition checks here
    // Example:
    // if (wordObj.spinning) {
    //   this.applySpinningEffect(wordObj, delta);
    // }
  }

  /**
   * Apply blinking effect to a word
   * 
   * @param wordObj - The word to apply the effect to
   * @param delta - Time since last frame in milliseconds
   * 
   * Effect: Word toggles visibility on/off at regular intervals
   * 
   * Implementation:
   * - Uses a timer (blinkTimer) to track when to toggle visibility
   * - Resets timer when it reaches the blink interval (250ms)
   * - Word is completely invisible during "off" phases
   */
  private applyBlinkingEffect(wordObj: WordObject, delta: number) {
    wordObj.blinkTimer = (wordObj.blinkTimer || 0) + delta;
    if (wordObj.blinkTimer > 250) { // toggle every 250ms
      wordObj.text.visible = !wordObj.text.visible;
      wordObj.blinkTimer = 0;
    }
  }

  /**
   * Apply shaking effect to a word
   * 
   * @param wordObj - The word to apply the effect to
   * 
   * Effect: Word vibrates/shakes with random offsets each frame
  **/
  private applyShakingEffect(wordObj: WordObject) {
    // Randomize shake offsets each frame
    const shakeX = Phaser.Math.Between(-12, 12);
    const shakeY = Phaser.Math.Between(-4, 4);
    const shakeRot = Phaser.Math.FloatBetween(-0.05, 0.05);
    
    // Store the offsets (might be useful for other effects or adjustments)
    wordObj.shakeOffset = { x: shakeX, y: shakeY };
    wordObj.shakeRot = shakeRot;
    
    // Apply the shake offsets to the actual text object
    wordObj.text.x = wordObj.baseX + shakeX;
    wordObj.text.y = wordObj.baseY + shakeY;
    wordObj.text.rotation = (wordObj.flipped ? wordObj.flipAngle : 0) + shakeRot;
  }

  spawnWord(now: number, centerX: number, centerY: number) {
    const { width, height } = this.scale;
    const { minDuration, maxDuration } = this.getLevelSettings();
    const angleDeg = Phaser.Math.Between(30, 150);
    const angleRad = Phaser.Math.DegToRad(angleDeg);
    const diagonal = Math.sqrt(width * width + height * height);
    const spawnRadius = diagonal * 0.8;
    let spawnX = centerX + Math.cos(angleRad) * spawnRadius;
    let spawnY = centerY - Math.sin(angleRad) * spawnRadius;
    spawnX = Phaser.Math.Clamp(spawnX, -200, width + 200);
    spawnY = Phaser.Math.Clamp(spawnY, -200, height + 200);
    const duration = Phaser.Math.FloatBetween(minDuration, maxDuration);
    const dx = centerX - spawnX;
    const dy = centerY - spawnY;
    const vx = dx / duration;
    const vy = dy / duration;
    
    // Determine if this should be a power-up word
    let wordValue;
    let isPowerUp = false;
    let powerUpType = null;
    
    // 5% chance for any word to be a power-up
    if (Math.random() < 0.05) {
      isPowerUp = true;
      powerUpType = this.powerUpManager.getRandomPowerUpType();
      
      // Use a random word from the word pool, not necessarily the power-up name
      wordValue = this.wordManager.getRandomWord();
    } else {
      wordValue = this.wordManager.getRandomWord();
    }
    
    const wordText = this.add.text(spawnX, spawnY, wordValue, {
      ...this.arcadeFontStyle
    }).setOrigin(0.5);
    
    // Apply power-up effect if needed
    if (isPowerUp && powerUpType) {
      this.powerUpManager.applyPowerUpEffect(wordText, powerUpType);
    }

    // Create word object with base properties
    const wordObj = {
      text: wordText,
      value: wordValue,
      vx,
      vy,
      duration,
      startTime: now,
      startX: spawnX,
      startY: spawnY,
      baseX: spawnX,
      baseY: spawnY,
      blinking: false,
      blinkTimer: 0,
      shaking: false,
      flipped: false,
      flipAngle: 0,
      shakeOffset: { x: 0, y: 0 },
      shakeRot: 0,
      isPowerUp: isPowerUp,
      powerUpType: powerUpType
    };

    // Apply bad conditions based on level (only for non-power-up words)
    if (!isPowerUp) {
      this.setupBadConditions(wordObj);
    }

    // Add to words array
    this.words.push(wordObj);
  }

  /**
   * Set up bad conditions for a word based on current level
   * 
   * @param wordObj - The word object to apply conditions to
   * 
   * This is where conditions are assigned to words when they spawn.
   * The probability of each condition can be adjusted here.
   * 
   * Current conditions:
   * - Blinking: Word toggles visibility (any level, 20% chance)
   * - Shaking: Word jiggles/vibrates (level 2+, 30% chance)
   * - Flipped: Word is upside down (level 3+, 30% chance)
   * 
   * ADDING A NEW BAD CONDITION:
   * --------------------------------------------------
   * 1. Add the condition property to the WordObject interface
   * 2. Initialize it here based on desired probability and level
   * 3. Apply any immediate effects (like the flip rotation/tint)
   * 4. Implement the required update logic in applyBadConditionEffects
   *    or a dedicated method
   * 
   */
  private setupBadConditions(wordObj: WordObject) {
    // Blinking: 20% chance, any level
    wordObj.blinking = Phaser.Math.FloatBetween(0, 1) < 0.2;
    
    // Shaking: 30% chance, only level > 1
    wordObj.shaking = this.level > 1 && Phaser.Math.FloatBetween(0, 1) < 0.3;
    
    // Flipped: 30% chance, only level > 1
    wordObj.flipped = this.level > 2 && Phaser.Math.FloatBetween(0, 1) < 0.3;
    
    // Apply flipping effect
    if (wordObj.flipped) {
      wordObj.flipAngle = Math.PI; // 180 degrees
      wordObj.text.rotation = wordObj.flipAngle;
      wordObj.text.setTint(0xffe600);
    }

    // EXTENSIBILITY POINT: Add more bad conditions here
  }

  handleKeyPress = (event: KeyboardEvent) => {
    if (this.gameOver || this.campaignComplete) return;
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
    // First check if input matches a power-up name and we have that power-up
    const normalizedInput = this.inputText.toLowerCase();
    
    // Check if input matches a power-up type
    const powerUpType = this.getPowerUpTypeFromText(normalizedInput);
    if (powerUpType && this.powerUpManager.getCollectedCount(powerUpType) > 0) {
      // Activate the power-up
      this.powerUpManager.activatePowerUp(powerUpType);
      
      // Clear input
      this.inputText = '';
      if (this.inputDisplay) {
        this.inputDisplay.setText('');
      }
      return;
    }
    
    // If not a power-up activation, check for matching words
    for (let i = 0; i < this.words.length; i++) {
      // Remove spaces from word value for matching
      const normalizedWord = this.words[i].value.replace(/\s+/g, '');
      if (normalizedInput === normalizedWord) {
        // Check if it's a power-up word
        const isPowerUp = this.words[i].isPowerUp;
        const powerUpType = this.words[i].powerUpType;
        
        // Remove the word
        this.words[i].text.destroy();
        this.words.splice(i, 1);
        
        // Clear input
        this.inputText = '';
        if (this.inputDisplay) {
          this.inputDisplay.setText('');
        }
        
        // If it's a power-up word, collect it instead of activating
        if (isPowerUp && powerUpType) {
          this.powerUpManager.collectPowerUp(powerUpType);
        }
        
        // Track cleared words
        this.wordsCleared++;
        
        // Increment score
        this.score++;
        if (this.scoreText) {
          this.scoreText.setText(`SCORE: ${this.score}`);
        }
        
        if (this.wordsCleared >= this.getLevelSettings().wordsToClear) {
          this.levelComplete();
        }
        break;
      }
    }
  }

  levelComplete() {
    if (this.levelCompleteText) {
      // Set transitioning state
      this.isLevelTransitioning = true;
      
      if (this.level < this.maxLevel) {
        this.levelCompleteText.setText(`LEVEL ${this.level} COMPLETE!\nCLICK TO CONTINUE`);
      } else {
        this.levelCompleteText.setText('CAMPAIGN COMPLETE!\nCLICK TO RESTART');
        this.campaignComplete = true;
      }
      
      this.levelCompleteText.setVisible(true);
      
      // Freeze existing words
      for (const wordObj of this.words) {
        wordObj.text.setAlpha(0.5); // Make words semi-transparent to indicate frozen state
      }
    }
  }

  nextLevel() {
    if (this.levelCompleteText) {
      this.levelCompleteText.setVisible(false);
    }
    
    if (this.level < this.maxLevel) {
      this.level++;
      this.wordsCleared = 0;
      this.wordsToClear = this.getLevelSettings().wordsToClear;
      if (this.levelText) {
        this.levelText.setText(`LEVEL: ${this.level} / ${this.maxLevel}`);
      }
      
      // Remove all words from screen
      for (const word of this.words) {
        word.text.destroy();
      }
      this.words = [];
      
      // Reset transition state
      this.isLevelTransitioning = false;
      
      // Increase WordManager difficulty
      this.wordManager.increaseLevel();
      
      // Power-ups are automatically preserved since they're stored in PowerUpManager
    } else {
      // Campaign complete, handled in levelComplete
    }
  }
  
  /**
   * Get the power-up type from text
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
  
  // Call this at the end of create() method
  bringPowerUpsToFront(): void {
    if (this.powerUpManager) {
      this.powerUpManager.bringToFront();
    }
  }
}
