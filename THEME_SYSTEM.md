# Theme System Documentation

## Overview
The app now has a fully integrated light/dark/system theme that works across all components, including the Coinbase CDP Embedded Wallet.

## How It Works

### 1. Theme Configuration (`/lib/cdp-theme.ts`)
- `getBaseOrgTheme(isDark)` - Function that returns CDP theme config for light or dark mode
- Uses official Base.org brand colors for both modes
- Dark mode uses Base Cerulean (#3c8aff) as primary color
- Light mode uses Base Blue (#0000ff) as primary color

### 2. Dynamic Theme Provider (`/app/providers.tsx`)
- Listens to `resolvedTheme` from next-themes
- Automatically updates CDP theme when theme changes
- Uses `useMemo` to prevent unnecessary re-renders

### 3. CSS Variables (`/app/globals.css`)
All components use CSS variables that automatically switch based on theme:

**Light Mode:**
- `--background`: #ffffff (white)
- `--foreground`: #0a0b0d (black)
- `--surface`: #eef0f3 (light gray)
- `--text-primary`: #0a0b0d (black)
- `--text-secondary`: #5b616e (gray)

**Dark Mode:**
- `--background`: #0a0b0d (black)
- `--foreground`: #ffffff (white)
- `--surface`: #32353d (dark gray)
- `--text-primary`: #ffffff (white)
- `--text-secondary`: #b1b7c3 (light gray)

### 4. Theme Transition Effect
The matrix rain effect now:
1. Shows falling squares when theme changes
2. Delays the actual theme change by 1 second
3. Creates the illusion that squares are "painting" the new theme

## Components That Respond to Theme

### EmbeddedWallet Components
- `EmbeddedWalletStatus` - Uses CSS variables for colors
- `WalletConnectionCard` - Adapts card styling
- `WalletFlowSteps` - Step indicators match theme

### CDP Components (via theme prop)
- AuthButton
- Input fields
- Select dropdowns
- Links and CTAs
- Modals and overlays

## Color Palette

### Brand Colors (Theme-Independent)
```css
--base-blue: #0000ff
--base-cerulean: #3c8aff
--base-yellow: #ffd12f
--base-green: #66c800
--base-lime-green: #b6f569
--base-red: #fc401f
--base-pink: #fea8cd
--base-tan: #b8a581
```

### Semantic Colors (Theme-Dependent)
```css
--positive: #66c800 (green - same in both modes)
--negative: #fc401f (red - same in both modes)
--warning: #ffd12f (yellow - same in both modes)
```

## Best Practices

### When Creating New Components

1. **Always use CSS variables:**
   ```tsx
   <div style={{ color: 'var(--text-primary)' }}>...</div>
   ```

2. **Or use Tailwind classes that support dark mode:**
   ```tsx
   <div className="text-base-blue dark:text-base-cerulean">...</div>
   ```

3. **For backgrounds:**
   ```tsx
   <div style={{ backgroundColor: 'var(--surface)' }}>...</div>
   ```

4. **For cards/borders:**
   ```tsx
   <div className="card">...</div> // Has built-in theme support
   ```

### Don't Do This:
```tsx
// ❌ Hard-coded colors won't adapt to theme
<div style={{ color: '#0a0b0d' }}>...</div>

// ❌ Direct color without dark mode variant
<div className="bg-white text-black">...</div>
```

### Do This Instead:
```tsx
// ✅ Uses CSS variable
<div style={{ color: 'var(--text-primary)' }}>...</div>

// ✅ Has dark mode support
<div className="bg-white dark:bg-base-gray-100">...</div>
```

## Testing Themes

1. Toggle theme in the header
2. Check that all components adapt correctly
3. Verify the matrix transition effect works
4. Test with system theme (auto light/dark based on OS)

## Troubleshooting

**Problem:** Component doesn't change with theme
- **Solution:** Check if using CSS variables or hard-coded colors

**Problem:** CDP wallet looks wrong
- **Solution:** Verify `providers.tsx` is passing dynamic theme from `getBaseOrgTheme()`

**Problem:** Transition triggers on page load
- **Solution:** Check `ThemeTransition.tsx` has proper `isMounted` state

**Problem:** Hydration errors
- **Solution:** Ensure no inline styles that differ between server/client
