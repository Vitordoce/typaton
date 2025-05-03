// Word lists of varying difficulty
export const WORD_LISTS = {
  EASY: [
    'cat', 'dog', 'run', 'jump', 'play', 'fast', 'slow', 'big', 'small', 'red',
    'blue', 'green', 'walk', 'talk', 'eat', 'sleep', 'work', 'game', 'code', 'type'
  ],
  MEDIUM: [
    'computer', 'keyboard', 'monitor', 'program', 'function', 'variable', 'constant',
    'developer', 'software', 'hardware', 'network', 'internet', 'browser', 'server',
    'client', 'database', 'algorithm', 'interface', 'library', 'framework'
  ],
  HARD: [
    'javascript', 'typescript', 'programming', 'development', 'application', 'responsive',
    'architecture', 'optimization', 'performance', 'experience', 'accessibility',
    'authentication', 'authorization', 'implementation', 'documentation', 'configuration',
    'integration', 'deployment', 'maintenance', 'refactoring'
  ],
  EXPERT: [
    'asynchronous', 'serialization', 'internationalization', 'authentication',
    'authorization', 'microservices', 'infrastructure', 'containerization',
    'virtualization', 'orchestration', 'parallelization', 'encapsulation',
    'polymorphism', 'inheritance', 'abstraction', 'implementation', 'functionality',
    'compatibility', 'interoperability', 'sustainability'
  ]
};

export class WordManager {
  private currentLevel: number = 1;
  private wordPool: string[] = [];
  
  constructor() {
    this.refreshWordPool();
  }
  
  // Get a random word based on current difficulty level
  getRandomWord(): string {
    if (this.wordPool.length === 0) {
      this.refreshWordPool();
    }
    
    // Get a random word from the pool and remove it
    const randomIndex = Math.floor(Math.random() * this.wordPool.length);
    const word = this.wordPool[randomIndex];
    this.wordPool.splice(randomIndex, 1);
    
    return word;
  }
  
  // Increase difficulty level
  increaseLevel(): void {
    if (this.currentLevel < 4) {
      this.currentLevel++;
      this.refreshWordPool();
    }
  }
  
  // Reset to initial level
  resetLevel(): void {
    this.currentLevel = 1;
    this.refreshWordPool();
  }
  
  // Get current level
  getLevel(): number {
    return this.currentLevel;
  }
  
  // Refresh the word pool based on current level
  private refreshWordPool(): void {
    this.wordPool = [];
    
    // Add words based on current level
    if (this.currentLevel >= 1) {
      this.wordPool = this.wordPool.concat(WORD_LISTS.EASY);
    }
    
    if (this.currentLevel >= 2) {
      this.wordPool = this.wordPool.concat(WORD_LISTS.MEDIUM);
    }
    
    if (this.currentLevel >= 3) {
      this.wordPool = this.wordPool.concat(WORD_LISTS.HARD);
    }
    
    if (this.currentLevel >= 4) {
      this.wordPool = this.wordPool.concat(WORD_LISTS.EXPERT);
    }
    
    // Shuffle the word pool
    this.shuffleArray(this.wordPool);
  }
  
  // Fisher-Yates shuffle algorithm
  private shuffleArray(array: string[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
