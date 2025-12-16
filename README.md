# Snake Game

A modern, responsive Snake game built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Classic snake gameplay with smooth animations
- Beautiful gradient design with glowing effects
- Fully responsive - works on desktop and mobile
- Touch controls for mobile devices
- Keyboard controls (Arrow keys or WASD)
- Score tracking with persistent high score
- Pause/resume functionality
- Optimized for Vercel deployment

## Getting Started

### Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build

To create a production build:
```bash
npm run build
```

To start the production server:
```bash
npm start
```

## Deploy to Vercel

The easiest way to deploy this Snake game is to use Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

### Manual Deployment Steps:

1. Install Vercel CLI (if not already installed):
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

For production deployment:
```bash
vercel --prod
```

## How to Play

### Desktop Controls
- **Arrow Keys** or **WASD**: Move the snake
- **Space**: Pause/Resume game
- **Start Game**: Press any arrow key or click the Start button

### Mobile Controls
- **Swipe**: Move the snake in the direction you swipe
- **Tap**: Pause/Resume game
- **Control Buttons**: Use the on-screen directional buttons

### Game Rules
- Eat the red food to grow longer and score points
- Each food eaten gives you 10 points
- Don't hit the walls or yourself!
- Try to beat your high score

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Canvas API** - Game rendering
- **React Hooks** - State management

## License

ISC
