import * as Phaser from 'phaser';

export class WordManager {
  private scene: Phaser.Scene;
  private level: number = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public resetLevel(): void {
    this.level = 1;
  }

  public increaseLevel(): void {
    this.level++;
  }

  public getCurrentLevel(): number {
    return this.level;
  }
} 