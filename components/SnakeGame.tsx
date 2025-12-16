'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Types
type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

type GameState = 'idle' | 'playing' | 'paused' | 'gameOver';

// Constants
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 150; // milliseconds

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [nextDirection, setNextDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Generate random food position
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)
    );
    return newFood;
  }, []);

  // Check collision with walls or self
  const checkCollision = useCallback((head: Position, snakeBody: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    return snakeBody.some((segment) => segment.x === head.x && segment.y === head.y);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };

        // Move head in the current direction
        switch (nextDirection) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Update direction after movement
        setDirection(nextDirection);

        // Check collision
        if (checkCollision(head, prevSnake)) {
          setGameState('gameOver');
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check if food is eaten
        if (head.x === food.x && head.y === food.y) {
          setScore((prev) => {
            const newScore = prev + 10;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('snakeHighScore', newScore.toString());
            }
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, nextDirection, food, checkCollision, generateFood, highScore]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState === 'idle') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          startGame();
        }
        return;
      }

      if (gameState === 'gameOver') {
        if (e.key === ' ' || e.key === 'Enter') {
          resetGame();
        }
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
        return;
      }

      const newDirection = (() => {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            return 'UP';
          case 'ArrowDown':
          case 's':
          case 'S':
            return 'DOWN';
          case 'ArrowLeft':
          case 'a':
          case 'A':
            return 'LEFT';
          case 'ArrowRight':
          case 'd':
          case 'D':
            return 'RIGHT';
          default:
            return null;
        }
      })();

      if (newDirection) {
        e.preventDefault();
        // Prevent 180-degree turns
        const opposites: Record<Direction, Direction> = {
          UP: 'DOWN',
          DOWN: 'UP',
          LEFT: 'RIGHT',
          RIGHT: 'LEFT',
        };
        if (opposites[direction] !== newDirection) {
          setNextDirection(newDirection);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, direction]);

  // Draw game on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#16213e20';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food with glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff6b6b';
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const gradient = ctx.createLinearGradient(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        (segment.x + 1) * CELL_SIZE,
        (segment.y + 1) * CELL_SIZE
      );

      if (isHead) {
        gradient.addColorStop(0, '#4ecdc4');
        gradient.addColorStop(1, '#44a08d');
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4ecdc4';
      } else {
        const alpha = 1 - (index / snake.length) * 0.5;
        gradient.addColorStop(0, `rgba(78, 205, 196, ${alpha})`);
        gradient.addColorStop(1, `rgba(68, 160, 141, ${alpha})`);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
      ctx.shadowBlur = 0;
    });
  }, [snake, food]);

  const startGame = () => {
    setGameState('playing');
  };

  const togglePause = () => {
    setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setNextDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameState('idle');
  };

  // Touch controls
  const [touchStart, setTouchStart] = useState<Position | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    const minSwipeDistance = 30;

    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      // Tap - start or pause
      if (gameState === 'idle') {
        startGame();
      } else if (gameState === 'playing' || gameState === 'paused') {
        togglePause();
      } else if (gameState === 'gameOver') {
        resetGame();
      }
      setTouchStart(null);
      return;
    }

    let newDirection: Direction | null = null;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      newDirection = deltaX > 0 ? 'RIGHT' : 'LEFT';
    } else {
      // Vertical swipe
      newDirection = deltaY > 0 ? 'DOWN' : 'UP';
    }

    if (newDirection && gameState === 'playing') {
      const opposites: Record<Direction, Direction> = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT',
      };
      if (opposites[direction] !== newDirection) {
        setNextDirection(newDirection);
      }
    }

    setTouchStart(null);
  };

  // Mobile control buttons
  const handleDirectionClick = (newDirection: Direction) => {
    if (gameState === 'idle') {
      startGame();
      setNextDirection(newDirection);
      return;
    }

    if (gameState !== 'playing') return;

    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    if (opposites[direction] !== newDirection) {
      setNextDirection(newDirection);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full max-w-2xl">
      {/* Header */}
      <div className="w-full mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Snake Game
        </h1>

        {/* Score Display */}
        <div className="flex justify-between items-center bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Score</div>
            <div className="text-3xl font-bold text-cyan-400">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">High Score</div>
            <div className="text-3xl font-bold text-emerald-400">{highScore}</div>
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border-4 border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/20"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {/* Overlay Messages */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg">
            <div className="text-center p-6">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Play?</h2>
              <p className="text-gray-300 mb-2">Desktop: Use Arrow Keys or WASD</p>
              <p className="text-gray-300 mb-4">Mobile: Swipe to move</p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:from-cyan-600 hover:to-emerald-600 transition-all transform hover:scale-105"
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-4">Paused</h2>
              <p className="text-gray-300">Press Space or Tap to Continue</p>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg">
            <div className="text-center p-6">
              <h2 className="text-4xl font-bold text-red-400 mb-4">Game Over!</h2>
              <p className="text-2xl text-white mb-2">Final Score: {score}</p>
              {score === highScore && score > 0 && (
                <p className="text-xl text-yellow-400 mb-4">New High Score!</p>
              )}
              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:from-cyan-600 hover:to-emerald-600 transition-all transform hover:scale-105"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-6 md:hidden">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => handleDirectionClick('UP')}
            className="bg-slate-700/50 backdrop-blur-sm text-white p-4 rounded-lg hover:bg-slate-600/50 active:bg-slate-500/50 transition-all"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleDirectionClick('LEFT')}
              className="bg-slate-700/50 backdrop-blur-sm text-white p-4 rounded-lg hover:bg-slate-600/50 active:bg-slate-500/50 transition-all"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => handleDirectionClick('DOWN')}
              className="bg-slate-700/50 backdrop-blur-sm text-white p-4 rounded-lg hover:bg-slate-600/50 active:bg-slate-500/50 transition-all"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => handleDirectionClick('RIGHT')}
              className="bg-slate-700/50 backdrop-blur-sm text-white p-4 rounded-lg hover:bg-slate-600/50 active:bg-slate-500/50 transition-all"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-gray-400 text-sm">
        <p className="mb-1">
          <span className="hidden md:inline">Press Space to pause • </span>
          <span className="md:hidden">Tap screen to pause • </span>
          Eat food to grow and score points
        </p>
        <p>Don&apos;t hit the walls or yourself!</p>
      </div>
    </div>
  );
}
