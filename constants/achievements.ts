export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  secret: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: 'FIRST_BLOOD',
    title: 'First Blood',
    description: 'Complete your first logged session.',
    icon: '🩸',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'THRONE_CLAIMED',
    title: 'Throne Claimed',
    description: 'Claim your first throne away from home.',
    icon: '👑',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'DETHRONED',
    title: 'The Usurper',
    description: 'Take a throne from a friend. Friendship is secondary.',
    icon: '⚔️',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'BOBBY_MOMENT',
    title: 'The Bobby',
    description: 'Get dethroned on your own home toilet.',
    icon: '😔',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'POUND_CLUB',
    title: '1 lb Club',
    description: 'Log a single session over 1 pound.',
    icon: '💪',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'TWO_POUND_CLUB',
    title: '2 lb Club',
    description: '2 lbs in a single session. We respect this.',
    icon: '🏋️',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'THREE_POUND_CLUB',
    title: '3 lb Club',
    description: "Three pounds. We don't have questions. We have concerns.",
    icon: '🤯',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'NICK_TERRITORY',
    title: 'Nick Territory',
    description: 'Log over 4 lbs in a single session. Nick set this record. Be Nick.',
    icon: '🏆',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'STREAK_7',
    title: 'Week Warrior',
    description: '7-day logging streak. Consistency is a lifestyle.',
    icon: '🔥',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'STREAK_30',
    title: 'Monthly Menace',
    description: '30-day logging streak. You need this more than we do.',
    icon: '📅',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'MEDICAL_HELP',
    title: 'Better Safe Than Sorry',
    description: "Press the Medical Help button. We hope you're okay.",
    icon: '🚑',
    tier: 'bronze',
    secret: true,
  },
  {
    key: 'HOUR_CLUB',
    title: 'The Garret',
    description: 'Spend over 60 minutes in a single session. Your friends were notified.',
    icon: '⏱️',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'TWO_HOURS',
    title: 'Emergency Protocol',
    description: "2 hours. Emergency contacts alerted. We're glad you survived.",
    icon: '🆘',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'GLOBAL_RANK_1',
    title: 'Hall of Stench',
    description: 'Reach #1 on the global leaderboard. You have peaked as a human.',
    icon: '🌍',
    tier: 'platinum',
    secret: false,
  },
  {
    key: 'DUMPOLOGIST',
    title: 'Certified Dumpologist',
    description: 'Complete 100 logged sessions.',
    icon: '🎓',
    tier: 'platinum',
    secret: false,
  },
  {
    key: 'DUMP_SCORE_10',
    title: 'Perfect Form',
    description: 'Achieve a Dump Score™ of 10.0.',
    icon: '💎',
    tier: 'platinum',
    secret: true,
  },
  {
    key: 'TRAVEL_THRONE',
    title: 'Globetrotter',
    description: 'Claim a throne more than 100 miles from home.',
    icon: '✈️',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'SPEED_RUN',
    title: 'Speedrunner',
    description: 'Complete a session in under 5 minutes with over 1 lb logged. Impressive.',
    icon: '⚡',
    tier: 'gold',
    secret: true,
  },
  {
    key: 'MORNING_PERSON',
    title: 'Morning Constitutional',
    description: 'Log a session before 7am. The early throne gets the crown.',
    icon: '🌅',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'MIDNIGHT_THRONE',
    title: 'Midnight Rider',
    description: 'Log a session after midnight. We have no comment.',
    icon: '🌙',
    tier: 'bronze',
    secret: true,
  },
];

export const NOTIFICATION_COPY = {
  record_broken: {
    title: 'NEW PERSONAL RECORD',
    body: (name: string, lbs: number) => `${name} — ${lbs} lbs. The people have been informed.`,
  },
  throne_claimed: {
    title: 'THRONE CLAIMED 👑',
    body: (name: string, location: string, lbs: number, mins: number) =>
      `${name} is now King of ${location}. ${lbs} lbs · ${mins} min`,
  },
  throne_lost: {
    title: 'YOUR THRONE HAS FALLEN',
    body: (friend: string, location: string) =>
      `${friend} dethroned you at ${location}. Reclaim it.`,
  },
  overstay_60: {
    title: 'HELP!',
    body: (name: string) => `${name} has exceeded 60 minutes on the toilet.`,
  },
  overstay_120: {
    title: 'MEDICAL ATTENTION MAY BE REQUIRED',
    body: (name: string) => `${name} has been on the toilet for 2 hours. Please respond.`,
  },
  friend_active: {
    title: (name: string) => `👑 ${name} is on the throne`,
    body: (location: string, mins: number) => `Live at ${location} · ${mins} min elapsed`,
  },
  streak_milestone: {
    title: (days: number) => `STREAK: ${days} DAYS`,
    body: () => 'Consistency is the foundation of greatness.',
  },
} as const;
