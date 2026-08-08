import { db } from "../db";
import { sql } from "drizzle-orm";

export type WorkoutType = "amrap" | "for_time" | "max_reps" | "max_weight" | "max_distance" | "max_calories";
export type ScoreStatus = "pending" | "validated" | "rejected" | "dns" | "dq" | "dnf";

export function isLowerBetter(type: WorkoutType | string): boolean {
  return type === "for_time";
}

export function formatScoreDisplay(scoreNumeric: number | null, type: WorkoutType | string, status?: string): string {
  if (status === "dns") return "DNS";
  if (status === "dq") return "DQ";
  if (scoreNumeric === null) return "—";
  if (type === "for_time") {
    const mins = Math.floor(scoreNumeric / 60);
    const secs = scoreNumeric % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }
  if (type === "max_weight") return `${scoreNumeric}kg`;
  if (type === "max_distance") return `${scoreNumeric}m`;
  if (type === "max_calories") return `${scoreNumeric} cal`;
  return String(scoreNumeric);
}

export function parseTimeToSeconds(time: string): number {
  if (!time) return 0;
  const parts = time.split(":").map(Number);
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  return Number(time) || 0;
}

export interface LeaderboardEntry {
  registrationId: string;
  userId: string;
  teamName: string | null;
  firstName: string | null;
  lastName: string | null;
  rank: number;
  previousRank: number | null;
  totalPoints: number;
  workoutScores: {
    workoutId: string;
    workoutName: string;
    workoutType: string;
    score: string | null;
    scoreNumeric: number | null;
    place: number | null;
    points: number | null;
    status: ScoreStatus;
    isPublic: boolean;
  }[];
}

/**
 * Calculate rankings for a single workout, returning ranked entries.
 * DNS = last + 1 pts, DQ = last + 2 pts, DNF = behind finishers, ranked by reps.
 */
export async function calculateWorkoutRankings(
  competitionId: string,
  workoutId: string
): Promise<Array<{ registrationId: string; place: number; points: number; score: string | null; scoreNumeric: number | null; status: string }>> {
  const workoutRes = await db.execute(sql`SELECT id, type FROM competition_workouts WHERE id = ${workoutId}`);
  if (!workoutRes.rows.length) return [];
  const wType = (workoutRes.rows[0] as any).type as WorkoutType;
  const lowerBetter = isLowerBetter(wType);

  const scoresRes = await db.execute(sql`
    SELECT cs.registration_id, cs.score_numeric, cs.score, cs.status, cs.dnf_reps
    FROM competition_scores cs
    JOIN competition_registrations cr ON cr.id = cs.registration_id
    WHERE cr.competition_id = ${competitionId} AND cs.workout_id = ${workoutId}
  `);
  const rows = scoresRes.rows as any[];

  const finishers = rows.filter(s => s.status !== "dns" && s.status !== "dq" && s.status !== "dnf");
  const dnfRows = rows.filter(s => s.status === "dnf");
  const dnsRows = rows.filter(s => s.status === "dns");
  const dqRows = rows.filter(s => s.status === "dq");

  finishers.sort((a, b) => lowerBetter
    ? (a.score_numeric ?? Infinity) - (b.score_numeric ?? Infinity)
    : (b.score_numeric ?? -Infinity) - (a.score_numeric ?? -Infinity));
  dnfRows.sort((a, b) => (b.dnf_reps ?? 0) - (a.dnf_reps ?? 0));

  const result: Array<{ registrationId: string; place: number; points: number; score: string | null; scoreNumeric: number | null; status: string }> = [];
  let currentPlace = 1;

  for (let i = 0; i < finishers.length; i++) {
    const f = finishers[i];
    const isTied = i > 0 && f.score_numeric === finishers[i - 1].score_numeric;
    const place = isTied ? result[result.length - 1].place : currentPlace;
    result.push({ registrationId: f.registration_id, place, points: place, score: f.score, scoreNumeric: f.score_numeric, status: f.status });
    currentPlace = i + 2;
  }

  for (const d of dnfRows) {
    const displayScore = `DNF (${d.dnf_reps ?? 0} reps)`;
    result.push({ registrationId: d.registration_id, place: currentPlace, points: currentPlace, score: displayScore, scoreNumeric: d.dnf_reps, status: "dnf" });
    currentPlace++;
  }

  const lastValidPlace = currentPlace - 1;
  for (const d of dnsRows) result.push({ registrationId: d.registration_id, place: lastValidPlace + 1, points: lastValidPlace + 1, score: "DNS", scoreNumeric: null, status: "dns" });
  for (const d of dqRows) result.push({ registrationId: d.registration_id, place: lastValidPlace + 2, points: lastValidPlace + 2, score: "DQ", scoreNumeric: null, status: "dq" });

  return result;
}

/**
 * Calculate the full leaderboard for a competition category.
 */
export async function calculateLeaderboard(
  competitionId: string,
  categoryId: string,
  includePrivate = false
): Promise<LeaderboardEntry[]> {
  const registrations = await db.execute(sql`
    SELECT cr.id, cr.user_id, cr.team_name, u.first_name, u.last_name
    FROM competition_registrations cr
    JOIN users u ON u.id = cr.user_id
    WHERE cr.competition_id = ${competitionId}
      AND cr.category_id = ${categoryId}
      AND cr.status IN ('confirmed', 'checked_in')
  `);
  if (!registrations.rows.length) return [];

  const workoutsRes = await db.execute(sql`
    SELECT id, name, type, sort_order, is_public, scores_visible
    FROM competition_workouts
    WHERE competition_id = ${competitionId}
    ORDER BY sort_order ASC
  `);
  if (!workoutsRes.rows.length) return [];

  const allWorkouts = workoutsRes.rows as any[];

  const scoresRes = await db.execute(sql`
    SELECT cs.registration_id, cs.workout_id, cs.score, cs.score_numeric, cs.status, cs.dnf_reps
    FROM competition_scores cs
    JOIN competition_registrations cr ON cr.id = cs.registration_id
    WHERE cr.competition_id = ${competitionId} AND cr.category_id = ${categoryId}
  `);

  const scoreMap = new Map<string, Map<string, any>>();
  for (const s of scoresRes.rows as any[]) {
    if (!scoreMap.has(s.registration_id)) scoreMap.set(s.registration_id, new Map());
    scoreMap.get(s.registration_id)!.set(s.workout_id, s);
  }

  // Calculate per-workout placements
  const workoutPlacements = new Map<string, Map<string, { place: number; points: number }>>();

  for (const workout of allWorkouts) {
    const wid = workout.id;
    const lowerBetter = isLowerBetter(workout.type);
    const regs = registrations.rows as any[];

    const wEntries = regs.map(reg => ({ regId: reg.id, s: scoreMap.get(reg.id)?.get(wid) ?? null }));
    const finishers = wEntries.filter(x => x.s && !["dns", "dq", "dnf"].includes(x.s.status));
    const dnfList = wEntries.filter(x => x.s?.status === "dnf");
    const dnsList = wEntries.filter(x => x.s?.status === "dns");
    const dqList = wEntries.filter(x => x.s?.status === "dq");

    finishers.sort((a, b) => lowerBetter
      ? (a.s?.score_numeric ?? Infinity) - (b.s?.score_numeric ?? Infinity)
      : (b.s?.score_numeric ?? -Infinity) - (a.s?.score_numeric ?? -Infinity));
    dnfList.sort((a, b) => (b.s?.dnf_reps ?? 0) - (a.s?.dnf_reps ?? 0));

    const placements = new Map<string, { place: number; points: number }>();
    let currentPlace = 1;

    for (let i = 0; i < finishers.length; i++) {
      const prev = finishers[i - 1];
      const cur = finishers[i];
      const isTied = prev && cur.s?.score_numeric === prev.s?.score_numeric;
      const place = isTied ? placements.get(prev.regId)!.place : currentPlace;
      placements.set(cur.regId, { place, points: place });
      currentPlace = i + 2;
    }
    for (const d of dnfList) { placements.set(d.regId, { place: currentPlace, points: currentPlace }); currentPlace++; }
    const lastPlace = currentPlace - 1;
    for (const d of dnsList) placements.set(d.regId, { place: lastPlace + 1, points: lastPlace + 1 });
    for (const d of dqList) placements.set(d.regId, { place: lastPlace + 2, points: lastPlace + 2 });

    workoutPlacements.set(wid, placements);
  }

  // Previous ranks
  const prevCache = await db.execute(sql`
    SELECT registration_id, rank FROM competition_leaderboard_cache
    WHERE competition_id = ${competitionId} AND category_id = ${categoryId}
  `);
  const prevRankMap = new Map((prevCache.rows as any[]).map(r => [r.registration_id, r.rank]));

  const entries: LeaderboardEntry[] = (registrations.rows as any[]).map(reg => {
    const workoutScoresArr = allWorkouts.map(workout => {
      const score = scoreMap.get(reg.id)?.get(workout.id);
      const placement = workoutPlacements.get(workout.id)?.get(reg.id);
      const isPublic = includePrivate || workout.is_public === true;
      const displayScore = score?.status === "dnf"
        ? `DNF (${score.dnf_reps ?? 0} reps)`
        : score?.score ?? null;
      return {
        workoutId: workout.id,
        workoutName: workout.name,
        workoutType: workout.type,
        score: isPublic ? displayScore : null,
        scoreNumeric: isPublic ? (score?.score_numeric ?? null) : null,
        place: isPublic ? (placement?.place ?? null) : null,
        points: placement?.points ?? null,
        status: (score?.status ?? "not_submitted") as ScoreStatus,
        isPublic,
      };
    });

    const hasScoredWorkouts = workoutScoresArr.some(ws => ws.points !== null);
    const totalPoints = workoutScoresArr.reduce((sum, ws) =>
      ws.points !== null ? sum + ws.points : sum, 0);

    return {
      registrationId: reg.id,
      userId: reg.user_id,
      teamName: reg.team_name,
      firstName: reg.first_name,
      lastName: reg.last_name,
      rank: 0,
      previousRank: prevRankMap.get(reg.id) ?? null,
      totalPoints: hasScoredWorkouts ? totalPoints : 999999,
      workoutScores: workoutScoresArr,
    };
  });

  // Sort: lowest total points wins; count-back tiebreaker
  entries.sort((a, b) => {
    if (a.totalPoints !== b.totalPoints) return a.totalPoints - b.totalPoints;
    const aPlaces = a.workoutScores.map(w => w.place ?? 999).sort((x, y) => x - y);
    const bPlaces = b.workoutScores.map(w => w.place ?? 999).sort((x, y) => x - y);
    for (let i = 0; i < Math.max(aPlaces.length, bPlaces.length); i++) {
      if ((aPlaces[i] ?? 999) !== (bPlaces[i] ?? 999)) return (aPlaces[i] ?? 999) - (bPlaces[i] ?? 999);
    }
    return 0;
  });

  entries.forEach((entry, idx) => { entry.rank = idx + 1; });
  return entries;
}

export async function refreshLeaderboardCache(
  competitionId: string,
  categoryId?: string
): Promise<void> {
  let catIds: string[];
  if (categoryId) {
    catIds = [categoryId];
  } else {
    const res = await db.execute(sql`SELECT id FROM competition_categories WHERE competition_id = ${competitionId}`);
    catIds = (res.rows as any[]).map(r => r.id);
  }

  for (const catId of catIds) {
    const entries = await calculateLeaderboard(competitionId, catId, true);
    await db.execute(sql`DELETE FROM competition_leaderboard_cache WHERE competition_id = ${competitionId} AND category_id = ${catId}`);
    for (const entry of entries) {
      await db.execute(sql`
        INSERT INTO competition_leaderboard_cache (id, competition_id, category_id, registration_id, total_points, rank, last_updated_at)
        VALUES (gen_random_uuid(), ${competitionId}, ${catId}, ${entry.registrationId}, ${entry.totalPoints}, ${entry.rank}, NOW())
      `);
    }
  }
}

export async function getLeaderboard(competitionId: string, categoryId: string): Promise<LeaderboardEntry[]> {
  return calculateLeaderboard(competitionId, categoryId, false);
}
