import { Platform } from 'react-native';

export const Type = {
  display: {
    fontFamily: 'System',
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  displayLight: {
    fontFamily: 'System',
    fontWeight: '300' as const,
    letterSpacing: -0.5,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  label: {
    fontFamily: 'System',
    fontWeight: '500' as const,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    fontSize: 12,
    lineHeight: 18,
  },
} as const;
