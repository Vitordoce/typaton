import Phaser from 'phaser';

export class FallingWord {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private word: string;
  private velocity: number;
  private isActive: boolean = true;
  private isHighlighted: boolean = false;
  
  constructor(scene: Phaser.Scene, word: string, x: number, velocity: number) {
    this.scene = scene;
    this.word = word;
    this.velocity = velocity;
    
    // Create text object with 8-bit style
    this.text = scene.add.text(x, 0, word, {
      fontFamily: 'PressStart2P',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0);
  }
  
  update(delta: number): boolean {
    if (!this.isActive) return false;
    
    // Move the word down
    this.text.y += this.velocity * (delta / 1000);
    
    // Check if word has fallen off screen
    if (this.text.y > this.scene.scale.height) {
      this.destroy();
      return false; // Word is no longer active
    }
    
    return true; // Word is still active
  }
  
  getWord(): string {
    return this.word;
  }
  
  getPosition(): { x: number, y: number } {
    return { x: this.text.x, y: this.text.y };
  }
  
  highlight(): void {
    if (this.isHighlighted) return;
    
    this.isHighlighted = true;
    this.text.setStyle({
      fontFamily: 'PressStart2P',
      fontSize: '16px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    });
  }
  
  unhighlight(): void {
    if (!this.isHighlighted) return;
    
    this.isHighlighted = false;
    this.text.setStyle({
      fontFamily: 'PressStart2P',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
  }
  
  destroy(): void {
    this.isActive = false;
    this.text.destroy();
  }
  
  // Visual effect for correct word
  correctEffect(): void {
    this.isActive = false;
    
    this.scene.tweens.add({
      targets: this.text,
      alpha: 0,
      y: this.text.y - 50,
      scale: 1.5,
      duration: 500,
      onComplete: () => {
        this.text.destroy();
      }
    });
  }
}
