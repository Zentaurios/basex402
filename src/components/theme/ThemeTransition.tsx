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
}

export function ThemeTransition() {
  const { theme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [squares, setSquares] = useState<Square[]>([]);
  const [prevTheme, setPrevTheme] = useState<string | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);
  const [oldThemeOverlay, setOldThemeOverlay] = useState(false);
  const [oldThemeColors, setOldThemeColors] = useState({ bg: '#ffffff', text: '#0a0b0d' });

  // Track when component is mounted to avoid triggering on initial load
  useEffect(() => {
    setIsMounted(true);
    setPrevTheme(theme);
  }, []);

  useEffect(() => {
    // Only trigger transition if:
    // 1. Component is mounted (not first render)
    // 2. Theme actually changed
    // 3. Previous theme was set (not undefined)
    if (isMounted && theme && prevTheme && theme !== prevTheme) {
      // Store the old theme colors before transition
      const wasLight = prevTheme === 'light' || (prevTheme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
      setOldThemeColors({
        bg: wasLight ? '#ffffff' : '#0a0b0d',
        text: wasLight ? '#0a0b0d' : '#ffffff'
      });
      triggerTransition();
    }
    if (isMounted) {
      setPrevTheme(theme);
    }
  }, [theme, isMounted]);

  const triggerTransition = () => {
    // Show overlay with old theme colors
    setOldThemeOverlay(true);
    setIsTransitioning(true);
    
    // Generate squares for the matrix effect
    const squareCount = 160; // Number of squares
    const columns = 30; // Number of columns
    
    const newSquares = Array.from({ length: squareCount }, (_, i) => ({
      id: i,
      color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
      column: i % columns,
      delay: Math.random() * 0.6, // Stagger the animation more for vertical spacing
    }));
    
    setSquares(newSquares);
    
    // Hide the overlay after 1 second to reveal new theme underneath
    setTimeout(() => {
      setOldThemeOverlay(false);
    }, 1000);
    
    // End transition after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
      setSquares([]);
    }, 2000);
  };

  if (!isTransitioning) return null;

  return (
    <>
      {/* Old theme overlay that fades out */}
      {oldThemeOverlay && (
        <div 
          className="fixed inset-0 z-[9998] pointer-events-none transition-opacity duration-500"
          style={{
            backgroundColor: oldThemeColors.bg,
            color: oldThemeColors.text,
            opacity: 1,
          }}
        />
      )}
      
      {/* Falling squares */}
      <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
        {squares.map((square) => (
          <div
            key={square.id}
            className="absolute rounded-md"
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: square.color,
              left: `${(square.column / 30) * 100}%`,
              top: '-30px',
              animation: `fall 1.2s ease-in forwards`,
              animationDelay: `${square.delay}s`,
              opacity: 0.9,
            }}
          />
        ))}
        
        <style jsx>{`
          @keyframes fall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.9;
            }
            90% {
              opacity: 0.9;
            }
            100% {
              transform: translateY(calc(100vh + 50px)) rotate(180deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </>
  );
}
