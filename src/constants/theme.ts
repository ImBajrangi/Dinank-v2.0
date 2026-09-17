/**
 * Apple iOS Human Interface Guidelines (HIG) Color System
 * True pure black OLED dark mode, systemGroupedBackgrounds, and Cupertino accents
 */
export const PALETTES = {
  dark: {
    background: '#000000', // Pure iOS OLED black
    surface: '#1C1C1E', // secondarySystemBackground
    surfaceSubtle: '#2C2C2E', // tertiarySystemBackground
    surfaceBorder: 'rgba(255, 255, 255, 0.12)', // iOS separator
    textPrimary: '#FFFFFF', // label
    textSecondary: '#8E8E93', // secondaryLabel
    textMuted: '#636366', // tertiaryLabel
    accent: '#0A84FF', // Apple iOS System Blue
    accentGradient: ['#0A84FF', '#5E5CE6'],
    accentLight: 'rgba(10, 132, 255, 0.15)',
    success: '#30D158', // iOS System Green
    successBg: 'rgba(48, 209, 88, 0.15)',
    warning: '#FF9F0A', // iOS System Orange
    warningBg: 'rgba(255, 159, 10, 0.15)',
    danger: '#FF453A', // iOS System Red
    dangerBg: 'rgba(255, 69, 58, 0.15)',
    card: '#1C1C1E', // Inset grouped cell
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    tabBar: 'rgba(28, 28, 30, 0.95)', // iOS frosted tab bar
    tabBorder: 'rgba(255, 255, 255, 0.15)',
    inputBg: '#2C2C2E', // iOS search bar fill
    chipBg: '#2C2C2E',
  },
  light: {
    background: '#F2F2F7', // systemGroupedBackground
    surface: '#FFFFFF', // systemBackground
    surfaceSubtle: '#E5E5EA', // secondarySystemBackground
    surfaceBorder: 'rgba(60, 60, 67, 0.15)', // iOS separator
    textPrimary: '#000000', // label
    textSecondary: '#6C6C70', // secondaryLabel
    textMuted: '#8E8E93', // tertiaryLabel
    accent: '#007AFF', // Apple iOS System Blue
    accentGradient: ['#007AFF', '#5856D6'],
    accentLight: 'rgba(0, 122, 255, 0.1)',
    success: '#34C759', // iOS System Green
    successBg: 'rgba(52, 199, 89, 0.12)',
    warning: '#FF9500', // iOS System Orange
    warningBg: 'rgba(255, 149, 0, 0.12)',
    danger: '#FF3B30', // iOS System Red
    dangerBg: 'rgba(255, 59, 48, 0.12)',
    card: '#FFFFFF', // Inset grouped cell
    cardBorder: 'rgba(60, 60, 67, 0.1)',
    tabBar: 'rgba(249, 249, 249, 0.95)',
    tabBorder: 'rgba(60, 60, 67, 0.18)',
    inputBg: 'rgba(118, 118, 128, 0.12)', // iOS search bar fill
    chipBg: 'rgba(118, 118, 128, 0.12)',
  }
};

export const RELATIONSHIP_COLORS: Record<string, { bg: string; text: string; label: string; tint: string }> = {
  student: { bg: 'rgba(88, 86, 214, 0.15)', text: '#5856D6', label: 'Student', tint: '#5856D6' },
  family: { bg: 'rgba(255, 149, 0, 0.15)', text: '#FF9500', label: 'Family', tint: '#FF9500' },
  friend: { bg: 'rgba(0, 122, 255, 0.15)', text: '#007AFF', label: 'Friend', tint: '#007AFF' },
  work: { bg: 'rgba(175, 82, 222, 0.15)', text: '#AF52DE', label: 'Work', tint: '#AF52DE' },
  other: { bg: 'rgba(142, 142, 147, 0.15)', text: '#8E8E93', label: 'Other', tint: '#8E8E93' },
};

export const getCategoryStyle = (category: string = 'other'): { bg: string; text: string; label: string; tint: string } => {
  const normalized = (category || 'other').toLowerCase().trim();
  if (RELATIONSHIP_COLORS[normalized]) {
    return RELATIONSHIP_COLORS[normalized];
  }
  const customPalette = [
    { bg: 'rgba(50, 173, 230, 0.15)', text: '#32ADE6', tint: '#32ADE6' },
    { bg: 'rgba(255, 45, 85, 0.15)', text: '#FF2D55', tint: '#FF2D55' },
    { bg: 'rgba(48, 209, 88, 0.15)', text: '#30D158', tint: '#30D158' },
    { bg: 'rgba(162, 132, 94, 0.15)', text: '#A2845E', tint: '#A2845E' },
    { bg: 'rgba(94, 92, 230, 0.15)', text: '#5E5CE6', tint: '#5E5CE6' },
    { bg: 'rgba(255, 159, 10, 0.15)', text: '#FF9F0A', tint: '#FF9F0A' },
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const chosen = customPalette[Math.abs(hash) % customPalette.length];
  return {
    ...chosen,
    label: category.charAt(0).toUpperCase() + category.slice(1),
  };
};

export const AVATAR_COLORS = [
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55',
  '#FF3B30', '#FF9500', '#34C759', '#32ADE6'
];
