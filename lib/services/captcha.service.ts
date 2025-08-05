import { SECURITY_CONFIG } from '@/lib/config/security';

export interface CaptchaSolution {
  puzzleId: string;
  piecePositions: number[];
  timestamp: number;
}

export interface CaptchaPuzzle {
  id: string;
  correctPositions: number[];
  difficulty: 'easy' | 'medium' | 'hard';
  expiresAt: number;
}

export class CaptchaService {
  /**
   * Generate a new captcha puzzle
   */
  generatePuzzle(): CaptchaPuzzle {
    const { PUZZLE_SIZE } = SECURITY_CONFIG.CAPTCHA;
    const totalPieces = PUZZLE_SIZE * PUZZLE_SIZE;
    
    // Create correct positions (0-8 for 3x3 grid)
    const correctPositions = Array.from({ length: totalPieces }, (_, i) => i);
    
    // Shuffle positions (except the last piece which stays in place)
    const shuffledPositions = [...correctPositions];
    for (let i = 0; i < shuffledPositions.length - 1; i++) {
      const j = Math.floor(Math.random() * (shuffledPositions.length - i)) + i;
      [shuffledPositions[i], shuffledPositions[j]] = 
      [shuffledPositions[j], shuffledPositions[i]];
    }
    
    return {
      id: this.generatePuzzleId(),
      correctPositions: shuffledPositions,
      difficulty: 'medium',
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    };
  }

  /**
   * Validate a captcha solution
   */
  validateSolution(puzzle: CaptchaPuzzle, solution: CaptchaSolution): boolean {
    // Check if puzzle has expired
    if (Date.now() > puzzle.expiresAt) {
      console.error('Puzzle expired');
      return false;
    }

    // Check if puzzle ID matches
    if (puzzle.id !== solution.puzzleId) {
      console.error('Puzzle ID mismatch:', puzzle.id, 'vs', solution.puzzleId);
      return false;
    }

    // Check if all pieces are in correct positions
    // The solution should have pieces in the correct order (0,1,2,3,4,5,6,7,8)
    const totalPieces = SECURITY_CONFIG.CAPTCHA.PUZZLE_SIZE ** 2;
    const expectedPositions = Array.from({ length: totalPieces }, (_, i) => i);
    
    const isValid = solution.piecePositions.every((position, index) => 
      position === expectedPositions[index]
    );
    
    console.log('Captcha validation:', {
      expected: expectedPositions,
      received: solution.piecePositions,
      isValid
    });
    
    return isValid;
  }

  /**
   * Generate a unique puzzle ID
   */
  private generatePuzzleId(): string {
    return `puzzle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get puzzle difficulty settings
   */
  getDifficultySettings(difficulty: 'easy' | 'medium' | 'hard') {
    const settings = {
      easy: { minMoves: 2, maxMoves: 4 },
      medium: { minMoves: 4, maxMoves: 6 },
      hard: { minMoves: 6, maxMoves: 8 }
    };
    return settings[difficulty];
  }
}

// Export singleton instance
export const captchaService = new CaptchaService(); 