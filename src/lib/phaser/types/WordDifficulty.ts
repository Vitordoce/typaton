export interface WordDifficulty {
  totalScore: number;
  speed: number;
  length: number;
  modifiers: {
    blinking: number;
    shaking: number;
    flipped: number;
  };
}

export interface DifficultySettings {
  baseWordScore: number;
  maxSpeed: number;
  maxLength: number;
  maxModifierScore: number;
}

export interface LevelDifficulty {
  level: number;
  settings: DifficultySettings;
} 