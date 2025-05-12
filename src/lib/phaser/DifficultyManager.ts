import { WordDifficulty, DifficultySettings, LevelDifficulty } from './types/WordDifficulty';

export class DifficultyManager {
  private currentLevel: number = 1;
  private readonly maxLevel: number = 5;
  private readonly baseSettings: DifficultySettings = {
    baseWordScore: 10,
    maxSpeed: 5,
    maxLength: 5,
    maxModifierScore: 5
  };

  constructor() {}

  public getLevelSettings(): DifficultySettings {
    // Increase difficulty with level
    const levelMultiplier = 1 + (this.currentLevel - 1) * 0.2; // 20% increase per level
    
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
    
    // Distribute points across categories
    const speed = Math.min(
      Math.floor(Math.random() * (settings.maxSpeed + 1)),
      totalScore - 2 // Ensure at least 2 points for other categories
    );
    
    const remainingScore = totalScore - speed;
    const length = Math.min(
      Math.floor(Math.random() * (settings.maxLength + 1)),
      remainingScore - 1 // Ensure at least 1 point for modifiers
    );
    
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