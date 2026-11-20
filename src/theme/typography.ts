import { Platform } from 'react-native';

export const typography = {
  fontFamily: {
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    regular: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'sans-serif',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }),
    semiBold: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }),
  },
  fontSize: {
    label: 10,
    reassurance: 11,
    xs: 12,
    sub: 13,
    body: 14,
    md: 16,
    lg: 18,
    heading: 43,
  },
} as const;

export type Typography = typeof typography;
