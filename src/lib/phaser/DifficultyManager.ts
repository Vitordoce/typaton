import { WordDifficulty, DifficultySettings, LevelDifficulty } from './types/WordDifficulty';

export class DifficultyManager {
  private currentLevel: number = 1;
  private readonly maxLevel: number = 5;
  private readonly baseSettings: DifficultySettings = {
    baseWordScore: 6,
    maxSpeed: 2,
    maxLength: 4,
    maxModifierScore: 2
  };

  constructor() {}

  public getLevelSettings(): DifficultySettings {
    // Make level 1 much easier, then gradually increase
    const levelMultiplier = this.currentLevel === 1 ? 1 : 1 + (this.currentLevel - 1) * 0.15;
    
    return {
      baseWordScore: Math.round(this.baseSettings.baseWordScore * levelMultiplier),
      maxSpeed: Math.round(this.baseSettings.maxSpeed * levelMultiplier),
      maxLength: Math.round(this.baseSettings.maxLength * levelMultiplier),
      maxModifierScore: Math.round(this.baseSettings.maxModifierScore * levelMultiplier)
    };
  }

  public generateWordDifficulty(): WordDifficulty {
    const settings = this.getLevelSettings();
    const totalScore = settings.baseWordScore;
    
    // For level 1, ensure very low speed and modifiers
    if (this.currentLevel === 1) {
      const speed = Math.min(1, Math.floor(Math.random() * 2)); // Max speed of 1 for level 1
      const length = Math.min(
        Math.floor(Math.random() * 3) + 3, // Length between 3-5 for level 1
        totalScore - 1
      );
      const modifierScore = totalScore - speed - length;
      
      // For level 1, only allow one modifier at a time
      const hasModifier = Math.random() < 0.3; // 30% chance of having a modifier
      const modifierType = Math.floor(Math.random() * 3);
      
      return {
        totalScore,
        speed,
        length,
        modifiers: {
          blinking: hasModifier && modifierType === 0 ? 1 : 0,
          shaking: hasModifier && modifierType === 1 ? 1 : 0,
          flipped: hasModifier && modifierType === 2 ? 1 : 0
        }
      };
    }
    
    // For other levels, use the normal distribution
    const speed = Math.min(
      Math.floor(Math.random() * (settings.maxSpeed + 1)),
      totalScore - 3
    );
    
    const remainingScore = totalScore - speed;
    
    // Bias towards longer words by using a weighted distribution
    const lengthRoll = Math.random();
    let length;
    if (lengthRoll < 0.3) {
      length = 3;
    } else if (lengthRoll < 0.6) {
      length = Math.min(
        Math.floor(Math.random() * (settings.maxLength - 2)) + 4,
        remainingScore - 1
      );
    } else {
      length = Math.min(
        settings.maxLength,
        remainingScore - 1
      );
    }
    
    const modifierScore = remainingScore - length;
    
    // Distribute modifier points
    const blinking = Math.floor(Math.random() * (modifierScore + 1));
    const remainingModifierScore = modifierScore - blinking;
    const shaking = Math.floor(Math.random() * (remainingModifierScore + 1));
    const flipped = remainingModifierScore - shaking;

    return {
      totalScore,
      speed,
      length,
      modifiers: {
        blinking,
        shaking,
        flipped
      }
    };
  }

  public increaseLevel(): void {
    if (this.currentLevel < this.maxLevel) {
      this.currentLevel++;
    }
  }

  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public resetLevel(): void {
    this.currentLevel = 1;
  }
} 