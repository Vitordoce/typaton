import * as Phaser from 'phaser';

/**
 * Enum for word types
 */
export enum WordType {
  NORMAL = 'normal',
  POWERUP = 'powerup'
}

/**
 * Interface for word effects (bad conditions)
 */
export interface WordEffect {
  type: 'blinking' | 'shaking' | 'flipped' | 'fading' | 'rotating';
  intensity?: number;
  duration?: number;
}

/**
 * Complete word data interface
 * Contains all information about a word including its state and effects
 */
export interface WordData {
  text: string;
  type: WordType;
  effects: WordEffect[];
  velocity: Phaser.Math.Vector2;
  spawnTime: number;
  destroyTime?: number;
  completed: boolean;
  position: Phaser.Math.Vector2;
}

/**
 * Configuration for creating a new word
 */
export interface WordConfig {
  text: string;
  type?: WordType;
  effects?: WordEffect[];
  x: number;
  y: number;
}