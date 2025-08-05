'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Lock, CheckCircle, XCircle } from 'lucide-react';
import { SECURITY_CONFIG } from '@/lib/config/security';
import { captchaService, type CaptchaSolution } from '@/lib/services/captcha.service';

interface PuzzlePiece {
  id: number;
  currentPosition: number;
  correctPosition: number;
  image: string;
}

interface DragDropCaptchaProps {
  onComplete: (isValid: boolean, solution?: CaptchaSolution) => void;
  onReset: () => void;
  disabled?: boolean;
  email?: string;
}

export function DragDropCaptcha({ onComplete, onReset, disabled = false, email }: DragDropCaptchaProps) {
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { PUZZLE_SIZE, MIN_DRAG_DISTANCE } = SECURITY_CONFIG.CAPTCHA;

  // Generate puzzle pieces
  const generatePuzzle = () => {
    // Generate backend puzzle
    const puzzle = captchaService.generatePuzzle();
    setCurrentPuzzle(puzzle);
    
    // Store puzzle in session storage for backend validation
    if (email) {
      try {
        const sanitizedEmail = email
          .replace(/\./g, '-')  // Replace dots with hyphens
          .replace(/@/g, '-')   // Replace @ with hyphens
          .replace(/[^a-zA-Z0-9_-]/g, '_'); // Replace any other invalid chars with underscores
        const storageKey = `captcha_puzzle_${sanitizedEmail}`;
        sessionStorage.setItem(storageKey, JSON.stringify(puzzle));
        console.log('Puzzle stored for email:', email, 'with key:', storageKey);
      } catch (error) {
        console.error('Error storing puzzle:', error);
      }
    }
    
    const pieces: PuzzlePiece[] = [];
    const totalPieces = PUZZLE_SIZE * PUZZLE_SIZE;
    
    // Create pieces with shuffled positions from backend puzzle
    for (let i = 0; i < totalPieces; i++) {
      pieces.push({
        id: i,
        currentPosition: puzzle.correctPositions[i], // Use backend shuffled positions
        correctPosition: i, // Target position (0-8 in order)
        image: `data:image/svg+xml;base64,${btoa(`
          <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
            <rect width="60" height="60" fill="hsl(${200 + i * 20}, 70%, 60%)" stroke="#333" stroke-width="2"/>
            <text x="30" y="35" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${i + 1}</text>
          </svg>
        `)}`
      });
    }
    
    setPuzzlePieces(pieces);
    setIsCompleted(false);
    setIsValid(false);
    setShowSuccess(false);
    setShowError(false);
  };

  // Check if puzzle is solved correctly
  const checkSolution = () => {
    const isCorrect = puzzlePieces.every(piece => piece.currentPosition === piece.correctPosition);
    setIsValid(isCorrect);
    setIsCompleted(true);
    
    if (isCorrect && currentPuzzle) {
      // Create solution object for backend validation
      // The solution should contain the final positions in the correct order (0,1,2,3,4,5,6,7,8)
      const solution: CaptchaSolution = {
        puzzleId: currentPuzzle.id,
        piecePositions: Array.from({ length: PUZZLE_SIZE * PUZZLE_SIZE }, (_, i) => i), // Correct order
        timestamp: Date.now()
      };
      
      console.log('Puzzle solved correctly, sending solution:', solution);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onComplete(true, solution);
    } else {
      console.log('Puzzle solved incorrectly');
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
      onComplete(false);
    }
  };

  // Handle piece drag start
  const handleDragStart = (e: React.DragEvent, pieceId: number) => {
    if (disabled) return;
    setDraggedPiece(pieceId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle piece drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle piece drop
  const handleDrop = (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    if (disabled || draggedPiece === null) return;

    setPuzzlePieces(prev => 
      prev.map(piece => 
        piece.id === draggedPiece 
          ? { ...piece, currentPosition: targetPosition }
          : piece.currentPosition === targetPosition
          ? { ...piece, currentPosition: piece.id }
          : piece
      )
    );
    setDraggedPiece(null);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent, pieceId: number) => {
    if (disabled) return;
    setDraggedPiece(pieceId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || draggedPiece === null) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent, targetPosition: number) => {
    if (disabled || draggedPiece === null) return;
    
    const touch = e.changedTouches[0];
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const distance = Math.sqrt(
      Math.pow(touch.clientX - rect.left, 2) + 
      Math.pow(touch.clientY - rect.top, 2)
    );

    if (distance > MIN_DRAG_DISTANCE) {
      setPuzzlePieces(prev => 
        prev.map(piece => 
          piece.id === draggedPiece 
            ? { ...piece, currentPosition: targetPosition }
            : piece.currentPosition === targetPosition
            ? { ...piece, currentPosition: piece.id }
            : piece
        )
      );
    }
    setDraggedPiece(null);
  };

  // Generate puzzle on mount
  useEffect(() => {
    generatePuzzle();
  }, []);

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Security Verification</h3>
          <Button
            variant="outline"
            size="icon"
            onClick={generatePuzzle}
            disabled={disabled}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Arrange the puzzle pieces in numerical order
          </p>
          {isCompleted && (
            <div className="flex items-center justify-center space-x-2">
              {isValid ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Incorrect
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Puzzle Grid */}
        <div 
          ref={containerRef}
          className="grid gap-1"
          style={{ 
            gridTemplateColumns: `repeat(${PUZZLE_SIZE}, 1fr)`,
            aspectRatio: '1'
          }}
        >
          {Array.from({ length: PUZZLE_SIZE * PUZZLE_SIZE }, (_, index) => {
            const piece = puzzlePieces.find(p => p.currentPosition === index);
            return (
              <div
                key={index}
                className={`
                  aspect-square border-2 border-dashed border-gray-300 rounded-lg
                  flex items-center justify-center bg-gray-50
                  ${piece ? 'border-solid border-blue-500 bg-blue-50' : ''}
                  ${draggedPiece === piece?.id ? 'opacity-50' : ''}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onTouchStart={(e) => piece && handleTouchStart(e, piece.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={(e) => handleTouchEnd(e, index)}
              >
                {piece && (
                  <img
                    src={piece.image}
                    alt={`Puzzle piece ${piece.id + 1}`}
                    className="w-full h-full object-cover rounded"
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(e, piece.id)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={checkSolution}
            disabled={disabled || isCompleted}
            className="flex-1"
            variant={isValid ? "default" : "outline"}
          >
            {isCompleted ? (isValid ? 'Verified' : 'Try Again') : 'Verify Puzzle'}
          </Button>
          <Button
            onClick={generatePuzzle}
            variant="outline"
            disabled={disabled}
            className="px-3"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Success/Error Indicators */}
        {showSuccess && (
          <div className="fixed inset-0 bg-green-500/20 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">Puzzle Completed!</p>
            </div>
          </div>
        )}

        {showError && (
          <div className="fixed inset-0 bg-red-500/20 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-medium">Incorrect Solution</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 