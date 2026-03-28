import { supabase } from '../supabase';

export interface SessionForAchievements {
  id: string;
  user_id: string;
  started_at: string;
  duration_seconds: number;
  weight_delta_lbs: number | null;
  throne_claimed: boolean;
}

export interface UserStats {
  totalSessions: number;
  streakDays: number;
}

async function getUnlockedKeys(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('user_achievements')
    .select('achievement_key')
    .eq('user_id', userId);

  return new Set((data ?? []).map((r) => r.achievement_key as string));
}

export async function checkAndUnlockAchievements(
  session: SessionForAchievements,
  userStats: UserStats,
): Promise<string[]> {
  const { user_id: userId } = session;
  const toUnlock: string[] = [];

  const durationMins = session.duration_seconds / 60;
  const weight = session.weight_delta_lbs ?? 0;
  const hour = new Date(session.started_at).getHours();

  // Session count milestones
  if (userStats.totalSessions === 1) toUnlock.push('FIRST_BLOOD');
  if (userStats.totalSessions >= 100) toUnlock.push('DUMPOLOGIST');

  // Weight clubs
  if (weight >= 1) toUnlock.push('POUND_CLUB');
  if (weight >= 2) toUnlock.push('TWO_POUND_CLUB');
  if (weight >= 3) toUnlock.push('THREE_POUND_CLUB');
  if (weight >= 4) toUnlock.push('NICK_TERRITORY');

  // Duration achievements
  if (durationMins >= 60) toUnlock.push('HOUR_CLUB');
  if (durationMins >= 120) toUnlock.push('TWO_HOURS');

  // Speed run: < 5 min AND > 1 lb
  if (durationMins < 5 && weight >= 1) toUnlock.push('SPEED_RUN');

  // Streak milestones
  if (userStats.streakDays >= 7) toUnlock.push('STREAK_7');
  if (userStats.streakDays >= 30) toUnlock.push('STREAK_30');

  // Throne
  if (session.throne_claimed) toUnlock.push('THRONE_CLAIMED');

  // Time of day
  if (hour < 7) toUnlock.push('MORNING_PERSON');
  if (hour >= 0 && hour < 4) toUnlock.push('MIDNIGHT_THRONE');

  // Filter already-unlocked
  const alreadyUnlocked = await getUnlockedKeys(userId);
  const newUnlocks = toUnlock.filter((k) => !alreadyUnlocked.has(k));

  if (newUnlocks.length === 0) return [];

  // Save to Supabase
  const rows = newUnlocks.map((key) => ({
    user_id: userId,
    achievement_key: key,
    session_id: session.id,
  }));

  await supabase.from('user_achievements').insert(rows);

  return newUnlocks;
}

export async function checkMedicalHelpAchievement(userId: string): Promise<boolean> {
  const alreadyUnlocked = await getUnlockedKeys(userId);
  if (alreadyUnlocked.has('MEDICAL_HELP')) return false;

  await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_key: 'MEDICAL_HELP',
  });

  return true;
}

export async function checkDumpScore10Achievement(userId: string): Promise<boolean> {
  const alreadyUnlocked = await getUnlockedKeys(userId);
  if (alreadyUnlocked.has('DUMP_SCORE_10')) return false;

  await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_key: 'DUMP_SCORE_10',
  });

  return true;
}
