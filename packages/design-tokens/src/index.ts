/**
 * Concierge design tokens — single source of truth for colors, type, spacing.
 * Consumed by Vue/Angular apps via JS, by stylesheets via tokens.css / tokens.scss.
 */

export const colors = {
  // Brand
  ink: '#14202e',
  paper: '#f5f0e8',
  paperSoft: '#ede5d6',
  bg: '#faf7f2',
  bgCard: '#ffffff',
  accent: '#b8985a',
  accentDeep: '#8e7138',
  accentSoft: '#d6bd87',

  // Semantic
  success: '#36644a',
  warning: '#95701a',
  danger: '#913528',

  // Text scale
  text: '#14202e',
  textMuted: '#5a6675',
  textSoft: '#97a0ad',
  textFaint: '#b9c0c9',

  // Borders
  border: 'rgba(20,32,46,0.08)',
  borderStrong: 'rgba(20,32,46,0.18)',
} as const;

export const colorsDark = {
  ...colors,
  ink: '#f5f0e8',
  paper: '#1c2a3b',
  paperSoft: '#243349',
  bg: '#0e1722',
  bgCard: '#1a2536',
  text: '#ede5d6',
  textMuted: '#97a0ad',
  textSoft: '#6c7787',
  textFaint: '#4a5567',
  border: 'rgba(245,240,232,0.08)',
  borderStrong: 'rgba(245,240,232,0.18)',
} as const;

export const fonts = {
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
} as const;

export const fontSizes = {
  xs: '11px', sm: '12px', base: '14px', md: '16px',
  lg: '18px', xl: '22px', '2xl': '28px', '3xl': '36px',
  '4xl': '48px', '5xl': '64px',
} as const;

export const space = {
  s1: '4px', s2: '8px', s3: '12px', s4: '16px',
  s5: '20px', s6: '24px', s8: '32px', s10: '40px', s12: '48px', s16: '64px',
} as const;

export const radii = { none: '0', sm: '2px', md: '4px', lg: '8px', xl: '12px', full: '999px' } as const;

export const shadows = {
  xs: '0 1px 2px rgba(20,32,46,0.04)',
  sm: '0 2px 4px rgba(20,32,46,0.06)',
  md: '0 4px 12px rgba(20,32,46,0.08)',
  lg: '0 12px 32px rgba(20,32,46,0.12)',
  xl: '0 24px 64px rgba(20,32,46,0.18)',
} as const;

export const transitions = {
  fast: '0.15s cubic-bezier(0.32, 0.72, 0, 1)',
  base: '0.25s cubic-bezier(0.32, 0.72, 0, 1)',
  slow: '0.45s cubic-bezier(0.32, 0.72, 0, 1)',
} as const;

export const breakpoints = {
  phone: '540px',
  tablet: '900px',
  desktop: '1280px',
  wide: '1600px',
} as const;

export const z = { drawer: 50, modal: 70, toast: 80, screensaver: 8000, fab: 1000 } as const;

export const tokens = { colors, colorsDark, fonts, fontSizes, space, radii, shadows, transitions, breakpoints, z };
export default tokens;
