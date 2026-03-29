export const Fonts = {
  displayFamily: 'BarlowCondensed-Bold',
  displayLightFamily: 'BarlowCondensed-Light',
  displaySemiBoldFamily: 'BarlowCondensed-SemiBold',
  bodyFamily: 'Barlow-Regular',
  bodyMediumFamily: 'Barlow-Medium',
  bodySemiBoldFamily: 'Barlow-SemiBold',
  monoFamily: 'DMMono-Regular',
  monoMediumFamily: 'DMMono-Medium',
} as const;

export const Type = {
  display: {
    fontFamily: Fonts.displayFamily,
    letterSpacing: -0.5,
  },
  displayLight: {
    fontFamily: Fonts.displayLightFamily,
    letterSpacing: -0.5,
  },
  mono: {
    fontFamily: Fonts.monoFamily,
  },
  monoMedium: {
    fontFamily: Fonts.monoMediumFamily,
  },
  label: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 12,
    lineHeight: 18,
  },
} as const;
