import type {
  AttendanceRankingItem,
  AttendanceRankingOrder,
  ScoreWeights,
  RankingScore,
} from "./attendance-ranking-types";

// Collator regional de Português (Moçambique) para desempate alfabético determinístico
const nameCollator = new Intl.Collator("pt-MZ", {
  sensitivity: "base",
  numeric: true,
});

/**
 * Fórmula explícita e normalizada do RankingScore (Escala 0 - 100).
 */
export function computeRankingScore(
  attendanceRate: number,
  absenceRate: number,
  lateRate: number,
  workedHours: number,
  overtimeHours: number,
  weights: ScoreWeights,
  maxWorkedHoursInSet: number,
  maxOvertimeHoursInSet: number
): RankingScore {
  const normAttendance = Math.min(100, Math.max(0, attendanceRate || 0));
  const normWorkedHours =
    maxWorkedHoursInSet > 0 ? Math.min(100, Math.max(0, (workedHours / maxWorkedHoursInSet) * 100)) : 0;
  const normOvertimeHours =
    maxOvertimeHoursInSet > 0 ? Math.min(100, Math.max(0, (overtimeHours / maxOvertimeHoursInSet) * 100)) : 0;
  const normAbsencePenalty = Math.min(100, Math.max(0, absenceRate || 0));
  const normLatePenalty = Math.min(100, Math.max(0, lateRate || 0));
  const normCostEfficiency = 0; // Neutro na Fase 4.3

  const positiveContrib =
    normAttendance * weights.attendanceRate +
    normWorkedHours * weights.workedHours +
    normOvertimeHours * (weights.overtimeHours || 0);

  const penalties =
    normAbsencePenalty * weights.absencePenalty + normLatePenalty * weights.latePenalty;

  const rawScore = positiveContrib - penalties;
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore * 100) / 100));

  return {
    attendanceRate: Math.round(normAttendance * 100) / 100,
    workedHours: Math.round(normWorkedHours * 100) / 100,
    overtimeHours: Math.round(normOvertimeHours * 100) / 100,
    absencePenalty: Math.round(normAbsencePenalty * 100) / 100,
    latePenalty: Math.round(normLatePenalty * 100) / 100,
    costEfficiency: normCostEfficiency,
    finalScore,
  };
}

/**
 * Comparador determinístico para ordenação (BEST / WORST).
 * Critérios de Desempate:
 * 1. Final Score
 * 2. Attendance Rate
 * 3. Worked Hours
 * 4. Nome em ordem alfabética (Intl.Collator pt-MZ)
 * 5. ID único da entidade
 */
export function compareRankingItems(
  a: AttendanceRankingItem,
  b: AttendanceRankingItem,
  order: AttendanceRankingOrder
): number {
  const mult = order === "BEST" ? 1 : -1;

  // 1. Final Score
  const scoreDiff = (b.score.finalScore - a.score.finalScore) * mult;
  if (Math.abs(scoreDiff) > 0.001) return scoreDiff;

  // 2. Attendance Rate
  const attDiff = (b.attendanceRate - a.attendanceRate) * mult;
  if (Math.abs(attDiff) > 0.001) return attDiff;

  // 3. Worked Hours
  const hoursDiff = (b.workedHours - a.workedHours) * mult;
  if (Math.abs(hoursDiff) > 0.001) return hoursDiff;

  // 4. Nome (Sempre alfabético crescente)
  const nameDiff = nameCollator.compare(a.name || "", b.name || "");
  if (nameDiff !== 0) return nameDiff;

  // 5. ID (Desempate absoluto estável)
  return (a.id || "").localeCompare(b.id || "");
}
