/**
 * WordGenerator.ts
 * Service for generating random words for the game
 */

// This interface is commented out as it's not currently used but kept for documentation
// interface RandomWordResponse {
//   word: string;
// }

/**
 * Class responsible for generating random words
 */
export class WordGenerator {
  // Cache of words to reduce API calls
  private static wordCache: string[] = [];
  private static isLoading: boolean = false;
  private static minWordLength: number = 3;
  private static maxWordLength: number = 12;
  
  // Fallback words in case API fails
  private static fallbackWords: string[] = [
    'cat', 'dog', 'run', 'jump', 'play', 'code', 'type',
    'game', 'word', 'fast', 'slow', 'high', 'low', 'big',
    'small', 'red', 'blue', 'green', 'work', 'rest', 'stop',
    'start', 'open', 'close', 'read', 'write', 'click', 'drag'
  ];
  
  /**
   * Fetch a batch of random words from the API
   * @param count - Number of words to fetch
   * @returns Promise that resolves when words are fetched
   */
  static async fetchWords(count: number = 50): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // Using the Random Word API
      const response = await fetch(`https://random-word-api.herokuapp.com/word?number=${count}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch words');
      }
      
      const words: string[] = await response.json();
      
      // Filter words by length and add to cache
      const filteredWords = words.filter(word => 
        word.length >= this.minWordLength && 
        word.length <= this.maxWordLength &&
        /^[a-z]+$/.test(word) // Only allow simple lowercase words
      );
      
      this.wordCache = [...this.wordCache, ...filteredWords];
      console.log(`Added ${filteredWords.length} words to cache`);
    } catch (error) {
      console.error('Error fetching random words:', error);
      // Add fallback words if API fails
      if (this.wordCache.length < 20) {
        this.wordCache = [...this.wordCache, ...this.fallbackWords];
      }
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Get a random word with specified length
   * @param minLength - Minimum word length
   * @param maxLength - Maximum word length
   * @returns A random word
   */
  static getRandomWord(minLength: number = 3, maxLength: number = 12): string {
    // Filter words by length
    const filteredWords = this.wordCache.filter(
      word => word.length >= minLength && word.length <= maxLength
    );
    
    // If we have words of the right length, return one
    if (filteredWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredWords.length);
      const word = filteredWords[randomIndex];
      
      // Remove the word from cache to avoid repetition
      this.wordCache = this.wordCache.filter(w => w !== word);
      
      // Refill cache if running low
      if (this.wordCache.length < 20 && !this.isLoading) {
        this.fetchWords();
      }
      
      return word;
    }
    
    // If no words of the right length, return a fallback word
    const fallbackFiltered = this.fallbackWords.filter(
      word => word.length >= minLength && word.length <= maxLength
    );
    
    if (fallbackFiltered.length > 0) {
      return fallbackFiltered[Math.floor(Math.random() * fallbackFiltered.length)];
    }
    
    // Last resort - return a simple word
    return 'word';
  }
  
  /**
   * Calculate velocity based on word length
   * @param wordLength - Length of the word
   * @param baseDifficulty - Base difficulty level (1-4)
   * @returns Velocity value
   */
  static calculateVelocityForWordLength(wordLength: number, baseDifficulty: number = 1): number {
    // Shorter words move faster, longer words move slower
    // Base speed is affected by difficulty level
    const baseSpeed = 40 + (baseDifficulty * 10);
    
    // Adjust speed based on word length (shorter = faster)
    // Words of length 3-4 will be fastest, 10+ will be slowest
    let speedFactor = 1.0;
    
    if (wordLength <= 4) {
      speedFactor = 1.3; // Fastest
    } else if (wordLength <= 6) {
      speedFactor = 1.1; // Fast
    } else if (wordLength <= 8) {
      speedFactor = 0.9; // Medium
    } else {
      speedFactor = 0.7; // Slow
    }
    
    return baseSpeed * speedFactor;
  }
  
  /**
   * Initialize the word generator
   * Pre-fetch some words to have them ready
   */
  static initialize(): void {
    this.fetchWords(100);
  }
}