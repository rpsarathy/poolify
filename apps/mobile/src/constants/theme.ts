export const COLORS = {
  // Dark theme base
  background: '#0D0F1A',
  surface: '#161929',
  surfaceLight: '#1E2235',
  card: '#1A1D2E',
  cardBorder: '#2A2D3E',

  // Accent colors
  primary: '#00E5CC',       // Cyan/teal
  primaryDark: '#00BFA8',
  primaryLight: 'rgba(0, 229, 204, 0.12)',
  secondary: '#A855F7',    // Purple
  secondaryLight: 'rgba(168, 85, 247, 0.12)',
  gradient1: '#00E5CC',     // Cyan
  gradient2: '#A855F7',     // Purple

  // Status
  success: '#22C55E',
  successBg: 'rgba(34, 197, 94, 0.15)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  matching: '#A855F7',
  matchingBg: 'rgba(168, 85, 247, 0.15)',

  // Text
  text: '#FFFFFF',
  textSecondary: '#8B8FA3',
  textMuted: '#5A5E72',
  textAccent: '#00E5CC',

  // Others
  border: '#2A2D3E',
  whatsapp: '#25D366',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: '#00E5CC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
