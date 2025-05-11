/**
 * Define the types of power-ups available in the game
 */
export enum PowerUpType {
  FREEZE = 'freeze',
  SLOW = 'slow',
  BOMB = 'bomb',
  SHIELD = 'shield'
}

/**
 * Interface for power-up configuration
 */
export interface PowerUpConfig {
  type: PowerUpType;
  duration: number; // Duration in milliseconds (not used for BOMB and SHIELD)
  color: number; // Color for the power-up text/icon
  description: string; // Short description of what the power-up does
}

/**
 * Interface for active power-up state
 */
export interface ActivePowerUp {
  type: PowerUpType;
  startTime: number;
  endTime: number;
  isActive: boolean;
}