# Theme System Setup

This app now supports light/dark/system themes using `next-themes`.

## What was added:

1. **next-themes package** - Added to package.json
2. **Updated globals.css** - Added CSS variables for light and dark mode
3. **ThemeProvider** - Created at `/src/components/providers/ThemeProvider.tsx`
4. **ThemeToggle** - Created at `/src/components/ThemeToggle.tsx` (visible in header)
5. **Layout updates** - Updated to use ThemeProvider with system detection

## Installation

Run the following to install the new dependency:

```bash
npm install
```

## Features

- **Light Mode** - Clean white background with Base.org brand colors
- **Dark Mode** - Dark background with adjusted Base.org colors for contrast
- **System Mode** - Automatically follows OS theme preference
- **No Flash** - Uses `suppressHydrationWarning` to prevent theme flash on load
- **Persistent** - Theme preference is saved in localStorage

## Theme Toggle Location

- **Desktop**: In the header next to the network status and wallet
- **Mobile**: In the mobile menu dropdown

## CSS Variables

The theme system uses CSS variables that automatically update based on the selected theme:

- `--background` - Main background color
- `--foreground` - Main text color
- `--card` - Card background
- `--card-border` - Card border color
- `--input-bg` - Input background
- `--input-border` - Input border color
- `--text-primary` - Primary text color
- `--text-secondary` - Secondary text color
- `--text-muted` - Muted text color
- `--surface` - Surface color for buttons/panels
- `--surface-hover` - Hover state for surfaces

## Usage in Components

Use CSS variables for theme-aware colors:

```tsx
// Inline styles
<div style={{ color: 'var(--text-primary)', backgroundColor: 'var(--background)' }}>
  Content
</div>

// Or use the CSS classes defined in globals.css
<div className="card">
  <p className="text-readable">This text adapts to theme</p>
</div>
```

## Tailwind Classes

The Base.org brand colors remain available as Tailwind classes:
- `text-base-blue`, `bg-base-blue`, etc.
- Dark mode variants automatically apply where needed

## Components Updated

- Layout (integrated ThemeProvider)
- Header (added ThemeToggle and theme-aware styles)
- globals.css (added dark mode support)

All existing Base.org brand colors are preserved and work in both themes!
