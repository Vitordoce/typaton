/**
 * Centralized event definitions for the game
 * Using an enum prevents typos and provides better IDE support
 */
export enum GameEvents {
  // Word events
  WORD_SPAWNED = 'word-spawned',
  WORD_DESTROYED = 'word-destroyed',
  WORD_COMPLETED = 'word-completed',
  WORD_REACHED_CENTER = 'word-reached-center',
  WORD_VELOCITY_SET = 'word-velocity-set',
  
  // Power-up events
  POWERUP_ACTIVATED = 'powerup-activated',
  POWERUP_EXPIRED = 'powerup-expired',
  POWERUP_COLLECTED = 'powerup-collected',
  
  // Game state events
  SCORE_UPDATED = 'score-updated',
  LEVEL_COMPLETE = 'level-complete',
  LEVEL_STARTED = 'level-started',
  GAME_OVER = 'game-over',
  GAME_PAUSED = 'game-paused',
  GAME_RESUMED = 'game-resumed'
}
