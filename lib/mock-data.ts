// Mock data for development — shows what the app looks like fully populated
// Remove this file before production launch

export const MOCK_ENABLED = false; // flip to true for local-only mock data

export const MOCK_PROFILE = {
  id: 'mock-aaron',
  username: 'aaron_dumps',
  display_name: 'Aaron',
  avatar_url: null,
  dump_score: 9.2,
  streak_days: 14,
  last_session_at: new Date(Date.now() - 3600000).toISOString(),
  total_sessions: 847,
  total_weight_lbs: 412.6,
};

export const MOCK_TODAY_STATS = {
  sessionCount: 2,
  totalWeight: 4.4,
  streakDays: 14,
};

export const MOCK_LAST_SESSION = {
  id: 'mock-session-1',
  ended_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  duration_seconds: 2700, // 45 min
  weight_delta_lbs: 2.4,
  is_personal_record: false,
};

export const MOCK_FEED_ITEMS = [
  {
    id: '1',
    type: 'record' as const,
    userId: 'mock-nick',
    username: 'nick_throne',
    displayName: 'Nick',
    avatarUrl: null,
    durationSeconds: 960,
    weightDelta: 4.1,
    throneName: null,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '2',
    type: 'throne_claimed' as const,
    userId: 'mock-aaron',
    username: 'aaron_dumps',
    displayName: 'Aaron',
    avatarUrl: null,
    durationSeconds: 3180,
    weightDelta: 3.1,
    throneName: "Bobby's Throne",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    type: 'overstay' as const,
    userId: 'mock-garret',
    username: 'garret_g',
    displayName: 'Garret',
    avatarUrl: null,
    durationSeconds: 7200,
    weightDelta: null,
    throneName: null,
    createdAt: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: '4',
    type: 'session' as const,
    userId: 'mock-jake',
    username: 'jake_j',
    displayName: 'Jake',
    avatarUrl: null,
    durationSeconds: 1440,
    weightDelta: 2.0,
    throneName: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '5',
    type: 'session' as const,
    userId: 'mock-shelden',
    username: 'shelden_s',
    displayName: 'Shelden',
    avatarUrl: null,
    durationSeconds: 600,
    weightDelta: 1.8,
    throneName: null,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

export const MOCK_LEADERBOARD = [
  { rank: 1, userId: 'mock-nick', username: 'nick_throne', displayName: 'Nick', avatarUrl: null, totalWeightLbs: 523.4, dumpScore: 9.6, isSelf: false },
  { rank: 2, userId: 'mock-aaron', username: 'aaron_dumps', displayName: 'Aaron', avatarUrl: null, totalWeightLbs: 412.6, dumpScore: 9.2, isSelf: true },
  { rank: 3, userId: 'mock-garret', username: 'garret_g', displayName: 'Garret', avatarUrl: null, totalWeightLbs: 389.1, dumpScore: 8.4, isSelf: false },
  { rank: 4, userId: 'mock-jake', username: 'jake_j', displayName: 'Jake', avatarUrl: null, totalWeightLbs: 301.7, dumpScore: 7.1, isSelf: false },
  { rank: 5, userId: 'mock-shelden', username: 'shelden_s', displayName: 'Shelden', avatarUrl: null, totalWeightLbs: 278.9, dumpScore: 6.8, isSelf: false },
  { rank: 6, userId: 'mock-bobby', username: 'bobby_b', displayName: 'Bobby', avatarUrl: null, totalWeightLbs: 45.2, dumpScore: 1.3, isSelf: false },
];

export const MOCK_DUMP_SCORE = {
  overall: 9.2,
  percentile: 94,
  factors: {
    consistency: 8.8,
    weightTrend: 9.5,
    sessionLength: 8.2,
    throneActivity: 9.8,
  },
  insight: "Elite-tier performance. Your consistency and throne dominance put you in the top 6% globally. The crown sits heavy, but you wear it well.",
};

export const MOCK_SESSION_LOG = [
  {
    id: 'mock-s1',
    started_at: new Date(Date.now() - 7200000).toISOString(),
    duration_seconds: 2700,
    weight_delta_lbs: 2.4,
    is_personal_record: false,
    throne_claimed: false,
  },
  {
    id: 'mock-s2',
    started_at: new Date(Date.now() - 86400000).toISOString(),
    duration_seconds: 1800,
    weight_delta_lbs: 3.1,
    is_personal_record: true,
    throne_claimed: true,
  },
  {
    id: 'mock-s3',
    started_at: new Date(Date.now() - 172800000).toISOString(),
    duration_seconds: 900,
    weight_delta_lbs: 1.7,
    is_personal_record: false,
    throne_claimed: false,
  },
  {
    id: 'mock-s4',
    started_at: new Date(Date.now() - 259200000).toISOString(),
    duration_seconds: 1800,
    weight_delta_lbs: 4.1,
    is_personal_record: true,
    throne_claimed: true,
  },
  {
    id: 'mock-s5',
    started_at: new Date(Date.now() - 345600000).toISOString(),
    duration_seconds: 900,
    weight_delta_lbs: 2.2,
    is_personal_record: false,
    throne_claimed: false,
  },
  {
    id: 'mock-s6',
    started_at: new Date(Date.now() - 432000000).toISOString(),
    duration_seconds: 1200,
    weight_delta_lbs: 1.9,
    is_personal_record: false,
    throne_claimed: false,
  },
  {
    id: 'mock-s7',
    started_at: new Date(Date.now() - 518400000).toISOString(),
    duration_seconds: 2100,
    weight_delta_lbs: 2.8,
    is_personal_record: false,
    throne_claimed: true,
  },
  {
    id: 'mock-s8',
    started_at: new Date(Date.now() - 604800000).toISOString(),
    duration_seconds: 600,
    weight_delta_lbs: 1.4,
    is_personal_record: false,
    throne_claimed: false,
  },
];

export const MOCK_ACHIEVEMENTS = [
  { achievement_key: 'FIRST_BLOOD', unlocked_at: new Date(Date.now() - 86400000 * 30).toISOString() },
  { achievement_key: 'THRONE_CLAIMED', unlocked_at: new Date(Date.now() - 86400000 * 14).toISOString() },
  { achievement_key: 'THREE_POUND_CLUB', unlocked_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { achievement_key: 'STREAK_7', unlocked_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { achievement_key: 'NICK_TERRITORY', unlocked_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { achievement_key: 'MORNING_PERSON', unlocked_at: new Date(Date.now() - 86400000 * 10).toISOString() },
  { achievement_key: 'POUND_CLUB', unlocked_at: new Date(Date.now() - 86400000 * 28).toISOString() },
  { achievement_key: 'TWO_POUND_CLUB', unlocked_at: new Date(Date.now() - 86400000 * 20).toISOString() },
];

export const MOCK_FRIENDS = [
  {
    friend_id: 'mock-nick',
    profiles: { id: 'mock-nick', username: 'nick_throne', display_name: 'Nick', avatar_url: null, dump_score: 9.6, total_sessions: 912 },
  },
  {
    friend_id: 'mock-garret',
    profiles: { id: 'mock-garret', username: 'garret_g', display_name: 'Garret', avatar_url: null, dump_score: 8.4, total_sessions: 645 },
  },
  {
    friend_id: 'mock-jake',
    profiles: { id: 'mock-jake', username: 'jake_j', display_name: 'Jake', avatar_url: null, dump_score: 7.1, total_sessions: 423 },
  },
  {
    friend_id: 'mock-shelden',
    profiles: { id: 'mock-shelden', username: 'shelden_s', display_name: 'Shelden', avatar_url: null, dump_score: 6.8, total_sessions: 381 },
  },
  {
    friend_id: 'mock-bobby',
    profiles: { id: 'mock-bobby', username: 'bobby_b', display_name: 'Bobby', avatar_url: null, dump_score: 1.3, total_sessions: 12 },
  },
];

export const MOCK_THRONES = [
  {
    id: 'mock-t1',
    name: "Aaron's Home Throne",
    owner_user_id: 'mock-aaron',
    current_king_id: 'mock-aaron',
    current_king_weight_lbs: 3.1,
    lat: 39.7684,
    lng: -86.1581,
    is_home: true,
    kingUsername: 'aaron_dumps',
    ownerUsername: 'aaron_dumps',
  },
  {
    id: 'mock-t2',
    name: "Bobby's Throne",
    owner_user_id: 'mock-bobby',
    current_king_id: 'mock-aaron',
    current_king_weight_lbs: 3.1,
    lat: 39.7720,
    lng: -86.1600,
    is_home: false,
    kingUsername: 'aaron_dumps',
    ownerUsername: 'bobby_b',
  },
  {
    id: 'mock-t3',
    name: "Nick's Fortress",
    owner_user_id: 'mock-nick',
    current_king_id: 'mock-nick',
    current_king_weight_lbs: 4.1,
    lat: 39.7650,
    lng: -86.1550,
    is_home: false,
    kingUsername: 'nick_throne',
    ownerUsername: 'nick_throne',
  },
  {
    id: 'mock-t4',
    name: "The Office",
    owner_user_id: 'mock-garret',
    current_king_id: 'mock-garret',
    current_king_weight_lbs: 2.8,
    lat: 39.7700,
    lng: -86.1520,
    is_home: false,
    kingUsername: 'garret_g',
    ownerUsername: 'garret_g',
  },
];
