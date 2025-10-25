# Theme Transition Component

A beautiful matrix-style theme transition effect using your Base.org brand colors.

## Features

- 🎨 Uses all Base.org brand colors (blue, cerulean, yellow, green, lime-green, red, pink, tan)
- 💫 Smooth "matrix rain" animation with rounded squares
- 🎭 Automatically triggers on theme change
- ⚡ Lightweight and performant
- 🎚️ Customizable parameters

## Usage

The basic version is already integrated into your `providers.tsx`. It will automatically show whenever the user switches between light/dark/system themes.

### Default Version

Already imported in `src/app/providers.tsx`:

```tsx
import { ThemeTransition } from '@/components/theme/ThemeTransition';
```

This version uses sensible defaults:
- 80 squares
- 20 columns
- 24px square size
- 1.2s duration

### Custom Version

For more control, you can swap to the custom version:

```tsx
import { ThemeTransitionCustom } from '@/components/theme/ThemeTransitionCustom';

// In your providers.tsx, replace ThemeTransition with:
<ThemeTransitionCustom
  squareCount={100}        // More squares = denser effect
  columns={25}             // More columns = tighter grid
  minSize={16}             // Minimum square size (px)
  maxSize={32}             // Maximum square size (px)
  minDuration={0.8}        // Fastest animation speed (seconds)
  maxDuration={1.5}        // Slowest animation speed (seconds)
  borderRadius="6px"       // Rounded corners
/>
```

## Customization Examples

### Dense Matrix Effect
```tsx
<ThemeTransitionCustom
  squareCount={150}
  columns={30}
  minSize={12}
  maxSize={20}
/>
```

### Large, Slow Squares
```tsx
<ThemeTransitionCustom
  squareCount={50}
  columns={15}
  minSize={32}
  maxSize={48}
  minDuration={1.5}
  maxDuration={2.5}
/>
```

### Sharp Squares (No Rounding)
```tsx
<ThemeTransitionCustom
  borderRadius="0px"
/>
```

## How It Works

1. Listens to theme changes via `next-themes`
2. Generates a matrix of colored squares on theme change
3. Each square:
   - Gets a random brand color
   - Falls from top to bottom
   - Has a staggered delay for the cascade effect
   - Rotates as it falls
   - Fades in and out smoothly
4. Automatically cleans up after animation completes

## Brand Colors Used

- Base Blue: `#0000ff`
- Base Cerulean: `#3c8aff`
- Base Yellow: `#ffd12f`
- Base Green: `#66c800`
- Base Lime Green: `#b6f569`
- Base Red: `#fc401f`
- Base Pink: `#fea8cd`
- Base Tan: `#b8a581`

## Performance Notes

- Uses CSS animations (GPU-accelerated)
- `pointer-events-none` ensures no interaction blocking
- Fixed positioning with high z-index for proper layering
- Automatically removes DOM elements after animation

## Troubleshooting

**Transition doesn't trigger on first load:**
This is intentional! The transition only triggers when the theme _changes_, not on initial page load.

**Want to disable it temporarily:**
Simply comment out the `<ThemeTransition />` line in `providers.tsx`

**Want different colors:**
Edit the `BRAND_COLORS` array in the component file to use different hex values
