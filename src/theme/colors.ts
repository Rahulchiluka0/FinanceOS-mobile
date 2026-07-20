/** Design tokens ported from client/src/index.css */
export const colors = {
  bg: '#e8eef6',
  bgElevated: '#f4f7fb',
  surface: '#ffffff',
  ink: '#0b1220',
  inkSoft: '#334155',
  muted: '#64748b',
  brand: '#1a56db',
  brandHover: '#1546b8',
  brandSoft: '#dce7fb',
  brandGlow: 'rgba(26, 86, 219, 0.2)',
  accent: '#ea580c',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  success: '#0284c7',
  warning: '#d97706',
  border: 'rgba(15, 23, 42, 0.09)',
  borderStrong: 'rgba(15, 23, 42, 0.14)',
  white: '#ffffff',
  authGradientStart: '#0b1220',
  authGradientMid: '#1e3a8a',
  authGradientEnd: '#1a56db',
} as const

export type ColorName = keyof typeof colors
