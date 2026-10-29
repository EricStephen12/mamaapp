import { Platform } from 'react-native';

export const typography = {
  fontFamily: {
    serif: Platform.select({
      ios: 'CormorantGaramond-Medium',
      android: 'serif',
      default: 'serif',
    }),
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
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
