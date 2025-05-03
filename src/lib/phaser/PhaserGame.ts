import * as Phaser from 'phaser';
import GameScene from './GameScene';

export default class PhaserGame {
  game: Phaser.Game | null = null;

  constructor(containerId: string, width: number, height: number) {
    try {
      console.log('Initializing Phaser game...');
      
      // Super simple configuration
      const config = {
        type: Phaser.AUTO,
        width: width,
        height: height,
        parent: containerId,
        backgroundColor: '#2d2d2d',
        scene: GameScene
      };

      // Create the game instance
      this.game = new Phaser.Game(config);
      console.log('Phaser game created');
    } catch (error) {
      console.error('Error creating Phaser game:', error);
    }
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}
