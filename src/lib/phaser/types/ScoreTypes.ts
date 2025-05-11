/**
 * Interface for score data
 */
export interface ScoreData {
  totalScore: number;
  wordCount: number;
  averageTypingSpeed: number; 
  highestWordScore: number;
  wordScores: WordScoreDetail[];
  levelScores: LevelScoreDetail[];
  powerUpsUsed: number;
  powerUpsCollected: number;
}

/**
 * Interface for detailed word score information
 */
export interface WordScoreDetail {
  word: string;
  score: number;
  basePoints: number;
  lengthBonus: number;
  velocityBonus: number;
  typingSpeedBonus: number;
  effectsBonus: number;
  timeToType: number;
  typingSpeed: number; 
}

/**
 * Interface for level score information
 */
export interface LevelScoreDetail {
  level: number;
  score: number;
  wordCount: number;
  averageTypingSpeed: number;
}