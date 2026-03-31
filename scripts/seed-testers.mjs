#!/usr/bin/env node
/**
 * U·Dump Tester Seed Script
 *
 * Creates auth accounts for all testers, seeds 3 weeks of realistic session
 * history, sets up thrones with real GPS coordinates, makes everyone friends,
 * and unlocks earned achievements.
 *
 * Bobby is always last. This is the law.
 *
 * Usage:
 *   node scripts/seed-testers.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').trim()];
  })
);

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Admin client bypasses RLS
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─────────────────────────────────────────────
// Tester definitions
// ─────────────────────────────────────────────

const TESTERS = [
  {
    email: 'aaron@udump.app',
    password: 'UDump2026!',
    username: 'aaron',
    displayName: 'Aaron Sherman',
    tier: 'elite',       // high stats
  },
  {
    email: 'nick@udump.app',
    password: 'UDump2026!',
    username: 'nick',
    displayName: 'Nick Perin',
    tier: 'elite',       // Nick Territory achievement holder
  },
  {
    email: 'shelden@udump.app',
    password: 'UDump2026!',
    username: 'shelden',
    displayName: 'Shelden Rahman',
    tier: 'solid',
  },
  {
    email: 'bobby@udump.app',
    password: 'UDump2026!',
    username: 'bobby',
    displayName: 'Bobby Craig',
    tier: 'bobby',       // always last — the law
  },
  {
    email: 'garret@udump.app',
    password: 'UDump2026!',
    username: 'garret',
    displayName: 'Garret Enright',
    tier: 'solid',       // The Garret achievement (60+ min sessions)
  },
  {
    email: 'jake@udump.app',
    password: 'UDump2026!',
    username: 'jake',
    displayName: 'Jake Farley',
    tier: 'solid',
  },
  {
    email: 'chris@udump.app',
    password: 'UDump2026!',
    username: 'chris',
    displayName: 'Chris Wiles',
    tier: 'casual',
  },
  {
    email: 'josh@udump.app',
    password: 'UDump2026!',
    username: 'josh',
    displayName: 'Josh Roche',
    tier: 'casual',
  },
  {
    email: 'rohit@udump.app',
    password: 'UDump2026!',
    username: 'rohit',
    displayName: 'Rohit Jesudian',
    tier: 'casual',
  },
  {
    email: 'richard@udump.app',
    password: 'UDump2026!',
    username: 'richard',
    displayName: 'Richard Nixon',
    tier: 'casual',
  },
  {
    email: 'daniel@udump.app',
    password: 'UDump2026!',
    username: 'daniel',
    displayName: 'Daniel Saldi',
    tier: 'casual',
  },
];

// Tier → session generation params
const TIER_CONFIG = {
  elite:  { sessionsPerDay: [1, 3], weightRange: [1.2, 4.5], durationRange: [300, 2400], days: 21 },
  solid:  { sessionsPerDay: [1, 2], weightRange: [0.8, 3.0], durationRange: [240, 1800], days: 18 },
  casual: { sessionsPerDay: [0, 2], weightRange: [0.5, 2.2], durationRange: [180, 1200], days: 14 },
  bobby:  { sessionsPerDay: [0, 1], weightRange: [0.1, 0.8], durationRange: [60, 300],   days: 10 },
};

// ─────────────────────────────────────────────
// Thrones — geocoded from real addresses
// ─────────────────────────────────────────────

const THRONES = [
  // Home thrones
  { name: "Aaron's Throne",    ownerUsername: 'aaron',   lat: 39.7736, lng: -86.1486, isHome: true },
  { name: "The Office Throne", ownerUsername: 'aaron',   lat: 39.8457, lng: -86.0578, isHome: false },
  { name: "Nick's Fortress",   ownerUsername: 'nick',    lat: 39.9096, lng: -86.1186, isHome: true },
  { name: "Shelden's Seat",    ownerUsername: 'shelden', lat: 39.8739, lng: -86.0156, isHome: true },
  { name: "Bobby's Throne",    ownerUsername: 'bobby',   lat: 39.9601, lng: -86.0028, isHome: true },
  { name: "Garret's Outpost",  ownerUsername: 'garret',  lat: 37.2701, lng: -79.9481, isHome: true },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function round2(n) { return Math.round(n * 100) / 100; }

function generateSessions(tier, userId, startDay) {
  const cfg = TIER_CONFIG[tier];
  const sessions = [];
  const now = Date.now();

  for (let d = 0; d < cfg.days; d++) {
    const dayOffset = (cfg.days - d) * 86400000;
    const dayBase = now - dayOffset;
    const count = randInt(cfg.sessionsPerDay[0], cfg.sessionsPerDay[1]);

    for (let s = 0; s < count; s++) {
      // Random time of day: 5am - 11pm
      const hourOffset = rand(5, 23) * 3600000;
      const startedAt = new Date(dayBase + hourOffset);
      const duration = randInt(cfg.durationRange[0], cfg.durationRange[1]);
      const endedAt = new Date(startedAt.getTime() + duration * 1000);

      // 75% chance of having weight data
      let weightBefore = null;
      let weightAfter = null;
      let weightDelta = null;
      if (Math.random() < 0.75) {
        weightBefore = round2(rand(150, 220));
        weightDelta = round2(rand(cfg.weightRange[0], cfg.weightRange[1]));
        weightAfter = round2(weightBefore - weightDelta);
      }

      sessions.push({
        user_id: userId,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: duration,
        weight_before_lbs: weightBefore,
        weight_after_lbs: weightAfter,
        weight_delta_lbs: weightDelta,
        is_personal_record: false, // we'll mark these after
        throne_claimed: false,
      });
    }
  }

  // Mark personal records (heaviest weight_delta at time of session)
  let maxSoFar = 0;
  for (const s of sessions) {
    if (s.weight_delta_lbs != null && s.weight_delta_lbs > maxSoFar) {
      maxSoFar = s.weight_delta_lbs;
      s.is_personal_record = true;
    }
  }

  // Special: give Garret at least one 60+ min session (The Garret achievement)
  if (tier === 'solid' && sessions.length > 3) {
    const garretSession = sessions[Math.floor(sessions.length / 2)];
    garretSession.duration_seconds = randInt(3600, 4200);
    garretSession.ended_at = new Date(
      new Date(garretSession.started_at).getTime() + garretSession.duration_seconds * 1000
    ).toISOString();
  }

  // Special: give Nick at least one 4+ lb session (Nick Territory achievement)
  if (tier === 'elite' && sessions.length > 3) {
    const nickSession = sessions[sessions.length - 2];
    if (nickSession.weight_before_lbs) {
      nickSession.weight_delta_lbs = round2(rand(4.0, 4.8));
      nickSession.weight_after_lbs = round2(nickSession.weight_before_lbs - nickSession.weight_delta_lbs);
      nickSession.is_personal_record = true;
    }
  }

  return sessions;
}

function computeAchievements(sessions, username) {
  const earned = [];
  const totalSessions = sessions.filter(s => s.ended_at).length;
  const maxWeight = Math.max(0, ...sessions.filter(s => s.weight_delta_lbs).map(s => s.weight_delta_lbs));
  const maxDuration = Math.max(0, ...sessions.map(s => s.duration_seconds));

  // Session count
  if (totalSessions >= 1) earned.push('FIRST_BLOOD');
  if (totalSessions >= 100) earned.push('DUMPOLOGIST');

  // Weight milestones
  if (maxWeight >= 1.0) earned.push('POUND_CLUB');
  if (maxWeight >= 2.0) earned.push('TWO_POUND_CLUB');
  if (maxWeight >= 3.0) earned.push('THREE_POUND_CLUB');
  if (maxWeight >= 4.0) earned.push('NICK_TERRITORY');

  // Duration milestones
  if (maxDuration >= 3600) earned.push('HOUR_CLUB');
  if (maxDuration >= 7200) earned.push('TWO_HOURS');

  // Streak — compute from sessions
  const daySet = new Set(sessions.map(s => new Date(s.started_at).toDateString()));
  let streak = 0;
  let cursor = new Date();
  while (daySet.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  if (streak >= 7) earned.push('STREAK_7');
  if (streak >= 30) earned.push('STREAK_30');

  // Time-based
  const hasEarly = sessions.some(s => new Date(s.started_at).getHours() < 7);
  const hasLate = sessions.some(s => new Date(s.started_at).getHours() >= 0 && new Date(s.started_at).getHours() < 3);
  if (hasEarly) earned.push('MORNING_PERSON');
  if (hasLate) earned.push('MIDNIGHT_THRONE');

  // Speed run: under 5 min + over 1 lb
  const hasSpeedRun = sessions.some(s => s.duration_seconds < 300 && s.weight_delta_lbs && s.weight_delta_lbs >= 1.0);
  if (hasSpeedRun) earned.push('SPEED_RUN');

  return earned;
}

function computeProfileStats(sessions) {
  const completed = sessions.filter(s => s.ended_at);
  const totalSessions = completed.length;
  const totalWeight = completed.reduce((sum, s) => sum + (s.weight_delta_lbs || 0), 0);
  const lastSession = completed.length ? completed[completed.length - 1] : null;

  // Streak
  const daySet = new Set(completed.map(s => new Date(s.started_at).toDateString()));
  let streak = 0;
  let cursor = new Date();
  while (daySet.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Dump score — simplified version
  const consistencyScore = Math.min(10, (totalSessions / 30) * 10);
  const weightScore = totalWeight > 0 ? Math.min(10, (totalWeight / totalSessions) * 4) : 0;
  const sessionLengthAvg = completed.reduce((sum, s) => sum + s.duration_seconds, 0) / (totalSessions || 1);
  const lengthScore = Math.min(10, (sessionLengthAvg / 600) * 8);
  const dumpScore = round2(Math.min(10, (consistencyScore * 0.3 + weightScore * 0.35 + lengthScore * 0.25 + Math.min(10, streak) * 0.1)));

  return {
    total_sessions: totalSessions,
    total_weight_lbs: round2(totalWeight),
    streak_days: streak,
    dump_score: dumpScore,
    last_session_at: lastSession?.ended_at || null,
  };
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.log('🏰 U·Dump Tester Seed Script');
  console.log('============================\n');

  const userMap = {}; // username → { id, ... }

  // Step 1: Create auth users + profiles
  console.log('Step 1: Creating auth accounts...');
  for (const tester of TESTERS) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === tester.email);

    let userId;
    if (existing) {
      console.log(`  ✓ ${tester.displayName} already exists (${existing.id})`);
      userId = existing.id;
    } else {
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: tester.email,
        password: tester.password,
        email_confirm: true,
        user_metadata: {
          username: tester.username,
          display_name: tester.displayName,
        },
      });
      if (error) {
        console.error(`  ✗ Failed to create ${tester.displayName}: ${error.message}`);
        continue;
      }
      console.log(`  ✓ Created ${tester.displayName} (${newUser.user.id})`);
      userId = newUser.user.id;
    }

    // Upsert profile
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      username: tester.username,
      display_name: tester.displayName,
    }, { onConflict: 'id' });

    if (profileErr) {
      console.error(`  ✗ Profile error for ${tester.displayName}: ${profileErr.message}`);
    }

    userMap[tester.username] = { id: userId, tier: tester.tier, displayName: tester.displayName };
  }

  console.log(`\n  ${Object.keys(userMap).length} users ready.\n`);

  // Step 2: Create thrones
  console.log('Step 2: Creating thrones...');
  const throneMap = {}; // name → id
  for (const throne of THRONES) {
    const ownerId = userMap[throne.ownerUsername]?.id;
    if (!ownerId) {
      console.log(`  ⏭ Skipping ${throne.name} (owner ${throne.ownerUsername} not found)`);
      continue;
    }

    // Check if throne already exists for this owner at these coords
    const { data: existing } = await supabase.from('thrones')
      .select('id')
      .eq('name', throne.name)
      .eq('owner_user_id', ownerId)
      .limit(1)
      .single();

    if (existing) {
      console.log(`  ✓ ${throne.name} already exists`);
      throneMap[throne.name] = existing.id;
      continue;
    }

    const { data: newThrone, error } = await supabase.from('thrones').insert({
      name: throne.name,
      owner_user_id: ownerId,
      current_king_id: ownerId,
      current_king_weight_lbs: 0,
      lat: throne.lat,
      lng: throne.lng,
      is_home: throne.isHome,
    }).select().single();

    if (error) {
      console.error(`  ✗ Failed to create ${throne.name}: ${error.message}`);
    } else {
      console.log(`  ✓ Created ${throne.name}`);
      throneMap[throne.name] = newThrone.id;
    }
  }
  console.log();

  // Step 3: Generate and insert sessions
  console.log('Step 3: Seeding session history...');
  const allSessionsByUser = {};

  for (const [username, user] of Object.entries(userMap)) {
    const sessions = generateSessions(user.tier, user.id, 0);

    // Assign some sessions to thrones (home throne mostly)
    const ownerThrone = THRONES.find(t => t.ownerUsername === username && t.isHome);
    if (ownerThrone && throneMap[ownerThrone.name]) {
      const throneId = throneMap[ownerThrone.name];
      for (const s of sessions) {
        if (Math.random() < 0.6) { // 60% of sessions at home throne
          s.throne_id = throneId;
        }
      }
    }

    // Insert in batches of 50
    let inserted = 0;
    for (let i = 0; i < sessions.length; i += 50) {
      const batch = sessions.slice(i, i + 50);
      const { error } = await supabase.from('dump_sessions').insert(batch);
      if (error) {
        console.error(`  ✗ Sessions batch error for ${username}: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }
    console.log(`  ✓ ${username}: ${inserted} sessions`);
    allSessionsByUser[username] = sessions;
  }
  console.log();

  // Step 4: Throne claiming — Aaron claims Bobby's throne (the founding claim)
  console.log('Step 4: Throne claiming...');
  const aaronId = userMap.aaron?.id;
  const bobbyThroneId = throneMap["Bobby's Throne"];
  if (aaronId && bobbyThroneId) {
    // Aaron's heaviest session claims Bobby's throne
    const aaronSessions = allSessionsByUser.aaron || [];
    const heaviest = aaronSessions
      .filter(s => s.weight_delta_lbs)
      .sort((a, b) => b.weight_delta_lbs - a.weight_delta_lbs)[0];

    if (heaviest) {
      await supabase.from('thrones').update({
        current_king_id: aaronId,
        current_king_weight_lbs: heaviest.weight_delta_lbs,
      }).eq('id', bobbyThroneId);
      console.log(`  ✓ Aaron claimed Bobby's Throne (${heaviest.weight_delta_lbs} lbs)`);
    }
  }

  // Nick claims his own throne with a big number
  const nickId = userMap.nick?.id;
  const nickThroneId = throneMap["Nick's Fortress"];
  if (nickId && nickThroneId) {
    const nickSessions = allSessionsByUser.nick || [];
    const heaviest = nickSessions
      .filter(s => s.weight_delta_lbs)
      .sort((a, b) => b.weight_delta_lbs - a.weight_delta_lbs)[0];
    if (heaviest) {
      await supabase.from('thrones').update({
        current_king_id: nickId,
        current_king_weight_lbs: heaviest.weight_delta_lbs,
      }).eq('id', nickThroneId);
      console.log(`  ✓ Nick holds Nick's Fortress (${heaviest.weight_delta_lbs} lbs)`);
    }
  }

  // Update all home thrones with owner's best weight
  for (const throne of THRONES) {
    const ownerId = userMap[throne.ownerUsername]?.id;
    const tid = throneMap[throne.name];
    if (!ownerId || !tid) continue;

    // Skip Bobby's throne (Aaron claimed it)
    if (throne.name === "Bobby's Throne") continue;
    // Skip Nick's (already done)
    if (throne.name === "Nick's Fortress") continue;

    const sessions = allSessionsByUser[throne.ownerUsername] || [];
    const best = sessions
      .filter(s => s.weight_delta_lbs)
      .sort((a, b) => b.weight_delta_lbs - a.weight_delta_lbs)[0];
    if (best) {
      await supabase.from('thrones').update({
        current_king_id: ownerId,
        current_king_weight_lbs: best.weight_delta_lbs,
      }).eq('id', tid);
    }
  }
  console.log(`  ✓ All throne records updated\n`);

  // Step 5: Make everyone friends (all accepted)
  console.log('Step 5: Setting up friendships...');
  const userIds = Object.values(userMap).map(u => u.id);
  let friendshipCount = 0;
  for (let i = 0; i < userIds.length; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      // Insert both directions for easy querying
      const { error: e1 } = await supabase.from('friendships').upsert({
        user_id: userIds[i],
        friend_id: userIds[j],
        status: 'accepted',
      }, { onConflict: 'user_id,friend_id', ignoreDuplicates: true });

      const { error: e2 } = await supabase.from('friendships').upsert({
        user_id: userIds[j],
        friend_id: userIds[i],
        status: 'accepted',
      }, { onConflict: 'user_id,friend_id', ignoreDuplicates: true });

      if (!e1 && !e2) friendshipCount++;
    }
  }
  console.log(`  ✓ ${friendshipCount} friendships created (everyone knows everyone)\n`);

  // Step 6: Achievements
  console.log('Step 6: Unlocking achievements...');
  for (const [username, user] of Object.entries(userMap)) {
    const sessions = allSessionsByUser[username] || [];
    const keys = computeAchievements(sessions, username);

    if (keys.length === 0) continue;

    const rows = keys.map(key => ({
      user_id: user.id,
      achievement_key: key,
      unlocked_at: new Date(Date.now() - randInt(1, 14) * 86400000).toISOString(),
    }));

    const { error } = await supabase.from('user_achievements').upsert(rows, {
      onConflict: 'user_id,achievement_key',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error(`  ✗ Achievement error for ${username}: ${error.message}`);
    } else {
      console.log(`  ✓ ${username}: ${keys.join(', ')}`);
    }
  }
  console.log();

  // Step 7: Update profile stats
  console.log('Step 7: Updating profile stats...');
  for (const [username, user] of Object.entries(userMap)) {
    const sessions = allSessionsByUser[username] || [];
    const stats = computeProfileStats(sessions);

    const { error } = await supabase.from('profiles').update(stats).eq('id', user.id);
    if (error) {
      console.error(`  ✗ Stats error for ${username}: ${error.message}`);
    } else {
      console.log(`  ✓ ${username}: ${stats.total_sessions} sessions, ${stats.total_weight_lbs} lbs, score ${stats.dump_score}, streak ${stats.streak_days}d`);
    }
  }
  console.log();

  // Step 8: Seed some notification events for the feed
  console.log('Step 8: Seeding activity feed notifications...');
  const notifications = [];

  // Aaron claimed Bobby's throne
  if (aaronId && userMap.bobby?.id && bobbyThroneId) {
    notifications.push({
      from_user_id: aaronId,
      to_user_id: userMap.bobby.id,
      type: 'throne_claimed',
      throne_id: bobbyThroneId,
      payload: { name: 'Aaron Sherman', location: "Bobby's Throne" },
      sent_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    });
  }

  // Nick set a record
  if (nickId) {
    for (const [, other] of Object.entries(userMap)) {
      if (other.id !== nickId) {
        notifications.push({
          from_user_id: nickId,
          to_user_id: other.id,
          type: 'record_broken',
          payload: { name: 'Nick Perin', lbs: 4.3 },
          sent_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        });
      }
    }
  }

  if (notifications.length > 0) {
    const { error } = await supabase.from('notification_events').insert(notifications);
    if (error) {
      console.error(`  ✗ Notification error: ${error.message}`);
    } else {
      console.log(`  ✓ ${notifications.length} notifications seeded`);
    }
  }

  // ─────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────

  console.log('\n============================');
  console.log('SEED COMPLETE\n');
  console.log('Login credentials (same password for everyone):');
  console.log('  Password: UDump2026!\n');
  console.log('Accounts:');
  for (const t of TESTERS) {
    const stats = allSessionsByUser[t.username]
      ? computeProfileStats(allSessionsByUser[t.username])
      : null;
    console.log(`  ${t.displayName.padEnd(20)} ${t.email.padEnd(24)} Score: ${stats?.dump_score ?? '?'}  Sessions: ${stats?.total_sessions ?? '?'}`);
  }
  console.log('\nBobby is last. As it should be. 👑');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
