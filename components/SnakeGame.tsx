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
const CELL_SIZE = 24;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 120;

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

  useEffect(() => {
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

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

  const checkCollision = useCallback((head: Position, snakeBody: Position[]): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    return snakeBody.some((segment) => segment.x === head.x && segment.y === head.y);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };

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

        setDirection(nextDirection);

        if (checkCollision(head, prevSnake)) {
          setGameState('gameOver');
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with dark background
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
    ctx.lineWidth = 1;
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

    // Draw food with glow
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;

    ctx.shadowBlur = 25;
    ctx.shadowColor = '#22c55e';

    // Outer glow
    const foodGradient = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, CELL_SIZE / 2);
    foodGradient.addColorStop(0, '#22c55e');
    foodGradient.addColorStop(0.7, '#16a34a');
    foodGradient.addColorStop(1, 'rgba(34, 197, 94, 0.3)');

    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(foodX, foodY, CELL_SIZE / 2 - 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Draw snake with modern style
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;

      if (isHead) {
        // Head with strong glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#3b82f6';

        const headGradient = ctx.createRadialGradient(
          x + CELL_SIZE / 2,
          y + CELL_SIZE / 2,
          0,
          x + CELL_SIZE / 2,
          y + CELL_SIZE / 2,
          CELL_SIZE / 2
        );
        headGradient.addColorStop(0, '#60a5fa');
        headGradient.addColorStop(0.7, '#3b82f6');
        headGradient.addColorStop(1, '#2563eb');

        ctx.fillStyle = headGradient;
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      } else {
        // Body with gradient fade
        const alpha = 1 - (index / snake.length) * 0.6;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(59, 130, 246, ${alpha * 0.5})`;

        const bodyGradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
        bodyGradient.addColorStop(0, `rgba(96, 165, 250, ${alpha})`);
        bodyGradient.addColorStop(1, `rgba(59, 130, 246, ${alpha * 0.8})`);

        ctx.fillStyle = bodyGradient;
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      }

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
      newDirection = deltaX > 0 ? 'RIGHT' : 'LEFT';
    } else {
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
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-3xl">
      {/* Header with title */}
      <div className="w-full mb-8">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-center mb-8 tracking-tight">
          <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-green-400 bg-clip-text text-transparent drop-shadow-2xl">
            SNAKE
          </span>
        </h1>

        {/* Score Display - Glass morphism */}
        <div className="glass rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10" />
          <div className="relative flex justify-around items-center gap-8">
            <div className="text-center flex-1">
              <div className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                Score
              </div>
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
                {score}
              </div>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <div className="text-center flex-1">
              <div className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                Best
              </div>
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                {highScore}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Canvas with glass effect */}
      <div className="relative mb-8">
        <div className="glass rounded-3xl p-4 sm:p-6 shadow-2xl glow-blue">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="rounded-2xl shadow-inner"
            style={{ display: 'block' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />

          {/* Game State Overlays */}
          {gameState === 'idle' && (
            <div className="absolute inset-4 sm:inset-6 flex items-center justify-center bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10">
              <div className="text-center p-6 sm:p-8 max-w-sm">
                <div className="mb-6">
                  <div className="text-6xl mb-4">🐍</div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Ready?</h2>
                  <p className="text-gray-300 text-sm sm:text-base mb-2">
                    Use <kbd className="px-2 py-1 bg-white/10 rounded text-xs">↑ ↓ ← →</kbd> or <kbd className="px-2 py-1 bg-white/10 rounded text-xs">WASD</kbd>
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Mobile: Swipe to move
                  </p>
                </div>
                <button
                  onClick={startGame}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10">Start Game</span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          )}

          {gameState === 'paused' && (
            <div className="absolute inset-4 sm:inset-6 flex items-center justify-center bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10">
              <div className="text-center">
                <div className="text-5xl mb-4">⏸️</div>
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">Paused</h2>
                <p className="text-gray-300 text-sm sm:text-base">
                  Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Space</kbd> or tap to continue
                </p>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-4 sm:inset-6 flex items-center justify-center bg-black/80 backdrop-blur-xl rounded-2xl border border-red-500/30">
              <div className="text-center p-6 sm:p-8">
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-4xl sm:text-5xl font-bold text-red-400 mb-4">Game Over</h2>
                <div className="mb-6">
                  <p className="text-gray-300 text-xl sm:text-2xl mb-2">
                    Score: <span className="font-bold text-white">{score}</span>
                  </p>
                  {score === highScore && score > 0 && (
                    <p className="text-yellow-400 text-lg font-semibold animate-pulse">
                      🏆 New Record!
                    </p>
                  )}
                </div>
                <button
                  onClick={resetGame}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10">Play Again</span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="sm:hidden mb-6">
        <div className="glass rounded-2xl p-4">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => handleDirectionClick('UP')}
              className="glass p-4 rounded-xl hover:bg-white/10 active:bg-white/20 transition-all active:scale-95"
            >
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => handleDirectionClick('LEFT')}
                className="glass p-4 rounded-xl hover:bg-white/10 active:bg-white/20 transition-all active:scale-95"
              >
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => handleDirectionClick('DOWN')}
                className="glass p-4 rounded-xl hover:bg-white/10 active:bg-white/20 transition-all active:scale-95"
              >
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => handleDirectionClick('RIGHT')}
                className="glass p-4 rounded-xl hover:bg-white/10 active:bg-white/20 transition-all active:scale-95"
              >
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-gray-400 text-sm max-w-md">
        <p className="mb-2">
          Eat the <span className="text-green-400 font-semibold">green orbs</span> to grow •
          Avoid hitting <span className="text-red-400 font-semibold">walls</span> and <span className="text-blue-400 font-semibold">yourself</span>
        </p>
        <p className="text-xs text-gray-500">
          Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs">Space</kbd> to pause
        </p>
      </div>
    </div>
  );
}
