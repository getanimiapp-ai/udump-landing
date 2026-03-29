export const Colors = {
  void: '#06060A',
  base: '#0C0C12',
  surface: '#131318',
  elevated: '#1A1A22',

  glass1: 'rgba(255,255,255,0.03)',
  glass2: 'rgba(255,255,255,0.06)',
  glass3: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glassBorderHi: 'rgba(255,255,255,0.18)',

  gold: '#D4AF37',
  goldBright: '#F0CE60',
  goldDim: 'rgba(212,175,55,0.18)',
  goldGlow: 'rgba(212,175,55,0.08)',

  red: '#FF3B30',
  green: '#30D158',
  blue: '#0A84FF',

  text1: '#FFFFFF',
  text2: 'rgba(255,255,255,0.72)',
  text3: 'rgba(255,255,255,0.42)',
  textGold: '#D4AF37',
} as const;

export const TIER_COLORS = {
  bronze: {
    bg: 'rgba(166,109,77,0.15)',
    border: 'rgba(166,109,77,0.35)',
    text: '#CD7F32',
  },
  silver: {
    bg: 'rgba(168,168,168,0.12)',
    border: 'rgba(168,168,168,0.30)',
    text: '#C0C0C0',
  },
  gold: {
    bg: 'rgba(212,175,55,0.15)',
    border: 'rgba(212,175,55,0.35)',
    text: '#D4AF37',
  },
  platinum: {
    bg: 'rgba(100,180,255,0.12)',
    border: 'rgba(100,180,255,0.30)',
    text: '#64B4FF',
  },
} as const;
