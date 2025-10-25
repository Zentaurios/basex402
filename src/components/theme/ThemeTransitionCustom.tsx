'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

// All Base.org brand colors from your globals.css
const BRAND_COLORS = [
  '#0000ff', // base-blue
  '#3c8aff', // base-cerulean
  '#ffd12f', // base-yellow
  '#66c800', // base-green
  '#b6f569', // base-lime-green
  '#fc401f', // base-red
  '#fea8cd', // base-pink
  '#b8a581', // base-tan
];

interface Square {
  id: number;
  color: string;
  column: number;
  delay: number;
  size: number;
  duration: number;
}

interface ThemeTransitionCustomProps {
  squareCount?: number;
  columns?: number;
  minSize?: number;
  maxSize?: number;
  minDuration?: number;
  maxDuration?: number;
  borderRadius?: string;
}

export function ThemeTransitionCustom({
  squareCount = 100,
  columns = 25,
  minSize = 16,
  maxSize = 32,
  minDuration = 0.8,
  maxDuration = 1.5,
  borderRadius = '6px',
}: ThemeTransitionCustomProps = {}) {
  const { theme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [squares, setSquares] = useState<Square[]>([]);
  const [prevTheme, setPrevTheme] = useState(theme);

  useEffect(() => {
    // Only trigger transition if theme actually changed (not on initial mount)
    if (theme && theme !== prevTheme && prevTheme !== undefined) {
      triggerTransition();
    }
    setPrevTheme(theme);
  }, [theme]);

  const triggerTransition = () => {
    setIsTransitioning(true);
    
    // Generate squares for the matrix effect with varied sizes
    const newSquares = Array.from({ length: squareCount }, (_, i) => {
      const size = minSize + Math.random() * (maxSize - minSize);
      const duration = minDuration + Math.random() * (maxDuration - minDuration);
      
      return {
        id: i,
        color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
        column: i % columns,
        delay: Math.random() * 0.4,
        size,
        duration,
      };
    });
    
    setSquares(newSquares);
    
    // End transition after longest animation completes
    setTimeout(() => {
      setIsTransitioning(false);
      setSquares([]);
    }, (maxDuration + 0.4) * 1000);
  };

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {squares.map((square) => (
        <div
          key={square.id}
          style={{
            position: 'absolute',
            width: `${square.size}px`,
            height: `${square.size}px`,
            backgroundColor: square.color,
            borderRadius: borderRadius,
            left: `${(square.column / columns) * 100}%`,
            top: '-50px',
            animation: `fall-custom ${square.duration}s ease-in forwards`,
            animationDelay: `${square.delay}s`,
            opacity: 0.85,
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes fall-custom {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: 0.85;
          }
          92% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(calc(100vh + 100px)) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
