export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type IconSet = 'ionicons' | 'mci';

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  iconSet: IconSet;
  tier: AchievementTier;
  secret: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: 'FIRST_BLOOD',
    title: 'First Blood',
    description: 'Complete your first logged session.',
    icon: 'water',
    iconSet: 'mci',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'THRONE_CLAIMED',
    title: 'Throne Claimed',
    description: 'Claim your first throne away from home.',
    icon: 'crown',
    iconSet: 'mci',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'DETHRONED',
    title: 'The Usurper',
    description: 'Take a throne from a friend. Friendship is secondary.',
    icon: 'sword-cross',
    iconSet: 'mci',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'BOBBY_MOMENT',
    title: 'The Bobby',
    description: 'Get dethroned on your own home toilet.',
    icon: 'emoticon-sad-outline',
    iconSet: 'mci',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'POUND_CLUB',
    title: '1 lb Club',
    description: 'Log a single session over 1 pound.',
    icon: 'arm-flex-outline',
    iconSet: 'mci',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'TWO_POUND_CLUB',
    title: '2 lb Club',
    description: '2 lbs in a single session. We respect this.',
    icon: 'weight-lifter',
    iconSet: 'mci',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'THREE_POUND_CLUB',
    title: '3 lb Club',
    description: "Three pounds. We don't have questions. We have concerns.",
    icon: 'head-alert-outline',
    iconSet: 'mci',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'NICK_TERRITORY',
    title: 'Nick Territory',
    description: 'Log over 4 lbs in a single session. Nick set this record. Be Nick.',
    icon: 'trophy',
    iconSet: 'ionicons',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'STREAK_7',
    title: 'Week Warrior',
    description: '7-day logging streak. Consistency is a lifestyle.',
    icon: 'flame',
    iconSet: 'ionicons',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'STREAK_30',
    title: 'Monthly Menace',
    description: '30-day logging streak. You need this more than we do.',
    icon: 'calendar',
    iconSet: 'ionicons',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'MEDICAL_HELP',
    title: 'Better Safe Than Sorry',
    description: "Press the Medical Help button. We hope you're okay.",
    icon: 'medkit',
    iconSet: 'ionicons',
    tier: 'bronze',
    secret: true,
  },
  {
    key: 'HOUR_CLUB',
    title: 'The Garret',
    description: 'Spend over 60 minutes in a single session. Your friends were notified.',
    icon: 'timer-outline',
    iconSet: 'ionicons',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'TWO_HOURS',
    title: 'Emergency Protocol',
    description: "2 hours. Emergency contacts alerted. We're glad you survived.",
    icon: 'alert-circle',
    iconSet: 'ionicons',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'GLOBAL_RANK_1',
    title: 'Hall of Stench',
    description: 'Reach #1 on the global leaderboard. You have peaked as a human.',
    icon: 'earth',
    iconSet: 'mci',
    tier: 'platinum',
    secret: false,
  },
  {
    key: 'DUMPOLOGIST',
    title: 'Certified Dumpologist',
    description: 'Complete 100 logged sessions.',
    icon: 'school',
    iconSet: 'mci',
    tier: 'platinum',
    secret: false,
  },
  {
    key: 'DUMP_SCORE_10',
    title: 'Perfect Form',
    description: 'Achieve a Dump Score™ of 10.0.',
    icon: 'diamond-stone',
    iconSet: 'mci',
    tier: 'platinum',
    secret: true,
  },
  {
    key: 'TRAVEL_THRONE',
    title: 'Globetrotter',
    description: 'Claim a throne more than 100 miles from home.',
    icon: 'airplane',
    iconSet: 'ionicons',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'SPEED_RUN',
    title: 'Speedrunner',
    description: 'Complete a session in under 5 minutes with over 1 lb logged. Impressive.',
    icon: 'flash',
    iconSet: 'ionicons',
    tier: 'gold',
    secret: true,
  },
  {
    key: 'MORNING_PERSON',
    title: 'Morning Constitutional',
    description: 'Log a session before 7am. The early throne gets the crown.',
    icon: 'weather-sunset-up',
    iconSet: 'mci',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'MIDNIGHT_THRONE',
    title: 'Midnight Rider',
    description: 'Log a session after midnight. We have no comment.',
    icon: 'moon-waning-crescent',
    iconSet: 'mci',
    tier: 'bronze',
    secret: true,
  },
  {
    key: 'FIRST_CLOG',
    title: 'The Incident',
    description: 'Clog a toilet for the first time. It happens to everyone. But mostly you.',
    icon: 'pipe-wrench',
    iconSet: 'mci',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'CLOG_AWAY',
    title: 'War Crime',
    description: "Clog someone else's toilet. This is an act of disrespect that cannot be undone. Their toilet. Their home. Your legacy.",
    icon: 'biohazard',
    iconSet: 'mci',
    tier: 'platinum',
    secret: false,
  },
  {
    key: 'SERIAL_CLOGGER',
    title: 'Serial Clogger',
    description: 'Clog 5 toilets. At this point, the toilets fear you.',
    icon: 'alarm-light-outline',
    iconSet: 'mci',
    tier: 'gold',
    secret: true,
  },
];

export const NOTIFICATION_COPY = {
  record_broken: {
    title: 'NEW PERSONAL RECORD',
    body: (name: string, lbs: number) => `${name} — ${lbs} lbs. The people have been informed.`,
  },
  throne_claimed: {
    title: 'THRONE CLAIMED',
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
    title: (name: string) => `${name} is on the throne`,
    body: (location: string, mins: number) => `Live at ${location} · ${mins} min elapsed`,
  },
  streak_milestone: {
    title: (days: number) => `STREAK: ${days} DAYS`,
    body: () => 'Consistency is the foundation of greatness.',
  },
  challenger_nearby: {
    title: 'CHALLENGER APPROACHING',
    body: (name: string, location: string) =>
      `${name} is active near ${location}. Your territory is at risk. Defend the throne.`,
  },
  throne_under_attack: {
    title: 'YOUR THRONE IS UNDER ATTACK',
    body: (attacker: string, throne: string) =>
      `${attacker} is attempting to claim ${throne}. Their session is LIVE. Get to the throne NOW.`,
  },
  territory_invaded: {
    title: 'TERRITORY INVADED',
    body: (invader: string, zone: string) =>
      `${invader} has entered ${zone} and started a session. This is an act of war.`,
  },
  revenge_available: {
    title: 'REVENGE OPPORTUNITY',
    body: (rival: string, throne: string) =>
      `${rival} who took ${throne} from you is nearby. This is your chance. Reclaim what is yours.`,
  },
  clog_own: {
    title: 'CLOG REPORTED',
    body: (name: string) =>
      `${name} clogged their own toilet. Thoughts and prayers.`,
  },
  clog_away: {
    title: 'TOILET DESTROYED',
    body: (name: string, location: string) =>
      `${name} clogged the toilet at ${location}. This is not a drill. The disrespect is immeasurable.`,
  },
  clog_victim: {
    title: 'YOUR TOILET HAS BEEN CLOGGED',
    body: (perpetrator: string) =>
      `${perpetrator} clogged your toilet. There are no words. Only a plunger and what remains of your dignity.`,
  },
} as const;
