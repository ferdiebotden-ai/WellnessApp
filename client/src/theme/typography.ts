export const typography = {
  heading: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  subheading: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  body: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
};

export type Typography = typeof typography;
