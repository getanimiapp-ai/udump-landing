interface DumpSession {
  started_at: string;
  weight_delta_lbs: number | null;
  duration_seconds: number | null;
}

interface ThroneRecord {
  current_king_id: string | null;
}

interface SessionHistory {
  sessions: DumpSession[];
  thrones: ThroneRecord[];
  userId: string;
}

export function calculateDumpScore(history: SessionHistory): number {
  const { sessions, thrones, userId } = history;

  if (sessions.length === 0) return 0;

  // Factor 1: Consistency (0-10)
  const last30 = sessions.filter((s) => {
    const daysAgo = (Date.now() - new Date(s.started_at).getTime()) / 86400000;
    return daysAgo <= 30;
  });
  const consistency = Math.min((last30.length / 30) * 10, 10);

  // Factor 2: Weight Trend (0-10)
  const recent = sessions.slice(0, 10);
  const avgWeight =
    recent.reduce((sum, s) => sum + (s.weight_delta_lbs || 0), 0) / recent.length;
  const weightScore = Math.min(avgWeight * 2.5, 10); // 4 lbs = 10 points (Nick territory)

  // Factor 3: Session Length (0-10) — sweet spot is 10-30 min
  const avgDuration =
    recent.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) /
    recent.length /
    60;
  const lengthScore =
    avgDuration < 5
      ? avgDuration * 2
      : avgDuration <= 30
        ? 10
        : avgDuration <= 60
          ? Math.max(10 - (avgDuration - 30) * 0.2, 5)
          : 2; // Garret territory

  // Factor 4: Throne Activity (0-10)
  const thronesClaimed = thrones.filter((t) => t.current_king_id === userId).length;
  const throneScore = Math.min(thronesClaimed * 2, 10);

  // Weighted average
  const score =
    consistency * 0.3 +
    weightScore * 0.35 +
    lengthScore * 0.15 +
    throneScore * 0.2;

  return Math.round(score * 10) / 10;
}

export function getDumpScoreInsight(score: number, _history?: SessionHistory): string {
  if (score >= 9.5) return 'You have achieved something no one asked you to achieve. We are proud.';
  if (score >= 8.0) return 'Elite performance. Your consistency speaks for itself.';
  if (score >= 6.0) return 'Solid numbers. There is room for improvement. You know what to do.';
  if (score >= 4.0) return 'Below average. This is not an accusation. It is a data point.';
  return 'Your Dump Score™ requires immediate attention. Please take this seriously.';
}
