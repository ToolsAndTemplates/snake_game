'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameState = 'idle' | 'playing' | 'paused' | 'gameOver';

const GRID_SIZE = 20;
const CELL_SIZE = 25;
const SNAKE_WIDTH = 14;
const INITIAL_SNAKE: Position[] = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
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
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    } while (currentSnake.some(s => s.x === newFood.x && s.y === newFood.y));
    return newFood;
  }, []);

  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) return true;
    return body.some(s => s.x === head.x && s.y === head.y);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };

        switch (nextDirection) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        setDirection(nextDirection);

        if (checkCollision(head, prevSnake)) {
          setGameState('gameOver');
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        if (head.x === food.x && head.y === food.y) {
          setScore(prev => {
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
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, nextDirection, food, checkCollision, generateFood, highScore]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState === 'idle' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        startGame();
        return;
      }

      if (gameState === 'gameOver' && (e.key === ' ' || e.key === 'Enter')) {
        resetGame();
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
        return;
      }

      const dirMap: Record<string, Direction> = {
        'ArrowUp': 'UP', 'w': 'UP', 'W': 'UP',
        'ArrowDown': 'DOWN', 's': 'DOWN', 'S': 'DOWN',
        'ArrowLeft': 'LEFT', 'a': 'LEFT', 'A': 'LEFT',
        'ArrowRight': 'RIGHT', 'd': 'RIGHT', 'D': 'RIGHT',
      };

      const newDir = dirMap[e.key];
      if (newDir) {
        e.preventDefault();
        const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
        if (opposites[direction] !== newDir) setNextDirection(newDir);
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

    // Clear with cream background
    ctx.fillStyle = '#e8ddb5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food - simple circle
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.fillStyle = '#d85a5a';
    ctx.beginPath();
    ctx.arc(foodX, foodY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw snake as connected tube segments
    if (snake.length > 0) {
      ctx.strokeStyle = '#5c9b8a';
      ctx.fillStyle = '#5c9b8a';
      ctx.lineWidth = SNAKE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw the snake body as connected lines
      ctx.beginPath();
      const startX = snake[0].x * CELL_SIZE + CELL_SIZE / 2;
      const startY = snake[0].y * CELL_SIZE + CELL_SIZE / 2;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < snake.length; i++) {
        const x = snake[i].x * CELL_SIZE + CELL_SIZE / 2;
        const y = snake[i].y * CELL_SIZE + CELL_SIZE / 2;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw rounded cap at tail
      const tailX = snake[snake.length - 1].x * CELL_SIZE + CELL_SIZE / 2;
      const tailY = snake[snake.length - 1].y * CELL_SIZE + CELL_SIZE / 2;
      ctx.beginPath();
      ctx.arc(tailX, tailY, SNAKE_WIDTH / 2, 0, 2 * Math.PI);
      ctx.fill();

      // Draw rounded cap at head
      ctx.beginPath();
      ctx.arc(startX, startY, SNAKE_WIDTH / 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [snake, food]);

  const startGame = () => setGameState('playing');
  const togglePause = () => setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
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
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;

    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
      if (gameState === 'idle') startGame();
      else if (gameState === 'playing' || gameState === 'paused') togglePause();
      else if (gameState === 'gameOver') resetGame();
    } else {
      const newDir = Math.abs(deltaX) > Math.abs(deltaY)
        ? (deltaX > 0 ? 'RIGHT' : 'LEFT')
        : (deltaY > 0 ? 'DOWN' : 'UP');

      if (gameState === 'playing') {
        const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
        if (opposites[direction] !== newDir) setNextDirection(newDir);
      }
    }
    setTouchStart(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 md:mb-6" style={{ color: '#3d3228' }}>
          SNAKE
        </h1>

        {/* Score */}
        <div className="flex items-center justify-center gap-6 md:gap-12">
          <div>
            <div className="text-xs md:text-sm mb-1 uppercase tracking-wide" style={{ color: '#8b7355' }}>Score</div>
            <div className="text-3xl md:text-4xl font-bold" style={{ color: '#5c9b8a' }}>{score}</div>
          </div>
          <div className="w-px h-10" style={{ backgroundColor: '#8b7355', opacity: 0.3 }} />
          <div>
            <div className="text-xs md:text-sm mb-1 uppercase tracking-wide" style={{ color: '#8b7355' }}>Best</div>
            <div className="text-3xl md:text-4xl font-bold" style={{ color: '#3d3228' }}>{highScore}</div>
          </div>
        </div>
      </div>

      {/* Game Canvas with Border */}
      <div className="relative mx-auto p-4 md:p-6 rounded-lg" style={{
        backgroundColor: '#8b7355',
        width: 'fit-content',
        boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
      }}>
        <div className="relative" style={{ width: GRID_SIZE * CELL_SIZE }}>
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="w-full"
            style={{ backgroundColor: '#e8ddb5', display: 'block' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />

          {/* Overlays */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center animate-fadeIn" style={{ backgroundColor: 'rgba(139, 115, 85, 0.85)' }}>
              <div className="text-center p-6">
                <p className="mb-6" style={{ color: '#f5efd4' }}>Use arrow keys or WASD</p>
                <button
                  onClick={startGame}
                  className="px-6 py-3 rounded-lg font-medium text-base transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: '#5c9b8a', color: '#f5efd4' }}
                >
                  Start Game
                </button>
              </div>
            </div>
          )}

          {gameState === 'paused' && (
            <div className="absolute inset-0 flex items-center justify-center animate-fadeIn" style={{ backgroundColor: 'rgba(139, 115, 85, 0.85)' }}>
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#f5efd4' }}>Paused</h2>
                <p style={{ color: '#e8ddb5' }}>Press Space to continue</p>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center animate-fadeIn" style={{ backgroundColor: 'rgba(139, 115, 85, 0.85)' }}>
              <div className="text-center p-6">
                <h2 className="text-3xl font-bold mb-3" style={{ color: '#f5efd4' }}>Game Over</h2>
                <p className="text-lg mb-5" style={{ color: '#e8ddb5' }}>
                  Score: <span className="font-bold">{score}</span>
                </p>
                {score === highScore && score > 0 && (
                  <p className="mb-5" style={{ color: '#5c9b8a' }}>New High Score!</p>
                )}
                <button
                  onClick={resetGame}
                  className="px-6 py-3 rounded-lg font-medium text-base transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: '#5c9b8a', color: '#f5efd4' }}
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
