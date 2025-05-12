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
      
      // Detectar e lidar com erros fatais
      window.addEventListener('error', (e) => {
        console.error('Erro fatal no jogo:', e);
        if (this.game && this.game.scene) {
          // Se houver um erro inesperado, tente reiniciar para a tela de título
          try {
            // Verificar se a cena de game over está ativa
            const activeScene = this.game.scene.getScenes(true)[0];
            if (activeScene && activeScene.scene.key !== 'GameOverScreen') {
              this.game.scene.start('GameOverScreen', { 
                scoreData: {
                  totalScore: 0,
                  wordCount: 0,
                  averageTypingSpeed: 0,
                  highestWordScore: 0,
                  wordScores: [],
                  levelScores: [],
                  powerUpsUsed: 0,
                  powerUpsCollected: 0
                } 
              });
            }
          } catch (err) {
            console.error('Erro ao tentar recuperar o jogo:', err);
          }
        }
      });
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
