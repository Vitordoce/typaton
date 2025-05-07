import * as Phaser from 'phaser';

/**
 * Base class for all game managers
 * Provides common functionality and standardized interface
 */
export abstract class BaseManager {
  protected scene: Phaser.Scene;
  protected eventEmitter: Phaser.Events.EventEmitter;
  
  constructor(scene: Phaser.Scene) {
    console.log('BaseManager constructor - scene:', scene);
    
    if (!scene) {
      console.error('BaseManager: scene is undefined in constructor');
      throw new Error('BaseManager requires a valid Phaser.Scene');
    }
    
    this.scene = scene;
    
    if (scene.events) {
      this.eventEmitter = scene.events;
      console.log('BaseManager: eventEmitter initialized successfully');
    } else {
      console.error('BaseManager: scene.events is undefined');
      // Create a fallback event emitter if scene.events is not available
      this.eventEmitter = new Phaser.Events.EventEmitter();
    }
  }
  
  /**
   * Update method called every frame
   * @param time - Current time
   * @param delta - Time since last frame
   */
  abstract update(time: number, delta: number): void;
  
  /**
   * Clean up resources when the manager is destroyed
   */
  destroy(): void {
    // Override in subclasses if needed
  }
}
