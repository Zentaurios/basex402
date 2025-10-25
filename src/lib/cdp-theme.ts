// CDP Wallet Theme Configuration matching Base.org official brand colors
// This function generates the theme based on the current mode (light/dark)

export function getBaseOrgTheme(isDark: boolean = false) {
  if (isDark) {
    // Dark mode theme
    return {
      // Semantic Tokens - Core theme variables using official Base brand colors
      'colors-bg-default': '#0a0b0d', // Gray 100
      'colors-bg-alternate': '#32353d', // Gray 80
      'colors-bg-contrast': '#ffffff', // White
      'colors-bg-overlay': 'rgba(50, 53, 61, 0.33)', // Gray 80 with opacity
      'colors-bg-skeleton': 'rgba(255, 255, 255, 0.1)', // White with opacity
      'colors-bg-primary': '#3c8aff', // Base Cerulean (better for dark mode)
      'colors-bg-secondary': '#32353d', // Gray 80

      // Text colors
      'colors-fg-default': '#ffffff', // White
      'colors-fg-muted': '#b1b7c3', // Gray 30
      'colors-fg-primary': '#3c8aff', // Base Cerulean
      'colors-fg-onPrimary': '#ffffff', // White
      'colors-fg-onSecondary': '#ffffff', // White
      'colors-fg-positive': '#66c800', // Official Base Green
      'colors-fg-negative': '#fc401f', // Official Base Red
      'colors-fg-warning': '#ffd12f', // Official Base Yellow

      // Border colors
      'colors-line-default': '#5b616e', // Gray 60
      'colors-line-heavy': '#717886', // Gray 50
      'colors-line-primary': '#3c8aff', // Base Cerulean
      'colors-line-positive': '#66c800', // Official Base Green
      'colors-line-negative': '#fc401f', // Official Base Red

      // Typography
      'font-family-sans': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      'font-family-mono': '"JetBrains Mono", "DM Mono", monospace',
      'font-size-base': '16',

      // Component-specific overrides
      
      // Page
      'page-bg-default': '#0a0b0d', // Gray 100
      'page-border-default': '#5b616e', // Gray 60
      'page-text-default': '#ffffff', // White
      'page-text-muted': '#b1b7c3', // Gray 30

      // Primary CTA
      'cta-primary-bg-default': '#3c8aff', // Base Cerulean
      'cta-primary-bg-hover': '#0000ff', // Base Blue for hover
      'cta-primary-bg-pressed': '#0046e6', // Darker blue
      'cta-primary-border-focus': '#3c8aff', // Base Cerulean
      'cta-primary-text-default': '#ffffff', // White
      'cta-primary-text-hover': '#ffffff', // White

      // Secondary CTA
      'cta-secondary-bg-default': '#32353d', // Gray 80
      'cta-secondary-bg-hover': '#5b616e', // Gray 60
      'cta-secondary-bg-pressed': '#717886', // Gray 50
      'cta-secondary-border-focus': '#3c8aff', // Base Cerulean
      'cta-secondary-text-default': '#ffffff', // White
      'cta-secondary-text-hover': '#ffffff', // White

      // Links
      'link-primary-text-default': '#3c8aff', // Base Cerulean
      'link-primary-text-hover': '#0000ff', // Base Blue
      'link-primary-text-pressed': '#0046e6', // Darker blue
      'link-secondary-text-default': '#ffffff', // White
      'link-secondary-text-hover': '#3c8aff', // Base Cerulean
      'link-secondary-text-pressed': '#0046e6', // Darker blue

      // Inputs
      'input-bg-default': '#32353d', // Gray 80
      'input-border-default': '#5b616e', // Gray 60
      'input-border-focus': '#3c8aff', // Base Cerulean
      'input-border-error': '#fc401f', // Official Base Red
      'input-border-success': '#66c800', // Official Base Green
      'input-label-default': '#ffffff', // White
      'input-placeholder-default': '#b1b7c3', // Gray 30
      'input-text-default': '#ffffff', // White
      'input-errorText-default': '#fc401f', // Official Base Red
      'input-successText-default': '#66c800', // Official Base Green

      // Select components
      'select-label-default': '#ffffff', // White
      'select-trigger-bg-default': '#32353d', // Gray 80
      'select-trigger-bg-hover': '#5b616e', // Gray 60
      'select-trigger-bg-pressed': '#717886', // Gray 50
      'select-trigger-border-default': '#5b616e', // Gray 60
      'select-trigger-border-focus': '#3c8aff', // Base Cerulean
      'select-trigger-border-error': '#fc401f', // Official Base Red
      'select-trigger-border-success': '#66c800', // Official Base Green
      'select-trigger-placeholder-default': '#b1b7c3', // Gray 30
      'select-trigger-text-default': '#ffffff', // White
      'select-trigger-errorText-default': '#fc401f', // Official Base Red
      'select-trigger-successText-default': '#66c800', // Official Base Green
      'select-list-bg-default': '#32353d', // Gray 80
      'select-list-border-default': '#5b616e', // Gray 60
      'select-list-border-focus': '#3c8aff', // Base Cerulean
      'select-list-border-error': '#fc401f', // Official Base Red
      'select-list-border-success': '#66c800', // Official Base Green
      'select-list-item-bg-default': '#32353d', // Gray 80
      'select-list-item-bg-highlight': '#5b616e', // Gray 60
      'select-list-item-text-default': '#ffffff', // White
      'select-list-item-text-muted': '#b1b7c3', // Gray 30
      'select-list-item-text-onHighlight': '#ffffff', // White
      'select-list-item-text-mutedOnHighlight': '#b1b7c3', // Gray 30

      // Code blocks
      'code-bg-default': '#32353d', // Gray 80
      'code-border-default': '#5b616e', // Gray 60
      'code-text-default': '#ffffff', // White
    };
  }

  // Light mode theme (default)
  return {
    // Semantic Tokens - Core theme variables using official Base brand colors
    'colors-bg-default': '#ffffff', // Gray 0
    'colors-bg-alternate': '#eef0f3', // Gray 10
    'colors-bg-contrast': '#0a0b0d', // Gray 100
    'colors-bg-overlay': 'rgba(238, 240, 243, 0.33)', // Gray 10 with opacity
    'colors-bg-skeleton': 'rgba(10, 11, 13, 0.1)', // Gray 100 with opacity
    'colors-bg-primary': '#0000ff', // Official Base Blue
    'colors-bg-secondary': '#eef0f3', // Gray 10

    // Text colors
    'colors-fg-default': '#0a0b0d', // Gray 100
    'colors-fg-muted': '#5b616e', // Gray 60
    'colors-fg-primary': '#0000ff', // Official Base Blue
    'colors-fg-onPrimary': '#ffffff', // Gray 0
    'colors-fg-onSecondary': '#0a0b0d', // Gray 100
    'colors-fg-positive': '#66c800', // Official Base Green
    'colors-fg-negative': '#fc401f', // Official Base Red
    'colors-fg-warning': '#ffd12f', // Official Base Yellow

    // Border colors
    'colors-line-default': '#dee1e7', // Gray 15
    'colors-line-heavy': '#b1b7c3', // Gray 30
    'colors-line-primary': '#0000ff', // Official Base Blue
    'colors-line-positive': '#66c800', // Official Base Green
    'colors-line-negative': '#fc401f', // Official Base Red

    // Typography
    'font-family-sans': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    'font-family-mono': '"JetBrains Mono", "DM Mono", monospace',
    'font-size-base': '16',

    // Component-specific overrides for better Base.org integration
    
    // Page
    'page-bg-default': '#ffffff', // Gray 0
    'page-border-default': '#dee1e7', // Gray 15
    'page-text-default': '#0a0b0d', // Gray 100
    'page-text-muted': '#5b616e', // Gray 60

    // Primary CTA (Call to Action)
    'cta-primary-bg-default': '#0000ff', // Official Base Blue
    'cta-primary-bg-hover': '#3c8aff', // Base Cerulean for hover
    'cta-primary-bg-pressed': '#0046e6', // Darker blue for pressed state
    'cta-primary-border-focus': '#0000ff', // Official Base Blue
    'cta-primary-text-default': '#ffffff', // Gray 0
    'cta-primary-text-hover': '#ffffff', // Gray 0

    // Secondary CTA
    'cta-secondary-bg-default': '#eef0f3', // Gray 10
    'cta-secondary-bg-hover': '#dee1e7', // Gray 15
    'cta-secondary-bg-pressed': '#b1b7c3', // Gray 30
    'cta-secondary-border-focus': '#0000ff', // Official Base Blue
    'cta-secondary-text-default': '#0a0b0d', // Gray 100
    'cta-secondary-text-hover': '#0a0b0d', // Gray 100

    // Links
    'link-primary-text-default': '#0000ff', // Official Base Blue
    'link-primary-text-hover': '#3c8aff', // Base Cerulean
    'link-primary-text-pressed': '#0046e6', // Darker blue
    'link-secondary-text-default': '#0a0b0d', // Gray 100
    'link-secondary-text-hover': '#3c8aff', // Base Cerulean
    'link-secondary-text-pressed': '#0046e6', // Darker blue

    // Inputs
    'input-bg-default': '#ffffff', // Gray 0
    'input-border-default': '#b1b7c3', // Gray 30
    'input-border-focus': '#0000ff', // Official Base Blue
    'input-border-error': '#fc401f', // Official Base Red
    'input-border-success': '#66c800', // Official Base Green
    'input-label-default': '#0a0b0d', // Gray 100
    'input-placeholder-default': '#5b616e', // Gray 60
    'input-text-default': '#0a0b0d', // Gray 100
    'input-errorText-default': '#fc401f', // Official Base Red
    'input-successText-default': '#66c800', // Official Base Green

    // Select components
    'select-label-default': '#0a0b0d', // Gray 100
    'select-trigger-bg-default': '#ffffff', // Gray 0
    'select-trigger-bg-hover': '#eef0f3', // Gray 10
    'select-trigger-bg-pressed': '#dee1e7', // Gray 15
    'select-trigger-border-default': '#dee1e7', // Gray 15
    'select-trigger-border-focus': '#0000ff', // Official Base Blue
    'select-trigger-border-error': '#fc401f', // Official Base Red
    'select-trigger-border-success': '#66c800', // Official Base Green
    'select-trigger-placeholder-default': '#5b616e', // Gray 60
    'select-trigger-text-default': '#0a0b0d', // Gray 100
    'select-trigger-errorText-default': '#fc401f', // Official Base Red
    'select-trigger-successText-default': '#66c800', // Official Base Green
    'select-list-bg-default': '#ffffff', // Gray 0
    'select-list-border-default': '#dee1e7', // Gray 15
    'select-list-border-focus': '#0000ff', // Official Base Blue
    'select-list-border-error': '#fc401f', // Official Base Red
    'select-list-border-success': '#66c800', // Official Base Green
    'select-list-item-bg-default': '#ffffff', // Gray 0
    'select-list-item-bg-highlight': '#eef0f3', // Gray 10
    'select-list-item-text-default': '#0a0b0d', // Gray 100
    'select-list-item-text-muted': '#5b616e', // Gray 60
    'select-list-item-text-onHighlight': '#0a0b0d', // Gray 100
    'select-list-item-text-mutedOnHighlight': '#5b616e', // Gray 60

    // Code blocks
    'code-bg-default': '#eef0f3', // Gray 10
    'code-border-default': '#b1b7c3', // Gray 30
    'code-text-default': '#0a0b0d', // Gray 100
  };
}

// Export default light theme for backward compatibility
export const baseOrgTheme = getBaseOrgTheme(false);
