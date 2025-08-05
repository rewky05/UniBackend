"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface HealthcareCaptchaProps {
  onComplete: (isValid: boolean) => void;
  onReset: () => void;
}

// Generate random healthcare-themed captcha text
const generateCaptchaText = () => {
  const healthcareWords = [
    'DOCTOR', 'NURSE', 'MEDICAL', 'HEALTH', 'CLINIC', 'HOSPITAL', 'PATIENT', 'TREATMENT',
    'MEDICINE', 'STETHOSCOPE', 'AMBULANCE', 'SURGERY', 'THERAPY', 'DIAGNOSIS', 'PRESCRIPTION'
  ];
  const randomWord = healthcareWords[Math.floor(Math.random() * healthcareWords.length)];
  
  // Add some numbers to make it more challenging
  const numbers = Math.random().toString(36).substring(2, 4).toUpperCase();
  return randomWord.substring(0, 6) + numbers;
};

export function HealthcareCaptcha({ onComplete, onReset }: HealthcareCaptchaProps) {
  const [captchaText, setCaptchaText] = useState(generateCaptchaText());
  const [userInput, setUserInput] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUserInput('');
    setIsCompleted(false);
    setError('');
    setShowHint(false);
  }, [captchaText]);

  const handleSubmit = () => {
    const isCorrect = userInput.trim() === captchaText;
    
    if (isCorrect) {
      setIsCompleted(true);
      onComplete(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError('Incorrect. Please try again.');
      
      if (newAttempts >= 3) {
        // Instead of reloading, just show a message and reset
        setError('Too many failed attempts. Please try a new captcha.');
        setTimeout(() => {
          handleNewCaptcha();
        }, 2000);
        return;
      }
      
      if (newAttempts >= 1) {
        setShowHint(true);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleReset = () => {
    setUserInput('');
    setIsCompleted(false);
    setAttempts(0);
    setShowHint(false);
    setError('');
    onReset();
  };

  const handleNewCaptcha = () => {
    setCaptchaText(generateCaptchaText());
    handleReset();
  };

  // Create distorted text with CSS
  const createDistortedText = (text: string) => {
    return text.split('').map((char, index) => {
      const rotation = (Math.random() - 0.5) * 30;
      const scale = 0.8 + Math.random() * 0.4;
      const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
      
      return (
        <span
          key={index}
          style={{
            display: 'inline-block',
            transform: `rotate(${rotation}deg) scale(${scale})`,
            color: color,
            fontWeight: Math.random() > 0.5 ? 'bold' : 'normal',
            fontSize: `${20 + Math.random() * 10}px`,
            margin: '0 2px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            filter: `blur(${Math.random() * 0.5}px)`
          }}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Security Verification
          </h3>
          <p className="text-sm text-gray-600">
            Type the characters you see in the image below:
          </p>
        </div>

        {/* Captcha Display */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg border-2 border-gray-300 mb-4">
            {/* Noise overlay */}
            <div className="relative">
              {/* Background noise */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-gray-600 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                  />
                ))}
              </div>
              
              {/* Distorted text */}
              <div className="relative z-10 font-mono tracking-wider">
                {createDistortedText(captchaText)}
              </div>
              
              {/* Lines overlay */}
              <div className="absolute inset-0 opacity-30">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-px bg-gray-400"
                    style={{
                      left: '0',
                      right: '0',
                      top: `${(i + 1) * 12}%`,
                      transform: `rotate(${(Math.random() - 0.5) * 10}deg)`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Enter the characters exactly as shown
          </p>
        </div>

        {/* Input Field */}
        <div className="mb-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type the characters here..."
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg tracking-wider",
              error ? "border-red-500" : "border-gray-300"
            )}
            disabled={isCompleted}
            maxLength={captchaText.length}
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>



        {/* Success Message */}
        {isCompleted && (
          <div className="text-center mb-4">
            <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-lg">
              ✓ Verification successful!
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Attempts: {attempts}/3
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={isCompleted || !userInput.trim()}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isCompleted || !userInput.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-500 text-white hover:bg-green-600"
              )}
              title="Verify"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            
            <button
              onClick={handleNewCaptcha}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              title="New Captcha"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hint */}
        {showHint && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
            <p className="text-sm text-yellow-800">
              💡 Hint: Look carefully at each character. Some may be rotated or distorted.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Type the characters exactly as they appear in the image above.</p>
          <p>This helps ensure you're a real person accessing the system.</p>
        </div>
      </div>
    </div>
  );
} 