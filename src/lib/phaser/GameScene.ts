import * as Phaser from 'phaser';
import { WordManager } from './WordManager';
import { PowerUpManager } from './PowerUpManager';
import { PowerUpType } from './types/PowerUpTypes';
import { ScoreManager } from './ScoreManager';
import { GameEvents } from './types/GameEvents';
import { WordType, WordEffect } from './types/WordData';
import { generate } from 'random-words';
import { DifficultyManager } from './DifficultyManager';
import { WordDifficulty } from './types/WordDifficulty';

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
  difficulty: WordDifficulty;
}

export default class GameScene extends Phaser.Scene {
  private inputText: string = '';
  private inputDisplay: Phaser.GameObjects.Text | null = null;
  private words: WordObject[] = [];
  private gameOver: boolean = false;
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private isShowingGameOverScreen: boolean = false;
  private level: number = 1;
  private maxLevel: number = 5;
  private wordsCleared: number = 0;
  private wordsToClear: number = 10;
  private levelText: Phaser.GameObjects.Text | null = null;
  private levelCompleteText: Phaser.GameObjects.Text | null = null;
  private campaignComplete: boolean = false;
  private wordManager: WordManager = null!;
  private powerUpManager: PowerUpManager = null!;
  private scoreManager: ScoreManager = null!;
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
  private levelWords: string[] = []; // Store words for current level
  private usedWords: Set<string> = new Set(); // Track used words in current level
  private difficultyManager: DifficultyManager = null!;
  
  // Method to trigger bomb effect (added in create)
  public triggerBombEffect: () => void;

  // Level settings
  private getLevelSettings() {
    return {
      minDuration: 5,
      maxDuration: 10,
      wordsToClear: 10 + (this.level - 1) * 3,
      minWordLength: 3, // Fixed minimum length of 3
      maxWordLength: Math.min(4 + Math.floor(this.level / 2), 8)  // Start with max length of 4, increase with level
    };
  }

  // Generate words for the current level
  private generateLevelWords() {
    const settings = this.getLevelSettings();
    const numWords = settings.wordsToClear * 2; // Generate more words than needed to have variety
    
    // Generate words with increasing difficulty based on level
    this.levelWords = generate({
      exactly: numWords,
      minLength: settings.minWordLength,
      maxLength: settings.maxWordLength
    }) as string[];
    
    // Reset used words set
    this.usedWords.clear();
  }

  constructor() {
    super('GameScene');
    
    // Initialize managers after the scene is fully initialized
    this.triggerBombEffect = () => {}; // Default empty implementation
  }
  
  init() {
    // Generate initial level words
    this.generateLevelWords();
  }

  create() {
    console.log('GameScene create - this:', this);
    console.log('GameScene create - this.events:', this.events);
    
    // Initialize managers here instead of in constructor
    this.wordManager = new WordManager(this);
    this.powerUpManager = new PowerUpManager(this);
    this.scoreManager = new ScoreManager(this);
    
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

    // Reset managers
    this.wordManager.resetLevel();
    this.scoreManager.resetScores();
    
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
    
    // Preload particle texture if not already loaded
    if (!this.textures.exists('particle')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(8, 8, 8);
      graphics.generateTexture('particle', 16, 16);
      graphics.destroy();
    }

    // Initialize difficulty manager
    this.difficultyManager = new DifficultyManager();
  }

  /**
   * Check if the game is actively playing (not in game over, completion, or transition states)
   * This method provides a single place to check if gameplay mechanics should be active
   */
  private isActivePlaying(): boolean {
    return !this.gameOver && !this.campaignComplete && !this.isLevelTransitioning;
  }

  update(time: number, delta: number) {
    // Se o jogo já acabou ou está completo, não faz nada
    if (this.gameOver || this.campaignComplete) {
      // Garantir que a tela de game over seja exibida se o jogo acabou
      if (this.gameOver && !this.isShowingGameOverScreen) {
        this.showGameOverScreen();
      }
      return;
    }
    
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height - 40;
    const currentTime = this.time ? this.time.now : Date.now();

    // Update power-up manager
    if (this.powerUpManager) {
      this.powerUpManager.update(time, delta);
    }
    
    // Check if freeze is active
    const isFreezeActive = this.powerUpManager.isFreezeActive();
    
    // Only spawn new words during active gameplay AND when freeze is not active
    if (this.isActivePlaying() && !isFreezeActive && this.words.length < 3 && (currentTime - this.lastSpawnTime > 500 || this.words.length === 0)) {
      this.spawnWord(currentTime, centerX, centerY);
      this.lastSpawnTime = currentTime;
    }

    // Verificação adicional: se não há palavras e o jogo está em andamento
    // mas não conseguimos criar novas palavras, isso pode ser um erro
    if (this.isActivePlaying() && this.words.length === 0 && (currentTime - this.lastSpawnTime > 3000)) {
      // Tentar gerar palavras novamente
      this.spawnWord(currentTime, centerX, centerY);
      this.lastSpawnTime = currentTime;
      
      // Se mesmo assim não tiver palavras, algo está errado
      if (this.words.length === 0) {
        console.error("Não foi possível gerar palavras. Reiniciando o jogo.");
        this.gameOver = true;
        this.showGameOverScreen();
        return;
      }
    }

    for (let i = this.words.length - 1; i >= 0; i--) {
      // Safety check for word object
      if (!this.words[i] || !this.words[i].text) continue;
      
      const wordObj = this.words[i];
      
      // Only update positions during active gameplay AND when freeze is not active
      if (this.isActivePlaying() && !isFreezeActive) {
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
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // Aumentar um pouco a zona de colisão para detectar melhor
        if (distance < 35) {
          // Check if shield is active
          if (this.powerUpManager && this.powerUpManager.hasActiveShield()) {
            // Use shield to block the hit but don't consume it (it's now indestructible for 2 seconds)
            this.powerUpManager.useShield();
            
            // Remove the word
            wordObj.text.destroy();
            this.words.splice(i, 1);
          } else {
            this.gameOver = true;
            
            // Show enhanced game over screen with score data
            this.showGameOverScreen();
            
            // Break para não processar mais palavras
            break;
          }
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

  spawnWord(timestamp: number, centerX: number, centerY: number) {
    const { width, height } = this.scale;
    const angleDeg = Phaser.Math.Between(30, 150);
    const angleRad = Phaser.Math.DegToRad(angleDeg);
    const diagonal = Math.sqrt(width * width + height * height);
    const spawnRadius = diagonal * 0.8;
    let spawnX = centerX + Math.cos(angleRad) * spawnRadius;
    let spawnY = centerY - Math.sin(angleRad) * spawnRadius;
    spawnX = Phaser.Math.Clamp(spawnX, -200, width + 200);
    spawnY = Phaser.Math.Clamp(spawnY, -200, height + 200);

    // Generate word difficulty
    const difficulty = this.difficultyManager.generateWordDifficulty();
    
    // Calculate speed based on difficulty
    const baseDuration = 12; // Increased from 10 to 12 seconds for slower words
    const speedMultiplier = 1 + (difficulty.speed * 0.08); // Reduced from 0.1 to 0.08 (8% increase per speed point)
    const duration = Math.max(baseDuration / speedMultiplier, 6); // Increased minimum duration from 5 to 6 seconds
    
    const dx = centerX - spawnX;
    const dy = centerY - spawnY;
    const vx = dx / duration;
    const vy = dy / duration;
    
    // Get a word with appropriate length
    let availableWords = this.levelWords.filter(word => 
      !this.usedWords.has(word) && 
      word.length >= difficulty.length && 
      word.length <= difficulty.length + 2
    );
    
    // If we're running low on available words, generate more
    if (availableWords.length < 5) {
      const newWords = generate({
        exactly: 20,
        minLength: difficulty.length,
        maxLength: difficulty.length + 2
      }) as string[];
      this.levelWords.push(...newWords);
      availableWords = this.levelWords.filter(word => 
        !this.usedWords.has(word) && 
        word.length >= difficulty.length && 
        word.length <= difficulty.length + 2
      );
    }
    
    // Select a random word from available words
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const wordValue = availableWords[randomIndex];
    
    // Mark the word as used
    this.usedWords.add(wordValue);
    
    const displayText = wordValue || 'error';
    const wordText = this.add.text(spawnX, spawnY, displayText, {
      ...this.arcadeFontStyle
    }).setOrigin(0.5);

    // Create word object with base properties
    const currentTime = this.time ? this.time.now : Date.now();
    const wordObj: WordObject = {
      text: wordText,
      value: displayText,
      vx,
      vy,
      duration,
      startTime: currentTime,
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
      isPowerUp: false,
      powerUpType: null,
      difficulty // Store the difficulty for scoring
    };

    // Verificar se esta palavra deve ser um power-up
    // Aumentando a chance para garantir que apareçam mais power-ups
    if (this.powerUpManager && this.powerUpManager.shouldBePowerUp()) {
      // Definir o tipo de poder aleatoriamente
      const powerUpType = this.powerUpManager.getRandomPowerUpType();
      
      // Marcar o objeto como um power-up
      wordObj.isPowerUp = true;
      wordObj.powerUpType = powerUpType as (PowerUpType | null);
      
      // Aplicar efeito visual no texto para indicar que é um power-up
      this.powerUpManager.applyPowerUpEffect(wordText, powerUpType);
      
      console.log(`Spawned power-up word: ${displayText} (${powerUpType})`);
    }

    // Apply modifiers based on difficulty
    this.applyWordModifiers(wordObj, difficulty);

    // Add to words array
    this.words.push(wordObj);
  }

  // New method to apply modifiers based on difficulty
  private applyWordModifiers(wordObj: WordObject, difficulty: WordDifficulty) {
    // Apply blinking if difficulty.modifiers.blinking > 0
    if (difficulty.modifiers.blinking > 0) {
      wordObj.blinking = true;
      wordObj.blinkTimer = 0;
    }
    
    // Apply shaking if difficulty.modifiers.shaking > 0
    if (difficulty.modifiers.shaking > 0) {
      wordObj.shaking = true;
    }
    
    // Apply flipping if difficulty.modifiers.flipped > 0
    if (difficulty.modifiers.flipped > 0) {
      wordObj.flipped = true;
      wordObj.flipAngle = Math.PI;
      wordObj.text.rotation = wordObj.flipAngle;
      wordObj.text.setTint(0xffe600);
    }
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
    // Ignorar entradas durante transições de nível ou se o jogo acabou
    if (this.gameOver || this.campaignComplete || this.isLevelTransitioning) return;
    
    // If game over is active, handle restart with Enter key
    if (this.isShowingGameOverScreen) {
      if (event.key === 'Enter' || event.key === ' ') {
        this.scene.start('TitleScene');
        return;
      }
    }
    
    // Pressionar Enter limpa a entrada atual (útil para pular palavras difíceis)
    if (event.key === 'Enter') {
      this.inputText = '';
      if (this.inputDisplay) {
        this.inputDisplay.setText('');
      }
      return;
    }
    
    // Lidar com backspace
    if (event.key === 'Backspace') {
      this.inputText = this.inputText.slice(0, -1);
    }
    // Ignorar espaço
    else if (event.key === ' ' || event.key === 'Space') {
      // Não fazer nada - ignorar espaços
      return;
    }
    // Adicionar caractere à entrada
    else if (event.key.length === 1) {
      // Primeira tecla em uma entrada vazia - começar a rastrear o tempo de digitação
      if (this.inputText === '') {
        // Encontrar a palavra correspondente mais próxima para começar a rastrear
        const matchingWord = this.findClosestMatchingWord(event.key.toLowerCase());
        if (matchingWord && this.scoreManager && typeof this.scoreManager.startTyping === 'function') {
          this.scoreManager.startTyping(matchingWord.value);
          // Emitir evento apenas se estiver definido
          if (GameEvents && GameEvents.TYPING_STARTED) {
            this.events.emit(GameEvents.TYPING_STARTED, matchingWord.value);
          }
        }
      }
      
      this.inputText += event.key.toLowerCase();
    }
    
    // Atualizar a exibição de entrada
    if (this.inputDisplay) {
      this.inputDisplay.setText(this.inputText || '');
    }
    
    // Verificar se a entrada corresponde a alguma palavra
    this.checkWordMatch();
  }
  
  /**
   * Find the closest matching word that starts with the given character
   * @param char - The character to match
   * @returns The matching word object or null
   */
  private findClosestMatchingWord(char: string): WordObject | null {
    // Filter words that start with the character, with safety checks
    const matchingWords = this.words.filter(word => 
      word && word.value && typeof word.value === 'string' && 
      word.value.toLowerCase().startsWith(char)
    );
    
    if (matchingWords.length === 0) return null;
    
    // Find the closest word to the center
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height - 40;
    
    let closestWord = matchingWords[0];
    let closestDistance = Infinity;
    
    for (const word of matchingWords) {
      // Safety check for word and text properties
      if (!word || !word.text) continue;
      
      const dx = word.text.x - centerX;
      const dy = word.text.y - centerY;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestWord = word;
      }
    }
    
    return closestWord;
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
      // Safety check for word object
      if (!this.words[i] || !this.words[i].text) continue;
      
      // Get the word value and normalize it (remove spaces, lowercase)
      const wordValue = this.words[i].value || '';
      const normalizedWord = wordValue.toLowerCase().replace(/\s+/g, '');
      
      // Check if input is a prefix of the word (partial match)
      if (normalizedInput && normalizedWord.startsWith(normalizedInput)) {
        // Highlight the word being typed
        this.words[i].text.setTint(0xffff00);
        
        // If the input exactly matches the word, complete it
        if (normalizedInput === normalizedWord) {
          // Check if it's a power-up word
          const isPowerUp = this.words[i].isPowerUp;
          const powerUpType = this.words[i].powerUpType;
          
          // Create word data for score calculation
          const currentTime = this.time ? this.time.now : Date.now();
          const wordData = {
            text: wordValue,
            type: isPowerUp ? WordType.POWERUP : WordType.NORMAL,
            effects: this.getWordEffects(this.words[i]) as WordEffect[],
            velocity: new Phaser.Math.Vector2(this.words[i].vx || 0, this.words[i].vy || 0),
            spawnTime: this.words[i].startTime || currentTime,
            destroyTime: currentTime,
            completed: true,
            position: new Phaser.Math.Vector2(this.words[i].text.x, this.words[i].text.y)
          };
          
          // Store the text object reference before removing from array
          const textObj = this.words[i].text;
          
          // Calculate enhanced score based on word length
          const wordLength = wordValue.length;
          const baseScore = wordLength * 10; // 10 points per letter
          
          // Add bonuses for longer words
          let bonusMultiplier = 1.0;
          
          // Length bonus: 50% bonus per letter above 5
          if (wordLength > 5) {
            bonusMultiplier += (wordLength - 5) * 0.5;
          }
          
          // Effect bonus: each effect adds a bonus
          if (this.words[i].blinking) bonusMultiplier += 0.2;
          if (this.words[i].shaking) bonusMultiplier += 0.3;
          if (this.words[i].flipped) bonusMultiplier += 0.4;
          
          // Calculate final score with bonuses
          const wordScore = Math.round(baseScore * bonusMultiplier);
          
          // Update score
          this.score += wordScore;
          
          // Add completion effect with score
          this.tweens.add({
            targets: textObj,
            alpha: 0,
            y: textObj.y - 50,
            scale: 1.5,
            duration: 300,
            onComplete: () => {
              // Remove the word after the effect
              textObj.destroy();
            }
          });
          
          // Restore the original score display code (adding back what was previously removed)
          // Show floating score text
          const scoreText = this.add.text(textObj.x, textObj.y - 30, `+${wordScore}`, {
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '20px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
          }).setOrigin(0.5).setDepth(50);
          
          // Animate the score text
          this.tweens.add({
            targets: scoreText,
            y: scoreText.y - 50,
            alpha: { from: 1, to: 0 },
            scale: { from: 1, to: 1.5 },
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
              scoreText.destroy();
            }
          });
          
          // Remove from active words array
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
          
          // If ScoreManager is properly implemented, use it
          if (this.scoreManager && typeof this.scoreManager.handleWordCompleted === 'function') {
            this.scoreManager.handleWordCompleted(wordData);
          }
          
          // Update score display
          if (this.scoreText) {
            this.scoreText.setText(`SCORE: ${this.score}`);
          }
          
          if (this.wordsCleared >= this.getLevelSettings().wordsToClear) {
            this.levelComplete();
          }
          
          // Play success sound if available
          if (this.sound && this.sound.add) {
            try {
              const successSound = this.sound.add('success', { volume: 0.5 });
              if (successSound) successSound.play();
            } catch {
              // Ignore sound errors
            }
          }
          
          break;
        }
      } else {
        // Reset tint if not matching
        if (this.words[i] && this.words[i].text) {
          this.words[i].text.clearTint();
        }
      }
    }
  }
  
  /**
   * Get word effects from a word object
   * @param wordObj - The word object
   * @returns Array of word effects
   */
  private getWordEffects(wordObj: WordObject): WordEffect[] {
    const effects: WordEffect[] = [];
    
    // Safety check for wordObj
    if (!wordObj) return effects;
    
    if (wordObj.blinking) {
      effects.push({ type: 'blinking' });
    }
    
    if (wordObj.shaking) {
      effects.push({ type: 'shaking' });
    }
    
    if (wordObj.flipped) {
      effects.push({ type: 'flipped' });
    }
    
    return effects;
  }

  levelComplete() {
    // Definir estado de transição
    this.isLevelTransitioning = true;
    
    const { width, height } = this.scale;
    
    // Limpar o input text para não interferir no próximo nível
    this.inputText = '';
    if (this.inputDisplay) {
      this.inputDisplay.setText('');
    }
    
    // Criar um retângulo transparente sobre todo o jogo
    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
    
    let message;
    if (this.level < this.maxLevel) {
      message = `LEVEL ${this.level} COMPLETE!`;
    } else {
      message = 'ALL LEVELS COMPLETE!';
      this.campaignComplete = true;
    }
    
    // Texto principal com estilo melhorado
    const levelText = this.add.text(width/2, height/3, message, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '40px',
      color: '#00ff00',
      stroke: '#000',
      strokeThickness: 5,
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);
    
    // Estatísticas do nível
    const statsText = this.add.text(width/2, height/2, 
      `Words Cleared: ${this.wordsCleared}\nScore: ${this.score}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);
    
    // Texto de instrução
    const continueText = this.add.text(width/2, height * 0.7, 
      this.level < this.maxLevel ? 'CLICK TO CONTINUE' : 'CLICK TO FINISH', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);
    
    // Animar a entrada dos textos
    this.tweens.add({
      targets: levelText,
      alpha: 1,
      y: height/3 - 10,
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    this.tweens.add({
      targets: statsText,
      alpha: 1,
      delay: 300,
      duration: 500
    });
    
    this.tweens.add({
      targets: continueText,
      alpha: 1,
      y: height * 0.7 - 5,
      delay: 600,
      duration: 500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Congelar palavras existentes
    for (const wordObj of this.words) {
      wordObj.text.setAlpha(0.3);
    }
    
    // Configurar manipulador de clique
    this.input.once('pointerdown', () => {
      // Desativar evento de digitação durante a transição
      this.input.keyboard?.removeListener('keydown', this.handleKeyPress);
      
      // Remover elementos visuais
      overlay.destroy();
      levelText.destroy();
      statsText.destroy();
      continueText.destroy();
      
      if (this.level < this.maxLevel) {
        this.nextLevel();
      } else {
        // Passar para a tela de vitória com os dados de pontuação
        this.scene.start('WinScene', { 
          scoreData: this.scoreManager.getScoreData() 
        });
      }
    });
  }

  nextLevel() {
    // Restaura a escuta de digitação que foi removida durante a transição
    this.input.keyboard?.on('keydown', this.handleKeyPress, this);
    
    // Reseta o input text para evitar problemas
    this.inputText = '';
    if (this.inputDisplay) {
      this.inputDisplay.setText('');
    }
    
    if (this.level < this.maxLevel) {
      this.level++;
      this.wordsCleared = 0;
      this.wordsToClear = this.getLevelSettings().wordsToClear;
      
      if (this.levelText) {
        this.levelText.setText(`LEVEL: ${this.level} / ${this.maxLevel}`);
      }
      
      // Increase difficulty level
      this.difficultyManager.increaseLevel();
      
      // Generate new words for the next level
      this.generateLevelWords();
      
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
      // Campaign complete, go to win scene
      this.scene.start('WinScene', { 
        scoreData: this.scoreManager.getScoreData() 
      });
    }
  }
  
  /**
   * Get the power-up type from text
   * @param text - The text to check
   * @returns PowerUpType | null - The matching power-up type or null if no match
   */
  getPowerUpTypeFromText(text: string): PowerUpType | null {
    // Safety check for text
    if (!text || typeof text !== 'string') return null;
    
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
  
  /**
   * Show floating score text at the given position
   * @param x - X position
   * @param y - Y position
   * @param score - Score to display
   */
  private showFloatingScore(x: number, y: number, score: number): void {
    // Create floating score text
    const scoreText = this.add.text(x, y, `+${score}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '20px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(50);
    
    // Add floating animation
    this.tweens.add({
      targets: scoreText,
      y: y - 80,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 1.5 },
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        scoreText.destroy();
      }
    });
  }
  
  /**
   * Show the enhanced game over screen with detailed score information
   */
  private showGameOverScreen(): void {
    // Avoid showing multiple times
    if (this.isShowingGameOverScreen) return;
    
    // Marcar que a tela de game over está sendo mostrada
    this.isShowingGameOverScreen = true;
    console.log("Exibindo tela de game over");
    
    // Clear input text to avoid issues when restarting
    this.inputText = '';
    if (this.inputDisplay) {
      this.inputDisplay.setText('');
    }
    
    // Remover palavras da tela para limpar visualmente
    for (const word of this.words) {
      if (word.text) {
        word.text.destroy();
      }
    }
    this.words = [];
    
    // Get score data from score manager
    const scoreData = this.scoreManager.getScoreData();
    
    // Adicionar um pequeno atraso para garantir que transição ocorra corretamente
    this.time.delayedCall(100, () => {
      // Transition to the GameOverScreen scene with score data
      this.scene.start('GameOverScreen', { scoreData });
    });
  }
}