import * as Phaser from 'phaser';
import GameScene from './GameScene';
import { TitleScene, WinScene, GameOverScreen } from './screens';

export default class PhaserGame {
  game: Phaser.Game | null = null;

  constructor(containerId: string, width: number, height: number) {
    try {
      console.log('Initializing Phaser game...');
      
      // Game configuration with all scenes, starting with TitleScene
      const config = {
        type: Phaser.AUTO,
        width: width,
        height: height,
        parent: containerId,
        backgroundColor: '#2d2d2d',
        scene: [TitleScene, GameScene, WinScene, GameOverScreen],
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
          }
        },
        render: {
          pixelArt: true
        },
        // Melhorar a visualização em dispositivos móveis/retina
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
        }
      };

      // Create the game instance
      this.game = new Phaser.Game(config);
      console.log('Phaser game created');
      
      // Improved error handling for fatal errors
      window.addEventListener('error', (event) => {
        // Avoid logging the entire error event object which might cause circular references
        const errorInfo = {
          message: event.message || 'Unknown error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        };
        
        console.error('Game error detected:', errorInfo.message);
        
        // Only try to recover if we have a valid game instance
        if (this.game && this.game.scene && !this.isDestroyed()) {
          try {
            // Check if any scenes are active before trying to transition
            const activeScenes = this.game.scene.getScenes(true);
            
            if (activeScenes && activeScenes.length > 0) {
              // Check if we're already in GameOverScreen or TitleScene to avoid loops
              const currentSceneKey = activeScenes[0].scene.key;
              
              if (currentSceneKey !== 'GameOverScreen' && currentSceneKey !== 'TitleScene') {
                console.log('Transitioning to GameOverScreen after error');
                
                // Use a delayed call to ensure scene transition happens after current frame
                setTimeout(() => {
                  if (this.game && this.game.scene && !this.isDestroyed()) {
                    this.game.scene.start('TitleScene');
                  }
                }, 100);
              } else {
                console.log('Already in', currentSceneKey, '- not transitioning');
              }
            } else {
              console.warn('No active scenes found');
            }
          } catch (recoveryError) {
            console.error('Failed to recover from error:', recoveryError);
          }
        }
      });
    } catch (error) {
      console.error('Error creating Phaser game:', error);
    }
  }
  
  // Helper method to check if the game has been destroyed
  private isDestroyed(): boolean {
    return !this.game || !(this.game.isRunning || false);
  }

  destroy() {
    if (this.game) {
      try {
        this.game.destroy(true);
      } catch (e) {
        console.warn('Error during game destruction:', e);
      }
      this.game = null;
    }
  }
}
