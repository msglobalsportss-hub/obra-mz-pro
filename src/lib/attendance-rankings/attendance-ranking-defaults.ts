import type {
  AttendanceRankingSettings,
  AttendanceRankingSummary,
  AttendanceRankingMetadata,
  AttendanceRankingResult,
  DeepPartial,
} from "./attendance-ranking-types";

export const defaultAttendanceRankingSettings: AttendanceRankingSettings = {
  topLimit: 5,
  order: "BEST",
  includeInactive: false,
  minimumAttendanceDays: 1,
  minimumWorkedHours: 0,
  scoreWeights: {
    attendanceRate: 1.0,
    workedHours: 0.1,
    overtimeHours: 0.05,
    absencePenalty: 2.0,
    latePenalty: 0.5,
    costEfficiency: 0,
  },
};

/**
 * Resolução com merge profundo e sanitização estrita das configurações.
 */
export function resolveAttendanceRankingSettings(
  userSettings?: DeepPartial<AttendanceRankingSettings>
): AttendanceRankingSettings {
  if (!userSettings) return defaultAttendanceRankingSettings;

  const sanitizeNum = (val: any, fallback: number, isMinZero = true): number => {
    if (typeof val !== "number" || isNaN(val) || !isFinite(val)) return fallback;
    return isMinZero ? Math.max(0, val) : val;
  };

  const rawWeights = userSettings.scoreWeights || {};

  const scoreWeights = {
    attendanceRate: sanitizeNum(rawWeights.attendanceRate, defaultAttendanceRankingSettings.scoreWeights.attendanceRate),
    workedHours: sanitizeNum(rawWeights.workedHours, defaultAttendanceRankingSettings.scoreWeights.workedHours),
    overtimeHours: sanitizeNum(rawWeights.overtimeHours, defaultAttendanceRankingSettings.scoreWeights.overtimeHours),
    absencePenalty: sanitizeNum(rawWeights.absencePenalty, defaultAttendanceRankingSettings.scoreWeights.absencePenalty),
    latePenalty: sanitizeNum(rawWeights.latePenalty, defaultAttendanceRankingSettings.scoreWeights.latePenalty),
    costEfficiency: sanitizeNum(rawWeights.costEfficiency, 0),
  };

  const topLimitRaw = userSettings.topLimit;
  const topLimit =
    typeof topLimitRaw === "number" && !isNaN(topLimitRaw) && isFinite(topLimitRaw)
      ? Math.max(1, Math.floor(topLimitRaw))
      : defaultAttendanceRankingSettings.topLimit;

  const order = userSettings.order === "WORST" ? "WORST" : "BEST";
  const includeInactive = Boolean(userSettings.includeInactive);

  const minimumAttendanceDays = sanitizeNum(
    userSettings.minimumAttendanceDays,
    defaultAttendanceRankingSettings.minimumAttendanceDays
  );

  const minimumWorkedHours = sanitizeNum(
    userSettings.minimumWorkedHours,
    defaultAttendanceRankingSettings.minimumWorkedHours
  );

  return {
    topLimit,
    order,
    includeInactive,
    minimumAttendanceDays,
    minimumWorkedHours,
    scoreWeights,
  };
}

export function createEmptyRankingSummary(): AttendanceRankingSummary {
  return {
    totalWorkers: 0,
    eligibleWorkers: 0,
    rankedWorkers: 0,
    totalTeams: 0,
    eligibleTeams: 0,
    rankedTeams: 0,
    totalProjects: 0,
    eligibleProjects: 0,
    rankedProjects: 0,
  };
}

export function createEmptyRankingMetadata(
  filteredRecordCount = 0,
  settings: AttendanceRankingSettings = defaultAttendanceRankingSettings,
  eligibleCount = 0,
  returnedCount = 0
): AttendanceRankingMetadata {
  return {
    engineVersion: 1,
    algorithmVersion: 1,
    generatedAt: new Date().toISOString(),
    generatedBy: "attendance-ranking-engine",
    filteredRecordCount,
    rankingOrder: settings.order,
    topLimit: settings.topLimit,
    eligibleEntityCount: eligibleCount,
    returnedEntityCount: returnedCount,
  };
}

export function createDefaultRankingResult(
  filteredRecordCount = 0,
  settings: AttendanceRankingSettings = defaultAttendanceRankingSettings
): AttendanceRankingResult {
  return {
    metadata: createEmptyRankingMetadata(filteredRecordCount, settings, 0, 0),
    summary: createEmptyRankingSummary(),
    workerRankings: [],
    teamRankings: [],
    projectRankings: [],
    byDate: undefined,
    futureAnalytics: undefined,
  };
}
